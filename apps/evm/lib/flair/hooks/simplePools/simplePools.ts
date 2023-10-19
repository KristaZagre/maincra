import { SimplePool, SimplePoolsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import {
  getSimplePools,
  getSimplePoolsUrl,
} from '../../fetchers/simplePools/simplePools'
import type { QueryParams } from '../types.js'

export const useSimplePools = (
  args: SimplePoolsArgs,
  queryParams?: QueryParams<SimplePool[]>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getSimplePoolsUrl(args)],
    queryFn: () => getSimplePools(args),
  })
}
