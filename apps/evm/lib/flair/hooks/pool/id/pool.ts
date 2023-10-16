import { Pool, PoolArgs } from '@sushiswap/rockset-client'

export const getPoolUrl = (args: PoolArgs) => {
  return `/pool/api/v1/pool/${args.id}`
}

export const getPool = async (args: PoolArgs): Promise<Pool> => {
  const url = getPoolUrl(args)
  return fetch(url).then((data) => data.json())
}
