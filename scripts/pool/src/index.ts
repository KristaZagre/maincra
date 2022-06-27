import 'dotenv/config'

import { getUnixTime } from 'date-fns'

import { LEGACY_SUPPORTED_CHAINS, SUPPORTED_CHAINS } from './config'
import { getPools } from './lib/graph'
import redis from './lib/redis'

export async function execute() {
  console.log(`Updating pools for chains: ${SUPPORTED_CHAINS.join(', ')}`)
  const legacyResults = await Promise.all(LEGACY_SUPPORTED_CHAINS.map((chainId) => getPools(chainId)))
  // const tridentResults = await Promise.all(TRIDENT_SUPPORTED_CHAINS.map((chainId) => getPools(chainId)))
  // map together with trident/legacy
  await redis.hset(
    'pools',
    Object.fromEntries(
      legacyResults.map(({ chainId, data }) => {
        const updatedAtBlock = data.legacy_exchange__meta?.block.number
        const updatedAtTimestamp = getUnixTime(Date.now())
        return [
          chainId,
          JSON.stringify({
            chainId,
            ...Object.fromEntries(
              data.legacy_exchange_pairs.map((pair) => {
                return [pair.id, pair]
              })
            ),
            updatedAtBlock,
            updatedAtTimestamp,
          }),
        ]
      })
    )
  )
  console.log(`Finished updating pools for chains: ${SUPPORTED_CHAINS.join(', ')}`)
  process.exit()
}
execute()
