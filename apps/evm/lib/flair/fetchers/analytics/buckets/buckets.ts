import { parseArgs } from '@sushiswap/client'
import { AnalyticsBucket, BucketsArgs } from '@sushiswap/rockset-client'
import { FLAIR_ANALYTICS_API_URL } from 'lib/flair/fetchers/common'

export const getBucketsUrl = (args: BucketsArgs) => {
  return `${FLAIR_ANALYTICS_API_URL}/buckets${parseArgs(args)}`
}

export const getBuckets = async (
  args: BucketsArgs,
  init?: RequestInit,
): Promise<AnalyticsBucket[]> => {
  const url = getBucketsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
