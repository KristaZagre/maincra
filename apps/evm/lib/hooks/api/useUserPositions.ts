'use client'

import { parseArgs } from '@sushiswap/client'
import { UserPosition } from '@sushiswap/graph-client'
import { useMemo } from 'react'
import { ChainId } from 'sushi/chain'

import { SimplePool } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { ID } from 'sushi/types'
import { useSimplePools } from '..'
import { PositionWithPool } from '../../../types'

export interface GetUserArgs {
  id?: string
  chainIds?: ChainId[]
}

export function getUserPositionsUrl(args: GetUserArgs) {
  return `/pool/api/user/${parseArgs(args)}`
}

const transformPositions = (positions?: UserPosition[], pools?: SimplePool[]) =>
  positions && pools
    ? positions
        .map((position) => {
          const pool = pools.find((pool) => pool.id === position.pool)

          return { ...position, pool }
        })
        .filter((position): position is PositionWithPool => !!position.pool)
    : undefined

export function useUserPositions(args: GetUserArgs, shouldFetch = true) {
  const url = getUserPositionsUrl(args)

  const { data: positions } = useQuery<UserPosition[]>({
    queryKey: [url],
    queryFn: () => fetch(url).then((data) => data.json()),
    enabled: shouldFetch && !!args.id,
  })

  const poolIds = useMemo(
    () => positions?.map((position) => position.pool as ID) || [],
    [positions],
  )

  const { data: pools } = useSimplePools({
    args: { chainIds: args.chainIds, ids: poolIds, pageSize: poolIds.length },
  })
  const isValidating =
    !positions || !pools || (positions.length > 0 && pools.length === 0)

  return useMemo(
    () => ({
      data: !isValidating
        ? transformPositions(positions, pools)?.filter((position) =>
            Array.isArray(args.chainIds)
              ? args.chainIds?.includes(position.chainId as ChainId)
              : true,
          )
        : undefined,
      isValidating,
    }),
    [args.chainIds, isValidating, pools, positions],
  )
}
