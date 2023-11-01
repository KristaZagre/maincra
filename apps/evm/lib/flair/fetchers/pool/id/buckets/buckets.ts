import { parseArgs } from '@sushiswap/client'
import { PoolBucket, PoolBucketsArgs } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from 'lib/flair/fetchers/common'

export const getPoolBucketsUrl = (args: PoolBucketsArgs) => {
  return `${FLAIR_API_URL}/pool/${args.id}/buckets${parseArgs(args)}`
}

export const getPoolBuckets = async (
  args: PoolBucketsArgs,
  init?: RequestInit,
): Promise<PoolBucket[]> => {
  const url = getPoolBucketsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
