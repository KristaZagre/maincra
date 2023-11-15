import { Pool, PoolsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { getPools, getPoolsUrl } from '../../fetchers/pools/pools'
import type { QueryParams } from '../common.js'

export const usePools = (
  args: PoolsArgs,
  queryParams?: QueryParams<Pool[]>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getPoolsUrl(args)],
    queryFn: () => getPools(args),
  })
}
