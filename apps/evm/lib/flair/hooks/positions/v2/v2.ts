import { V2Position, V2PositionsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import {
  getV2Positions,
  getV2PositionsUrl,
} from '../../../fetchers/positions/v2/v2'
import type { QueryParams } from '../../common.js'

export const useV2Positions = (
  args: V2PositionsArgs,
  queryParams?: QueryParams<V2Position[]>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getV2PositionsUrl(args)],
    queryFn: () => getV2Positions(args),
  })
}
