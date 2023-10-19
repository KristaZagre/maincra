import { Pool, PoolArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { getPool, getPoolUrl } from '../../../fetchers/pool/id/pool'
import type { QueryParams } from '../../types.js'

export const usePool = (args: PoolArgs, queryParams?: QueryParams<Pool>) => {
  return useQuery({
    ...queryParams,
    queryKey: [getPoolUrl(args)],
    queryFn: () => getPool(args),
  })
}
