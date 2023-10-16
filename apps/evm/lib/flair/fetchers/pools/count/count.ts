import { parseArgs } from '@sushiswap/client'
import { PoolsArgs, PoolsCount } from '@sushiswap/rockset-client'

export const getPoolsCountUrl = (args: PoolsArgs) => {
  return `/pool/api/v1/pools/count${parseArgs(args)}`
}

export const getPoolsCount = async (args: PoolsArgs): Promise<PoolsCount> => {
  const url = getPoolsCountUrl(args)
  return fetch(url).then((data) => data.json())
}
