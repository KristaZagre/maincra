import { parseArgs } from '@sushiswap/client'
import { PoolBucket, PoolBucketsArgs } from '@sushiswap/rockset-client'

export const getPoolBucketsUrl = (args: PoolBucketsArgs) => {
  return `/pool/api/v1/pool/${args.id}/transactions${parseArgs(args)}`
}

export const getPoolBuckets = async (
  args: PoolBucketsArgs,
): Promise<PoolBucket[]> => {
  const url = getPoolBucketsUrl(args)
  return fetch(url).then((data) => data.json())
}
