import { PoolsCount, PoolsCountArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import {
  getPoolsCount,
  getPoolsCountUrl,
} from '../../../fetchers/simplePools/count/count'
import type { QueryParams } from '../../common.js'

export const usePoolsCount = (
  args: PoolsCountArgs,
  queryParams?: QueryParams<PoolsCount>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getPoolsCountUrl(args)],
    queryFn: () => getPoolsCount(args),
  })
}
