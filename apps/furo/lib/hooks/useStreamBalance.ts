import { Amount, Token } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import { getBentoBoxContractConfig, getFuroStreamContractConfig } from '@sushiswap/wagmi'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { Address, useContractRead } from 'wagmi'

export function useStreamBalance(chainId?: number, streamId?: string, token?: Token): Amount<Token> | undefined {
  const {
    data: balance,
    error: balanceError,
    isLoading: balanceLoading,
  } = useContractRead({
    ...getFuroStreamContractConfig(chainId),
    functionName: 'streamBalanceOf',
    chainId,
    enabled: !!chainId && !!streamId,
    args: streamId ? [BigNumber.from(streamId)] : undefined,
    watch: true,
  })

  const {
    data: rebase,
    error: rebaseError,
    isLoading: rebaseLoading,
  } = useContractRead({
    ...getBentoBoxContractConfig(chainId),
    functionName: 'totals',
    chainId,
    enabled: !!chainId && !!token?.address,
    args: token ? [token.address as Address] : undefined,
    watch: true,
  })

  return useMemo(() => {
    if (balanceError || rebaseError || balanceLoading || rebaseLoading || !balance || !rebase || !streamId || !token)
      return undefined

    return Amount.fromShare(token, JSBI.BigInt(balance[1]), {
      elastic: JSBI.BigInt(rebase[0]),
      base: JSBI.BigInt(rebase[1]),
    })
  }, [balanceError, rebaseError, balanceLoading, rebaseLoading, balance, streamId, token, rebase])
}
