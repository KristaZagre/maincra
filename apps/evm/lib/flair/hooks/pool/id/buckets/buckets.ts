import { PoolBucketsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import {
  getPoolBuckets,
  getPoolBucketsUrl,
} from '../../../../fetchers/pool/id/buckets/buckets'

export const usePoolBuckets = async (args: PoolBucketsArgs) => {
  return useQuery({
    queryKey: [getPoolBucketsUrl(args)],
    queryFn: () => getPoolBuckets(args),
  })
}
