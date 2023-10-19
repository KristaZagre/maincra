'use client'

import { SimplePool } from '@sushiswap/rockset-client'
import { useMemo } from 'react'
import { Native, Token } from 'sushi/currency'

export const useTokensFromPool = (pool: Pick<SimplePool, 'id' | 'token0' | 'token1'>) => {
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
        address: pool.id.includes(':') ? pool.id.split(':')[1] : pool.id,
        name: 'SLP Token',
        decimals: 18,
        symbol: 'SLP',
        chainId: pool.token0.chainId,
      }),
    ]

    return {
      token0,
      token1,
      liquidityToken,
    }
  }, [pool])
}
