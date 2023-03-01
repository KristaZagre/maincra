import { keccak256, pack } from '@ethersproject/solidity'
import { getReservesAbi } from '@sushiswap/abi'
import { ChainId } from '@sushiswap/chain'
import { Token } from '@sushiswap/currency'
import { ADDITIONAL_BASES, BASES_TO_CHECK_TRADES_AGAINST } from '@sushiswap/smart-order-router-config'
import { ConstantProductRPool, RPool, RToken } from '@sushiswap/tines'
import { add, getUnixTime } from 'date-fns'
import { BigNumber } from 'ethers'
import { getCreate2Address } from 'ethers/lib/utils'
import { Address, PublicClient } from 'viem'

import { getPoolsByTokenIds, getTopPools, PoolResponse } from '../lib/api'
import { ConstantProductPoolCode } from '../pools/ConstantProductPool'
import type { PoolCode } from '../pools/PoolCode'
import { LiquidityProvider, LiquidityProviders } from './LiquidityProvider'
interface PoolInfo {
  poolCode: PoolCode
  validUntilTimestamp: number
}

export abstract class UniswapV2BaseProvider extends LiquidityProvider {
  readonly TOP_POOL_SIZE = 155
  readonly TOP_POOL_LIQUIDITY_THRESHOLD = 5000
  readonly ON_DEMAND_POOL_SIZE = 20
  readonly REFRESH_INITIAL_POOLS_INTERVAL = 60 // SECONDS

  initialPools: Map<string, PoolCode> = new Map()
  onDemandPools: Map<string, PoolInfo> = new Map()
  poolsByTrade: Map<string, string[]> = new Map()
  abscentInitialPools: Map<string, PoolCode> = new Map()
  abscentOnDemandPools: Map<string, PoolCode> = new Map()

  blockListener?: () => void
  unwatchBlockNumber?: () => void

  fee = 0.003
  isInitialized = false
  factory: { [chainId: number]: Address } = {}
  initCodeHash: { [chainId: number]: string } = {}
  refreshInitialPoolsTimestamp = getUnixTime(add(Date.now(), { seconds: this.REFRESH_INITIAL_POOLS_INTERVAL }))

  constructor(
    chainId: ChainId,
    client: PublicClient,
    factory: { [chainId: number]: Address },
    initCodeHash: { [chainId: number]: string }
  ) {
    super(chainId, client)
    this.factory = factory
    this.initCodeHash = initCodeHash
    if (!(chainId in this.factory) || !(chainId in this.initCodeHash)) {
      throw new Error(`${this.getType()} cannot be instantiated for chainid ${chainId}, no factory or initCodeHash`)
    }
  }

  async initialize() {
    this.isInitialized = true
    const topPools = await this.getInitialPools()

    if (topPools.size > 0) {
      console.debug(`${this.getLogPrefix()} - INIT: top pools found: ${topPools.size}`)
    } else {
      console.debug(`${this.getLogPrefix()} - INIT: NO top pools found.`)
    }

    const allStaticPools = this.generateStaticInitialPools()
    const staticPoolMap = Array.from(allStaticPools).reduce((acc, [poolAddress, tokens]) => {
      if (!topPools.has(poolAddress)) {
        acc.set(poolAddress, tokens)
      }
      return acc
    }, new Map<string, [Token, Token]>())
    console.debug(
      `${this.getLogPrefix()} - INIT: Generated ${allStaticPools.size} pools, keeping ${
        staticPoolMap.size
      }, diff is top pools.`
    )

    const topPoolsReservePromise = this.client
      .multicall({
        multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
        allowFailure: true,
        contracts: Array.from(topPools.values()).map(
          (pool) =>
            ({
              address: pool.address as Address,
              chainId: this.chainId,
              abi: getReservesAbi,
              functionName: 'getReserves',
            } as const)
        ),
      })
      .catch((e) => {
        console.warn(`${this.getLogPrefix()} - INIT: top pool multicall failed, message: ${e.message}`)
        return undefined
      })

    const staticPoolsReservePromise = this.client
      .multicall({
        multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
        allowFailure: true,
        contracts: [...staticPoolMap.keys()].map(
          (poolAddress) =>
            ({
              address: poolAddress as Address,
              chainId: this.chainId,
              abi: getReservesAbi,
              functionName: 'getReserves',
            } as const)
        ),
      })
      .catch((e) => {
        console.warn(`${this.getLogPrefix()} - INIT: Static pool multicall failed, message: ${e.message}`)
        return undefined
      })

    const [topPoolsReserves, staticPoolsReserves] = await Promise.all([
      topPoolsReservePromise,
      staticPoolsReservePromise,
    ])

    Array.from(topPools.values()).forEach((pool, i) => {
      const res0 = topPoolsReserves?.[i]?.result?.[0]
      const res1 = topPoolsReserves?.[i]?.result?.[1]

      if (res0 && res1) {
        const toks = [pool.token0, pool.token1]

        const rPool = new ConstantProductRPool(
          pool.address,
          toks[0] as RToken,
          toks[1] as RToken,
          this.fee,
          BigNumber.from(res0),
          BigNumber.from(res1)
        )
        const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
        this.initialPools.set(pool.address, pc)
      } else {
        console.error(
          `${this.getLogPrefix()} - ERROR fetchin reserves, Failed to fetch reserves for pool: ${pool.address}`
        )
        return
      }
    })
    let staticPoolsFound = 0
    Array.from(staticPoolMap.entries()).forEach(([poolAddress, [token0, token1]], i) => {
      const res0 = staticPoolsReserves?.[i]?.result?.[0]
      const res1 = staticPoolsReserves?.[i]?.result?.[1]
      const rPool = new ConstantProductRPool(
        poolAddress,
        token0 as RToken,
        token1 as RToken,
        this.fee,
        BigNumber.from(0),
        BigNumber.from(0)
      )
      const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
      if (res0 && res1) {
        pc.pool.updateReserves(BigNumber.from(res0), BigNumber.from(res1))
        this.initialPools.set(poolAddress, pc)
        staticPoolsFound++
      } else {
        // console.log(`${this.getLogPrefix()} - INIT: Pool ${poolAddress} (${token0.symbol}/${token1.symbol}) may not exist, saving pool to be continuously tracked.`)
        this.abscentInitialPools.set(poolAddress, pc)
      }
    })

    console.debug(
      `${this.getLogPrefix()} - INIT, WATCHING ${
        this.initialPools.size
      } POOLS. ${staticPoolsFound} static pools found, ${this.abscentInitialPools.size} abscent pools.`
    )
  }

  private async getInitialPools(): Promise<Map<string, PoolResponse>> {
    return await getTopPools(
      this.chainId,
      this.getType() === LiquidityProviders.UniswapV2 ? 'Uniswap' : this.getType(),
      this.getType() === LiquidityProviders.SushiSwap ? 'LEGACY' : 'V2',
      ['CONSTANT_PRODUCT_POOL'],
      this.TOP_POOL_SIZE,
      this.TOP_POOL_LIQUIDITY_THRESHOLD
    )
  }

  async getOnDemandPools(t0: Token, t1: Token): Promise<void> {
    const type = this.getType()

    const poolsFromApiMap = await getPoolsByTokenIds(
      this.chainId,
      type === LiquidityProviders.UniswapV2 ? 'Uniswap' : type,
      type === LiquidityProviders.SushiSwap ? 'LEGACY' : 'V2',
      ['CONSTANT_PRODUCT_POOL'],
      t0.address,
      t1.address,
      this.TOP_POOL_SIZE,
      this.TOP_POOL_LIQUIDITY_THRESHOLD,
      this.ON_DEMAND_POOL_SIZE
    )
    const validUntilTimestamp = getUnixTime(add(Date.now(), { seconds: this.ON_DEMAND_POOLS_LIFETIME_IN_SECONDS }))

    const poolsFromApi = Array.from(poolsFromApiMap.values()).filter((pool) => !this.initialPools.has(pool.address))
    const generatedStaticPools = this.generateStaticOnDemandPools(t0, t1)

    let staticPoolsCreated = 0
    let staticPoolsUpdated = 0
    let staticPoolsAbscent = 0
    const staticPools = Array.from(generatedStaticPools).reduce((acc, [poolAddress, tokens]) => {
      if (
        !poolsFromApiMap.has(poolAddress) &&
        !this.initialPools.has(poolAddress) &&
        !this.abscentOnDemandPools.has(poolAddress)
      ) {
        const existingPool = this.onDemandPools.get(poolAddress)
        if (!existingPool) {
          acc.set(poolAddress, tokens)
        } else {
          existingPool.validUntilTimestamp = validUntilTimestamp
          staticPoolsUpdated++
        }
      }
      return acc
    }, new Map<string, [Token, Token]>())
    console.debug(
      `${this.getLogPrefix()} - ON DEMAND: Saving ${staticPools.size} out of ${
        generatedStaticPools.size
      } generated static pools.`
    )

    const poolsAddresses = [...poolsFromApi.map((pool) => pool.address), ...staticPools.keys()]

    this.poolsByTrade.set(this.getTradeId(t0, t1), poolsAddresses)

    let apiPoolsCreated = 0
    let apiPoolsUpdated = 0
    poolsFromApi.forEach((pool) => {
      const existingPool = this.onDemandPools.get(pool.address)
      if (existingPool === undefined) {
        const toks = [pool.token0, pool.token1]
        const rPool = new ConstantProductRPool(
          pool.address,
          toks[0] as RToken,
          toks[1] as RToken,
          this.fee,
          BigNumber.from(0),
          BigNumber.from(0)
        )

        const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
        this.onDemandPools.set(pool.address, { poolCode: pc, validUntilTimestamp })
        ++apiPoolsCreated
      } else {
        existingPool.validUntilTimestamp = validUntilTimestamp
        ++apiPoolsUpdated
      }
    })

    if (staticPools.size > 0) {
      const staticPoolsReserve = await this.client
        .multicall({
          multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
          allowFailure: true,
          contracts: [...staticPools.keys()].map(
            (poolAddress) =>
              ({
                address: poolAddress as Address,
                chainId: this.chainId,
                abi: getReservesAbi,
                functionName: 'getReserves',
              } as const)
          ),
        })
        .catch((e) => {
          console.warn(`${this.getLogPrefix()} - ON DEMAND: Static pool multicall failed, message: ${e.message}`)
          return undefined
        })
      if (staticPoolsReserve) {
        Array.from(staticPools.entries()).forEach(([poolAddress, [token0, token1]], i) => {
          const res0 = staticPoolsReserve?.[i]?.result?.[0]
          const res1 = staticPoolsReserve?.[i]?.result?.[1]
          const rPool = new ConstantProductRPool(
            poolAddress,
            token0 as RToken,
            token1 as RToken,
            this.fee,
            BigNumber.from(0),
            BigNumber.from(0)
          )
          const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
          if (res0 && res1) {
            pc.pool.updateReserves(BigNumber.from(res0), BigNumber.from(res1))
            this.onDemandPools.set(poolAddress, { poolCode: pc, validUntilTimestamp })
            staticPoolsCreated++
          } else {
            console.log(
              `${this.getLogPrefix()} - ON-DEMAND: Pool ${poolAddress} (${token0.symbol}/${
                token1.symbol
              }) may not exist, saving pool to be continuously tracked.`
            )
            this.abscentOnDemandPools.set(poolAddress, pc)
            staticPoolsAbscent++
          }
        })
      }
    }

    console.debug(
      `${this.getLogPrefix()} - ON DEMAND ${t0.symbol}/${
        t1.symbol
      }(API): Created ${apiPoolsCreated} pools, extended 'lifetime' for ${apiPoolsUpdated} pools`
    )

    console.debug(
      `${this.getLogPrefix()} - ON DEMAND ${t0.symbol}/${
        t1.symbol
      }(STATIC): Created ${staticPoolsCreated} pools, extended 'lifetime' for ${staticPoolsUpdated} pools and ${staticPoolsAbscent} will be continuously tracked for creation.`
    )
  }

  async updatePools() {
    if (this.isInitialized) {
      this.removeStalePools()
      this.searchForNewPools()

      const initialPools = Array.from(this.initialPools.values())
      const onDemandPools = Array.from(this.onDemandPools.values()).map((pi) => pi.poolCode)

      if (initialPools.length === 0 && onDemandPools.length === 0) {
        return
      }

      const [initialPoolsReserves, onDemandPoolsReserves] = await Promise.all([
        this.client
          .multicall({
            multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
            allowFailure: true,
            contracts: initialPools.map(
              (poolCode) =>
                ({
                  address: poolCode.pool.address as Address,
                  chainId: this.chainId,
                  abi: getReservesAbi,
                  functionName: 'getReserves',
                } as const)
            ),
          })
          .catch((e) => {
            console.warn(`${this.getLogPrefix()} - UPDATE: initPools multicall failed, message: ${e.message}`)
            return undefined
          }),
        this.client
          .multicall({
            multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
            allowFailure: true,
            contracts: onDemandPools.map(
              (poolCode) =>
                ({
                  address: poolCode.pool.address as Address,
                  chainId: this.chainId,
                  abi: getReservesAbi,
                  functionName: 'getReserves',
                } as const)
            ),
          })
          .catch((e) => {
            console.warn(`${this.getLogPrefix()} - UPDATE: on-demand pools multicall failed, message: ${e.message}`)
            return undefined
          }),
      ])

      this.updatePoolWithReserves(initialPools, initialPoolsReserves, 'INITIAL')
      this.updatePoolWithReserves(onDemandPools, onDemandPoolsReserves, 'ON_DEMAND')
    }
  }

  private async searchForNewPools() {
    if (this.refreshInitialPoolsTimestamp > getUnixTime(Date.now())) {
      return
    }

    this.refreshInitialPoolsTimestamp = getUnixTime(add(Date.now(), { seconds: this.REFRESH_INITIAL_POOLS_INTERVAL }))

    const freshInitPoolsMap = await this.getInitialPools()
    // TODO: ideally this should remove pools which are no longer included too, but since the list shouldn't change much,
    // we can keep them in memory and they will disappear the next time the server is restarted
    const poolsFromApi = Array.from(freshInitPoolsMap.values()).filter((pool) => !this.initialPools.has(pool.address))
    poolsFromApi.forEach((pool) => {
      const rPool = new ConstantProductRPool(
        pool.address,
        pool.token0 as RToken,
        pool.token1 as RToken,
        this.fee,
        BigNumber.from(0),
        BigNumber.from(0)
      )
      const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
      this.initialPools.set(pool.address, pc)
      console.log(
        `${this.getLogPrefix()} - REFRESH INITIAL POOLS: Added pool ${pool.address} (${pool.token0.symbol}/${
          pool.token1.symbol
        })`
      )
    })

    const abscentInitialPools = this.abscentInitialPools

    const staticInitialPoolsReservePromise = this.client
    .multicall({
      multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
      allowFailure: true,
      contracts: [...abscentInitialPools.keys()].map(
        (poolAddress) =>
          ({
            address: poolAddress as Address,
            chainId: this.chainId,
            abi: getReservesAbi,
            functionName: 'getReserves',
          } as const)
      ),
    })
    .catch((e) => {
      console.warn(`${this.getLogPrefix()} - ON DEMAND: Static pool multicall failed, message: ${e.message}`)
      return undefined
    })

    const abscentOnDemandPools = this.abscentOnDemandPools
    const staticOnDemandPoolsReservePromise = this.client
      .multicall({
        multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
        allowFailure: true,
        contracts: [...abscentOnDemandPools.keys()].map(
          (poolAddress) =>
            ({
              address: poolAddress as Address,
              chainId: this.chainId,
              abi: getReservesAbi,
              functionName: 'getReserves',
            } as const)
        ),
      })
      .catch((e) => {
        console.warn(`${this.getLogPrefix()} - ON DEMAND: Static pool multicall failed, message: ${e.message}`)
        return undefined
      })

    const [staticInitialPoolsReserve, staticOnDemandPoolsReserve] = await Promise.all([
      staticInitialPoolsReservePromise,
      staticOnDemandPoolsReservePromise,
    ])

  Array.from(abscentInitialPools.entries()).forEach(([poolAddress, pc], i) => {
    const res0 = staticInitialPoolsReserve?.[i]?.result?.[0]
    const res1 = staticInitialPoolsReserve?.[i]?.result?.[1]
    if (res0 && res1) {
      pc.pool.updateReserves(BigNumber.from(res0), BigNumber.from(res1))
      this.initialPools.set(poolAddress, pc)
      this.abscentInitialPools.delete(poolAddress)
      console.log(
        `${this.getLogPrefix()} - REFRESH: Static Initial Pool ${poolAddress} (${pc.pool.token0.symbol}/${
          pc.pool.token1.symbol
        }) is now created and added.`
      )
    } 
  })

  
  const validUntilTimestamp = getUnixTime(add(Date.now(), { seconds: this.ON_DEMAND_POOLS_LIFETIME_IN_SECONDS }))
  
  Array.from(abscentOnDemandPools.entries()).forEach(([poolAddress, pc], i) => {
    const res0 = staticOnDemandPoolsReserve?.[i]?.result?.[0]
    const res1 = staticOnDemandPoolsReserve?.[i]?.result?.[1]
    if (res0 && res1) {
      pc.pool.updateReserves(BigNumber.from(res0), BigNumber.from(res1))
       
      this.onDemandPools.set(poolAddress, { poolCode: pc, validUntilTimestamp })
      this.abscentOnDemandPools.delete(poolAddress)
      console.log(
        `${this.getLogPrefix()} - REFRESH: Static On-Demand Pool ${poolAddress} (${pc.pool.token0.symbol}/${
          pc.pool.token1.symbol
        }) is now created and added.`
      )
    } 
  })

    // TODO: The list of these abscent pools will grow a lot... we should probably remove these after some time? Then we need to save timestamp when they were added.
    // EXAMPLE:
    // unique tokens users try to trade * BASES_TO_CHECK_TRADES_AGAINST + ADDITIONALS
    // e.g. 100 different tokens has been traded, 9 bases + 2 additional * 7
    // 1100 pairs to check if the exist for every LP.


    console.debug(
      `* MEM ${this.getLogPrefix()} REFRESH - INIT COUNT: ${this.initialPools.size} ON DEMAND COUNT: ${this.onDemandPools.size}`
    )
    
    console.debug(
      `* MEM ${this.getLogPrefix()} REFRESH - Current abscent pools: ${this.abscentInitialPools.size} initial, ${this.abscentOnDemandPools.size} on demand`
    )
  }

  private updatePoolWithReserves(
    pools: PoolCode[],
    reserves:
      | (
          | { error: Error; result?: undefined; status: 'error' }
          | { error?: undefined; result: readonly [bigint, bigint, number]; status: 'success' }
        )[]
      | undefined,
    type: 'INITIAL' | 'ON_DEMAND'
  ) {
    if (!reserves) return
    pools.forEach((poolCode, i) => {
      const pool = poolCode.pool
      const res0 = reserves?.[i]?.result?.[0]
      const res1 = reserves?.[i]?.result?.[1]

      if (res0 && res1) {
        const res0BN = BigNumber.from(res0)
        const res1BN = BigNumber.from(res1)
        if (!pool.reserve0.eq(res0BN) || !pool.reserve1.eq(res1BN)) {
          pool.updateReserves(res0BN, res1BN)
          console.info(
            `${this.getLogPrefix()} - SYNC, ${type}: ${pool.address} ${pool.token0.symbol}/${
              pool.token1.symbol
            } ${res0BN.toString()} ${res1BN.toString()}`
          )
        }
      } else {
        console.error(
          `${this.getLogPrefix()} - ERROR UPDATING RESERVES for a ${type} pool, Failed to fetch reserves for pool: ${
            pool.address
          }`
        )
      }
    })
  }

  private generateStaticInitialPools(): Map<string, [Token, Token]> {
    let tokens = BASES_TO_CHECK_TRADES_AGAINST[this.chainId]
    const tokenMap = new Map<string, Token>()
    tokens.forEach((t) => tokenMap.set(t.address.toLocaleLowerCase().substring(2).padStart(40, '0'), t))
    const tokensDedup = Array.from(tokenMap.values())
    // tokens sorting
    const tok0: [string, Token][] = tokensDedup.map((t) => [
      t.address.toLocaleLowerCase().substring(2).padStart(40, '0'),
      t,
    ])
    tokens = tok0.sort((a, b) => (b[0] > a[0] ? -1 : 1)).map(([_, t]) => t)

    const poolMap: Map<string, [Token, Token]> = new Map()
    for (let i = 0; i < tokens.length; ++i) {
      const t0 = tokens[i]
      for (let j = i + 1; j < tokens.length; ++j) {
        const t1 = tokens[j]
        const addr = this._getPoolAddress(t0, t1)
        poolMap.set(addr, [t0, t1])
      }
    }
    return poolMap
  }

  private generateStaticOnDemandPools(t0: Token, t1: Token): Map<string, [Token, Token]> {
    let tokens: Token[]
      tokens = Array.from(
        new Set([
          ...BASES_TO_CHECK_TRADES_AGAINST[this.chainId],
          ...(ADDITIONAL_BASES[this.chainId][t0.address] || []),
          ...(ADDITIONAL_BASES[this.chainId][t1.address] || []),
        ])
      )
      // tokens deduplication
      const tokenMap = new Map<string, Token>()
      tokens.forEach((t) => tokenMap.set(t.address.toLocaleLowerCase().substring(2).padStart(40, '0'), t))
      const tokensDedup = Array.from(tokenMap.values())
      // tokens sorting
      const tok0: [string, Token][] = tokensDedup.map((t) => [
        t.address.toLocaleLowerCase().substring(2).padStart(40, '0'),
        t,
      ])
      tokens = tok0.sort((a, b) => (b[0] > a[0] ? -1 : 1)).map(([_, t]) => t)
      const poolMap: Map<string, [Token, Token]> = new Map()
      for (let i = 0; i < tokens.length; ++i) {
        if (t0.address !== tokens[i].address) {
          const [token0, token1] = [t0, tokens[i]].sort((a, b) => (b.address > a.address ? -1 : 1))
          const pools0 = this._getPoolAddress(token0, token1)
          poolMap.set(pools0, [token0, token1])
        }
        if (t1.address !== tokens[i].address) {
          const [token0, token1] = [t1, tokens[i]].sort((a, b) => (b.address > a.address ? -1 : 1))
          const pool1 = this._getPoolAddress(token0, token1)
          poolMap.set(pool1, [token0, token1])
        }
      }
      return poolMap
  }

  _getPoolAddress(t1: Token, t2: Token): string {
    return getCreate2Address(
      this.factory[this.chainId as keyof typeof this.factory],
      keccak256(['bytes'], [pack(['address', 'address'], [t1.address, t2.address])]),
      this.initCodeHash[this.chainId as keyof typeof this.initCodeHash]
    ).toLowerCase()
  }

  startFetchPoolsData() {
    this.stopFetchPoolsData()
    this.initialPools = new Map()
    this.unwatchBlockNumber = this.client.watchBlockNumber({
      onBlockNumber: (blockNumber) => {
        this.lastUpdateBlock = Number(blockNumber)
        if (!this.isInitialized) {
          this.initialize()
        } else {
          this.updatePools()
        }
      },
      onError: (error) => {
        console.error(`${this.getLogPrefix()} - Error watching block number: ${error.message}`)
      },
    })
  }

  private removeStalePools() {
    let removed = 0
    const now = getUnixTime(Date.now())
    for (const poolInfo of this.onDemandPools.values()) {
      if (poolInfo.validUntilTimestamp < now) {
        this.onDemandPools.delete(poolInfo.poolCode.pool.address)
        removed++
      }
    }
    if (removed > 0) {
      console.log(`${this.getLogPrefix()} STALE: Removed ${removed} stale pools`)
    }
  }

  fetchPoolsForToken(t0: Token, t1: Token): void {
    this.getOnDemandPools(t0, t1)
  }

  /**
   * The pools returned are the initial pools, plus any on demand pools that have been fetched for the two tokens.
   * @param t0
   * @param t1
   * @returns
   */
  getCurrentPoolList(t0: Token, t1: Token): PoolCode[] {
    const tradeId = this.getTradeId(t0, t1)
    const poolsByTrade = this.poolsByTrade.get(tradeId) ?? []
    const onDemandPoolCodes = poolsByTrade
      ? Array.from(this.onDemandPools)
          .filter(([poolAddress]) => poolsByTrade.includes(poolAddress))
          .map(([, p]) => p.poolCode)
      : []

    return [...this.initialPools.values(), onDemandPoolCodes].flat()
  }

  stopFetchPoolsData() {
    if (this.unwatchBlockNumber) this.unwatchBlockNumber()
    this.blockListener = undefined
  }
}
