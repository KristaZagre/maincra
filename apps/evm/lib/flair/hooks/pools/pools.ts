import { parseArgs } from '@sushiswap/client'
import { Pool, PoolsArgs } from '@sushiswap/rockset-client'

export const getPoolsUrl = (args: PoolsArgs) => {
  return `/pool/api/v1/pools${parseArgs(args)}`
}

export const getPools = async (args: PoolsArgs): Promise<Pool[]> => {
  const url = getPoolsUrl(args)
  return fetch(url).then((data) => data.json())
}
