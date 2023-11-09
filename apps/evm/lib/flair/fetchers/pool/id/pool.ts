import { Pool, PoolArgs } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from '../../common'

export const getPoolUrl = (args: PoolArgs) => {
  return `${FLAIR_API_URL}/pool/${args.id}`
}

export const getPool = async (
  args: PoolArgs,
  init?: RequestInit,
): Promise<{success: boolean, data: Pool}> => {
  const url = getPoolUrl(args)
  return fetch(url, init).then((data) => data.json())
}
