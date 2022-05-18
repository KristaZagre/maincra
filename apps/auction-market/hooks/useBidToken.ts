import { AddressZero } from '@ethersproject/constants'
import { Amount, Token } from '@sushiswap/currency'
import { AUCTION_MAKER_ADDRESSES } from 'config'
import { useMemo } from 'react'
import { useAccount, useBalance, useContractRead, useNetwork, useToken } from 'wagmi'

import AUCTION_MAKER_ABI from '../abis/auction-maker.json'

export function useBidTokenBalance(): Amount<Token> | undefined {
  const { activeChain } = useNetwork()
  const address = useAccount()
  const bidTokenAddress = useBidTokenAddress()
  const bidTokenData = useBalance({
    addressOrName: address?.data ? address.data?.address : AddressZero,
    token: bidTokenAddress ? bidTokenAddress : AddressZero,
    watch: true,
  })

  return useMemo(() => {
    if (!bidTokenData.data || !activeChain || !bidTokenAddress) return
    return Amount.fromRawAmount(
      new Token({
        chainId: activeChain.id,
        address: bidTokenAddress,
        decimals: bidTokenData.data.decimals,
        symbol: bidTokenData.data.symbol,
      }),
      bidTokenData.data.value.toString(),
    )
  }, [bidTokenData, activeChain])
}

export function useBidToken(): Token | undefined {
  const { activeChain } = useNetwork()
  const address = useBidTokenAddress()
  const token = useToken({ address })

  return useMemo(() => {
    if (!token.data || !activeChain) return
    return new Token({
      chainId: activeChain.id,
      address: token.data.address,
      decimals: token.data.decimals,
      symbol: token.data.symbol,
    })
  }, [token, activeChain])
}

export function useBidTokenAddress(): string | undefined {
  const { activeChain } = useNetwork()
  const { data } = useContractRead(
    {
      addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
      contractInterface: AUCTION_MAKER_ABI,
    },
    'bidToken',
  )
  return data ? data.toString() : undefined
}
