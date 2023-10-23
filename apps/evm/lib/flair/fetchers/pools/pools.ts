import { parseArgs } from '@sushiswap/client'
import { Pool, PoolsArgs } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from '../common'

export const getPoolsUrl = (args: PoolsArgs) => {
  return `${FLAIR_API_URL}/pools${parseArgs(args)}`
}

export const getPools = async (
  args: PoolsArgs,
  init?: RequestInit,
): Promise<Pool[]> => {
  const url = getPoolsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
