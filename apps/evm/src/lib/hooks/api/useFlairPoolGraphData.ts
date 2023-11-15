'use client'

import { Pool, PoolBucket, PoolProtocol } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Amount, Native, Token } from 'sushi/currency'
import { ID } from 'sushi/types'

interface UsePoolGraphDataParams {
  id: ID
  enabled?: boolean
  granularity: 'hour' | 'day' | 'week' | 'month'
}

export const useExtendedPool = ({ pool }: { pool: Pool }) => {
  return useMemo(() => {
    const _token0 = new Token(pool.token0)
    const _token1 = new Token(pool.token1)

    const [token0, token1, liquidityToken] = [
      _token0.wrapped.address ===
      Native.onChain(_token0.chainId).wrapped.address
        ? Native.onChain(_token0.chainId)
        : _token0,
      _token1.wrapped.address ===
      Native.onChain(_token1.chainId).wrapped.address
        ? Native.onChain(_token1.chainId)
        : _token1,
      new Token({
        address: pool.address,
        name: 'SLP Token',
        decimals: 18,
        symbol: 'SLP',
        chainId: pool.chainId,
      }),
    ]

    return {
      ...pool,
      reserve0:
        token0 && pool
          ? Amount.fromRawAmount(token0, Math.ceil(Number(pool.reserve0BI)))
          : null,
      reserve1:
        token1 && pool
          ? Amount.fromRawAmount(token1, Math.ceil(Number(pool.reserve1BI)))
          : null,
      totalSupply:
        liquidityToken && pool
          ? Amount.fromRawAmount(
              liquidityToken,
              Math.ceil(Number(pool.liquidity)),
            )
          : null,
      token0,
      token1,
      liquidityToken,
      feeAmount: pool.protocol === PoolProtocol.SUSHISWAP_V3 ? Math.ceil(pool.swapFee * 10000000) : pool.swapFee,
    }
  }, [pool])
}

export type ExtendedPool = ReturnType<typeof useExtendedPool>

export const usePoolGraphData = ({
  id,
  enabled = true,
  granularity,
}: UsePoolGraphDataParams) => {
  return useQuery({
    queryKey: ['useFlairPoolGraphData', { id, granularity }],
    queryFn: async () =>
      fetch(`/pool/api/v1/pool/${id}/buckets?granularity=${granularity}`).then(
        (data) => data.json(),
      ) as Promise<PoolBucket[]>,
    keepPreviousData: true,
    staleTime: 60,
    cacheTime: 86400000, // 24hs
    enabled: Boolean(id && enabled && granularity),
  })
}
