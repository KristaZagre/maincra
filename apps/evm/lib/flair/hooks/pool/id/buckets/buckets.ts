import { PoolBucket, PoolBucketsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import type { QueryParams } from 'lib/flair/hooks/common'
import {
  getPoolBuckets,
  getPoolBucketsUrl,
} from '../../../../fetchers/pool/id/buckets/buckets'

export const usePoolBuckets = (
  args: PoolBucketsArgs,
  queryParams?: QueryParams<PoolBucket[]>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getPoolBucketsUrl(args)],
    queryFn: () => getPoolBuckets(args),
  })
}
