import { balanceOfAbi, uniswapV3StateMulticall } from '@sushiswap/abi'
import { ChainId } from '@sushiswap/chain'
import { Token } from '@sushiswap/currency'
import { CLTick, RToken, UniV3Pool } from '@sushiswap/tines'
import { add, getUnixTime } from 'date-fns'
import { BigNumber } from 'ethers'
import { Address, PublicClient } from 'viem'

import { getPoolsByTokenIds, getTopPools, PoolResponse } from '../lib/api'
import type { PoolCode } from '../pools/PoolCode'
import { UniV3PoolCode } from '../pools/UniV3Pool'
import { LiquidityProvider, LiquidityProviders } from './LiquidityProvider'
import { performance } from 'perf_hooks'
interface PoolInfo {
  poolCode: PoolCode
  validUntilTimestamp: number
}

export abstract class UniswapV3BaseProvider extends LiquidityProvider {
  readonly TOP_POOL_SIZE = 1
  readonly TOP_POOL_LIQUIDITY_THRESHOLD = 5000
  readonly ON_DEMAND_POOL_SIZE = 20
  readonly REFRESH_INITIAL_POOLS_INTERVAL = 60 // SECONDS
  readonly BIT_AMOUNT = 12

  initialPools: Map<string, PoolCode> = new Map()
  poolsByTrade: Map<string, string[]> = new Map()
  onDemandPools: Map<string, PoolInfo> = new Map()

  blockListener?: () => void
  unwatchBlockNumber?: () => void

  isInitialized = false
  factory: { [chainId: number]: Address } = {}
  stateMultiCall: { [chainId: number]: Address } = {}
  refreshInitialPoolsTimestamp = getUnixTime(add(Date.now(), { seconds: this.REFRESH_INITIAL_POOLS_INTERVAL }))

  constructor(
    chainId: ChainId,
    client: PublicClient,
    factory: { [chainId: number]: Address },
    stateMultiCall: { [chainId: number]: Address }
  ) {
    super(chainId, client)
    this.factory = factory
    this.stateMultiCall = stateMultiCall
    if (!(chainId in this.factory) || !(chainId in this.stateMultiCall)) {
      throw new Error(`${this.getType()} cannot be instantiated for chainid ${chainId}, no factory or stateMultiCall`)
    }
  }

  async initialize() {
    this.isInitialized = true
    const pools = await this.getInitialPools()

    if (pools.length > 0) {
      console.debug(`${this.getLogPrefix()} - INIT: top pools found: ${pools.length}`)
    } else {
      console.debug(`${this.getLogPrefix()} - INIT: NO pools found.`)
      return []
    }


    const balanceContracts = pools.map((p) =>
    [
      {
        args: [p.address as Address],
        address: p.token0.address as Address,
        chainId: this.chainId,
        abi: balanceOfAbi,
        functionName: 'balanceOf',
      } as const,
      {
        args: [p.address as Address],
        address: p.token1.address as Address,
        chainId: this.chainId,
        abi: balanceOfAbi,
        functionName: 'balanceOf',
      } as const,
    ].flat()
  ).flat()
    
  const startTime = performance.now()
    const [poolState, balances] = await Promise.all([
      this.client
        .multicall({
          multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
          allowFailure: true,
          contracts: pools.map(
            (pool) =>
              ({
                args: [
                  this.factory[this.chainId] as Address,
                  pool.token0.address as Address,
                  pool.token1.address as Address,
                  pool.swapFee * 10000,
                  this.BIT_AMOUNT,
                  this.BIT_AMOUNT,
                ],
                address: this.stateMultiCall[this.chainId] as Address,
                chainId: this.chainId,
                abi: uniswapV3StateMulticall,
                functionName: 'getFullStateWithRelativeBitmaps',
              } as const)
          ),
        })
        .catch((e) => {
          console.warn(`${this.getLogPrefix()} - INIT: multicall failed, message: ${e.message}`)
          return undefined
        }),
        this.client.multicall({
          multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
          allowFailure: true,
          contracts: balanceContracts,
        })
        .catch((e) => {
          console.warn(`${this.getLogPrefix()} - INIT: balanceOf failed, message: ${e.message}`)
          return undefined
        })
    ])

    const endTime = performance.now()
    const duration = ((endTime - startTime) / 1000).toFixed(1)
    console.log("MULTICALL took ", duration, " seconds")

    pools.forEach((pool, i) => {
      if (poolState?.[i].status !== 'success' || !poolState?.[i].result) {
        console.error(`${this.getLogPrefix()} - ERROR INIT POOL STATE, Failed to fetch state of pool: ${pool.address}`)
        return
      }
      const balance0 = balances?.[i * 2].result
      const balance1 = balances?.[i * 2 + 1].result
      
      if (balances?.[i].status !== 'success' || !balance0 || !balance1) {
        console.error(`${this.getLogPrefix()} - ERROR INIT BALANCE, Failed to fetch balances for pool: ${pool.address}`)
        return
      }

      const tick = poolState[i].result?.slot0.tick
      const liquidity = poolState[i].result?.liquidity
      const sqrtPriceX96 = poolState[i].result?.slot0.sqrtPriceX96

      if (!tick || !liquidity || !sqrtPriceX96) {
        console.error(`${this.getLogPrefix()} - ERROR INIT POOL STATE, Failed to fetch pool state. tick/liquidity/sqrtPrice is missing for pool: ${pool.address}`)
        return
      }

      const tickBitmap = poolState[i].result?.tickBitmap

      if (!tickBitmap) {
        console.error(`${this.getLogPrefix()} - ERROR INIT POOL STATE, Failed to fetch pool state. tickBitmap is missing for pool: ${pool.address}`)
        return
      }


      const ticks: CLTick[] = Array.from(tickBitmap)
      .sort((a, b) => a.index - b.index)
      .map((tick) => ({ index: tick.index, DLiquidity: BigNumber.from(tick.value) }))
      
      const rPool = new UniV3Pool(
        pool.address,
        pool.token0 as RToken,
        pool.token1 as RToken,
        pool.swapFee,
        BigNumber.from(balance0),
        BigNumber.from(balance1),
        tick, 
        BigNumber.from(liquidity),
        BigNumber.from(sqrtPriceX96),
        ticks,
      )
      const pc = new UniV3PoolCode(rPool, this.getType(), this.getPoolProviderName())
      this.initialPools.set(pool.address, pc)
    })

    console.debug(`${this.getLogPrefix()} - INIT, WATCHING ${this.initialPools.size} POOLS`)
  }

  private async getInitialPools(): Promise<PoolResponse[]> {
    const topPools = await getTopPools(
      this.chainId,
      this.getType() === LiquidityProviders.UniswapV3 ? 'Uniswap' : this.getType(),
      'V3',
      ['CONCENTRATED_LIQUIDITY_POOL'],
      this.TOP_POOL_SIZE,
      this.TOP_POOL_LIQUIDITY_THRESHOLD
    )

    return Array.from(topPools.values())
  }

  async getOnDemandPools(t0: Token, t1: Token): Promise<void> {
    const type = this.getType()

    const poolsOnDemand = await getPoolsByTokenIds(
      this.chainId,
      type === LiquidityProviders.UniswapV2 ? 'Uniswap' : type,
      'V3',
      ['CONCENTRATED_LIQUIDITY_POOL'],
      t0.address,
      t1.address,
      this.TOP_POOL_SIZE,
      this.TOP_POOL_LIQUIDITY_THRESHOLD,
      this.ON_DEMAND_POOL_SIZE
    )

    const pools = Array.from(poolsOnDemand.values()).filter((pool) => !this.initialPools.has(pool.address))

    this.poolsByTrade.set(
      this.getTradeId(t0, t1),
      pools.map((pool) => pool.address)
    )

    const validUntilTimestamp = getUnixTime(add(Date.now(), { seconds: this.ON_DEMAND_POOLS_LIFETIME_IN_SECONDS }))

    // let created = 0
    // let updated = 0
    // pools.forEach((pool) => {
    //   const existingPool = this.onDemandPools.get(pool.address)
    //   if (existingPool === undefined) {
    //     const toks = [pool.token0, pool.token1]
    //     const rPool = new ConstantProductRPool(
    //       pool.address,
    //       toks[0] as RToken,
    //       toks[1] as RToken,
    //       this.fee,
    //       BigNumber.from(0),
    //       BigNumber.from(0)
    //     )

    //     const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
    //     this.onDemandPools.set(pool.address, { poolCode: pc, validUntilTimestamp })
    //     ++created
    //   } else {
    //     existingPool.validUntilTimestamp = validUntilTimestamp
    //     ++updated
    //   }
    // })
    // console.debug(
    //   `${this.getLogPrefix()} - ON DEMAND: Created ${created} pools, extended 'lifetime' for ${updated} pools`
    // )
  }

  async updatePools() {
    if (this.isInitialized) {
      this.removeStalePools()
      this.refreshInitialPools()

      const initialPools = Array.from(this.initialPools.values())
      const onDemandPools = Array.from(this.onDemandPools.values()).map((pi) => pi.poolCode)

      if (initialPools.length === 0 && onDemandPools.length === 0) {
        return
      }

      // const [initialPoolsReserves, onDemandPoolsReserves] = await Promise.all([
      //   this.client
      //     .multicall({
      //       multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
      //       allowFailure: true,
      //       contracts: initialPools.map(
      //         (poolCode) =>
      //           ({
      //             address: poolCode.pool.address as Address,
      //             chainId: this.chainId,
      //             abi: getReservesAbi,
      //             functionName: 'getReserves',
      //           } as const)
      //       ),
      //     })
      //     .catch((e) => {
      //       console.warn(`${this.getLogPrefix()} - UPDATE: initPools multicall failed, message: ${e.message}`)
      //       return undefined
      //     }),
      //   this.client
      //     .multicall({
      //       multicallAddress: this.client.chain?.contracts?.multicall3?.address as Address,
      //       allowFailure: true,
      //       contracts: onDemandPools.map(
      //         (poolCode) =>
      //           ({
      //             address: poolCode.pool.address as Address,
      //             chainId: this.chainId,
      //             abi: getReservesAbi,
      //             functionName: 'getReserves',
      //           } as const)
      //       ),
      //     })
      //     .catch((e) => {
      //       console.warn(`${this.getLogPrefix()} - UPDATE: on-demand pools multicall failed, message: ${e.message}`)
      //       return undefined
      //     }),
      // ])

      // this.updatePoolWithReserves(initialPools, initialPoolsReserves, 'INITIAL')
      // this.updatePoolWithReserves(onDemandPools, onDemandPoolsReserves, 'ON_DEMAND')
    }
  }

  private async refreshInitialPools() {
    if (this.refreshInitialPoolsTimestamp > getUnixTime(Date.now())) {
      return
    }

    this.refreshInitialPoolsTimestamp = getUnixTime(add(Date.now(), { seconds: this.REFRESH_INITIAL_POOLS_INTERVAL }))

    const freshInitPools = await this.getInitialPools()
    // TODO: ideally this should remove pools which are no longer included too, but since the list shouldn't change much,
    // we can keep them in memory and they will disappear the next time the server is restarted
    // const poolsToAdd = freshInitPools.filter((pool) => !this.initialPools.has(pool.address))
    // poolsToAdd.forEach((pool) => {
    //   const rPool = new ConstantProductRPool(
    //     pool.address,
    //     pool.token0 as RToken,
    //     pool.token1 as RToken,
    //     this.fee,
    //     BigNumber.from(0),
    //     BigNumber.from(0)
    //   )
    //   const pc = new ConstantProductPoolCode(rPool, this.getType(), this.getPoolProviderName())
    //   this.initialPools.set(pool.address, pc)
    //   console.log(
    //     `${this.getLogPrefix()} - REFRESH INITIAL POOLS: Added pool ${pool.address} (${pool.token0.symbol}/${
    //       pool.token1.symbol
    //     })`
    //   )
    // })

    // console.debug(
    //   `* MEM ${this.getLogPrefix()} INIT COUNT: ${this.initialPools.size} ON DEMAND COUNT: ${this.onDemandPools.size}`
    // )
  }

  // private updatePoolWithReserves(
  //   pools: PoolCode[],
  //   reserves:
  //     | (
  //         | { error: Error; result?: undefined; status: 'error' }
  //         | { error?: undefined; result: readonly [bigint, bigint, number]; status: 'success' }
  //       )[]
  //     | undefined,
  //   type: 'INITIAL' | 'ON_DEMAND'
  // ) {
  //   if (!reserves) return
  //   pools.forEach((poolCode, i) => {
  //     const pool = poolCode.pool
  //     const res0 = reserves?.[i]?.result?.[0]
  //     const res1 = reserves?.[i]?.result?.[1]

  //     if (res0 && res1) {
  //       const res0BN = BigNumber.from(res0)
  //       const res1BN = BigNumber.from(res1)
  //       if (!pool.reserve0.eq(res0BN) || !pool.reserve1.eq(res1BN)) {
  //         pool.updateReserves(res0BN, res1BN)
  //         console.info(
  //           `${this.getLogPrefix()} - SYNC, ${type}: ${pool.address} ${pool.token0.symbol}/${
  //             pool.token1.symbol
  //           } ${res0BN.toString()} ${res1BN.toString()}`
  //         )
  //       }
  //     } else {
  //       console.error(
  //         `${this.getLogPrefix()} - ERROR UPDATING RESERVES for a ${type} pool, Failed to fetch reserves for pool: ${
  //           pool.address
  //         }`
  //       )
  //     }
  //   })
  // }

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
