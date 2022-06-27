import 'dotenv/config'

import { ChainId } from '@sushiswap/chain'

import { LEGACY_SUPPORTED_CHAINS, SUPPORTED_CHAINS, TRIDENT_SUPPORTED_CHAINS } from './config'
import { getLegacyPools, getTridentPools } from './lib/graph'
import redis from './lib/redis'

interface Pool {
  [key: string]: {
    id: string
    name?: string
    assets: { id: string; name: string; symbol: string; decimals: string }[]
    totalSupply: string
    reserveUSD: string
    volumeUSD: string
    type: string
  }
}

export async function execute() {
  console.log(`Updating pools for chains: ${SUPPORTED_CHAINS.join(', ')}`)
  const tridentResult = await Promise.all(TRIDENT_SUPPORTED_CHAINS.map((chainId) => getTridentPools(chainId)))
  const legacyResult = await Promise.all(LEGACY_SUPPORTED_CHAINS.map((chainId) => getLegacyPools(chainId)))
  // const updatedAtTimestamp = getUnixTime(Date.now())
  const result = new Map<ChainId, Pool[]>()

  legacyResult?.forEach(({ chainId, type, data }) => {
    // const updatedLegacyAtBlock = data.legacy_exchange__meta?.block.number
    result.set(
      chainId,
      data.legacy_exchange_pairs?.map((pool) => {
        return {
          [pool.id]: {
            id: pool.id,
            name: pool.name,
            assets: [pool.token0, pool.token1],
            totalSupply: pool.totalSupply,
            reserveUSD: pool.reserveUSD,
            volumeUSD: pool.volumeUSD,
            type,
          },
        } as Pool
      })
    )
  })

  tridentResult?.forEach(({ chainId, type, data }) => {
    // const updatedTridentAtBlock = data.trident_exchange__meta?.block.number
    const pools = data.trident_exchange_pools?.map((pool) => {
      return {
        [pool.id]: {
          id: pool.id,
          assets: [...pool.assets.map((token) => token.token)],
          totalSupply: pool.kpi.liquidity,
          reserveUSD: pool.kpi.liquidityUSD,
          volumeUSD: pool.kpi.volumeUSD,
          type,
        },
      } as Pool
    })
    console.log('TRIDENT', { chainId })
    if (!result.has(chainId)) {
      result.set(chainId, pools)
    } else {
      result.set(chainId, pools.concat(result.get(chainId) ?? []))
    }
  })
  for (const [chainId, pools] of result) {
    console.log({ chainId }, pools.length)
    const data = Object.values(pools).reduce((acc, cur) => {
      const [address, values] = Object.entries(cur)[0]
      acc[address] = values
      return acc
    }, {})
    redis.hset('pools', chainId, JSON.stringify(data)) // FIXME: Refactor, promise.all?
  }

  console.log(`Finished updating pools for chains: ${SUPPORTED_CHAINS.join(', ')}`)
  process.exit()
}

execute()
