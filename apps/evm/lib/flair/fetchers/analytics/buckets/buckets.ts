import { parseArgs } from '@sushiswap/client'
import { AnalyticBucketsArgs, AnalyticToken } from '@sushiswap/rockset-client'
import { FLAIR_ANALYTICS_API_URL } from 'lib/flair/fetchers/common'

export const getBucketsUrl = (args: AnalyticBucketsArgs) => {
  return `${FLAIR_ANALYTICS_API_URL}/buckets${parseArgs(args)}`
}

export const getBuckets = async (
  args: AnalyticBucketsArgs,
  init?: RequestInit,
): Promise<AnalyticToken[]> => {
  const url = getBucketsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
