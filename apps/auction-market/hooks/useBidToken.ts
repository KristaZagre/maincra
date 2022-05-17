import { AddressZero } from '@ethersproject/constants'
import { Amount, Token } from '@sushiswap/currency'
import { BID_TOKEN_ADDRESS } from 'config'
import { useMemo } from 'react'
import { useAccount, useBalance, useNetwork } from 'wagmi'

import { useToken } from './Tokens'

export function useBidTokenBalance(): Amount<Token> | undefined {
  const { activeChain } = useNetwork()
  const address = useAccount()
  const bidTokenData = useBalance({
    addressOrName: address?.data ? address.data?.address : AddressZero,
    token: activeChain?.id ? BID_TOKEN_ADDRESS[activeChain.id] : AddressZero,
    watch: true,
  })

  return useMemo(() => {
    if (!bidTokenData.data || !activeChain) return
    return Amount.fromRawAmount(
      new Token({
        chainId: activeChain.id,
        address: BID_TOKEN_ADDRESS[activeChain.id],
        decimals: bidTokenData.data.decimals,
        symbol: bidTokenData.data.symbol,
      }),
      bidTokenData.data.value.toString(),
    )
  }, [bidTokenData, activeChain])
}

export function useBidToken(): Token | undefined {
  const { activeChain } = useNetwork()

  const token = useToken(activeChain?.id ? BID_TOKEN_ADDRESS[activeChain.id] : '')

  return useMemo(() => {
    if (!token || !activeChain) return
    return new Token({
      chainId: activeChain.id,
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
    })
  }, [token, activeChain])
}
