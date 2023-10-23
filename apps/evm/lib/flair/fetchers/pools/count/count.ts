import { parseArgs } from '@sushiswap/client'
import { PoolsArgs, PoolsCount } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from '../../common'

export const getPoolsCountUrl = (args: PoolsArgs) => {
  return `${FLAIR_API_URL}/pools/count${parseArgs(args)}`
}

export const getPoolsCount = async (
  args: PoolsArgs,
  init?: RequestInit,
): Promise<PoolsCount> => {
  const url = getPoolsCountUrl(args)
  return fetch(url, init).then((data) => data.json())
}
