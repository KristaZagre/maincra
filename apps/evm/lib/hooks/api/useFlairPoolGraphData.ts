'use client'

import { ChainId } from '@sushiswap/chain'
import { Amount, Native, Token } from '@sushiswap/currency'
import { Pool, PoolBucket } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

interface UsePoolGraphDataParams {
  poolAddress: string
  chainId: ChainId
  enabled?: boolean
  granularity: 'hour' | 'day' | 'week' | 'month'
}

export const useExtendedPool = ({ pool }: { pool: Pool }) => {
  return useMemo(() => {
    const _token0 = new Token({
      address: pool.token0Address,
      name: pool.token0Name,
      decimals: Number(pool.token0Decimals),
      symbol: pool.token0Symbol,
      chainId: Number(pool.chainId),
    })

    const _token1 = new Token({
      address: pool.token1Address,
      name: pool.token1Name,
      decimals: Number(pool.token1Decimals),
      symbol: pool.token1Symbol,
      chainId: Number(pool.chainId),
    })

    const [token0, token1, liquidityToken] = [
      _token0.wrapped.address === Native.onChain(_token0.chainId).wrapped.address
        ? Native.onChain(_token0.chainId)
        : _token0,
      _token1.wrapped.address === Native.onChain(_token1.chainId).wrapped.address
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
      reserve0: token0 && pool ? Amount.fromRawAmount(token0, Math.ceil(pool.reserve0)) : null,
      reserve1: token1 && pool ? Amount.fromRawAmount(token1, Math.ceil(pool.reserve1)) : null,
      totalSupply: liquidityToken && pool ? Amount.fromRawAmount(liquidityToken, Math.ceil(pool.liquidity)) : null,
      token0,
      token1,
      liquidityToken,
    }
  }, [pool])
}

export type ExtendedPool = ReturnType<typeof useExtendedPool>

export const usePoolGraphData = ({ poolAddress, chainId, enabled = true, granularity }: UsePoolGraphDataParams) => {
  return useQuery({
    queryKey: ['useFlairPoolGraphData', { poolAddress, chainId, granularity }],
    queryFn: async () =>
      fetch(`/pool/api/v1/pool/${chainId}/${poolAddress}/buckets?granularity=${granularity}`).then((data) => data.json()) as Promise<
        PoolBucket[]
      >,
    keepPreviousData: true,
    staleTime: 60,
    cacheTime: 86400000, // 24hs
    enabled: Boolean(poolAddress && chainId && enabled && granularity),
  })
}
