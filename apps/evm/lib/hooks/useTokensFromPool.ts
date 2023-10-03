'use client'

import { Native, Token } from '@sushiswap/currency'
import { SimplePool } from '@sushiswap/rockset-client'
import { useMemo } from 'react'

export const useTokensFromPool = (pool: SimplePool) => {
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
        address: pool.id.includes(':') ? pool.id.split(':')[1] : pool.id,
        name: 'SLP Token',
        decimals: 18,
        symbol: 'SLP',
        chainId: pool.chainId,
      }),
    ]

    return {
      token0,
      token1,
      liquidityToken,
    }
  }, [pool])
}
