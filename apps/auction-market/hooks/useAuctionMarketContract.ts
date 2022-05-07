import { AddressZero } from '@ethersproject/constants'
import { useMemo } from 'react'
import { useBalance, useContract, useContractRead, useNetwork, useSigner } from 'wagmi'
import AUCTION_MAKER_ABI from '../abis/auction-maker.json'
import { Contract } from 'ethers'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'


export function useAuctionMakerContract(): Contract | null {
  const { data: signer } = useSigner()
  const { activeChain } = useNetwork()
  return useContract({
    addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
    contractInterface: AUCTION_MAKER_ABI,
    signerOrProvider: signer,
  })
}


export function useAuctionMakerBalance() {
  const { activeChain } = useNetwork()
  const balance = useBalance({
    addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
    watch: true,
  })
  console.log(balance.data)

  // return balance
}

// export function useStreamBalance(streamId?: string, token?: Token): Amount<Token> | undefined {
//   const { activeChain } = useNetwork()
//   const { data, error, isLoading } = useContractRead(
//     {
//       addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
//       contractInterface: AUCTION_MAKER_ABI,
//     },
//     'streamBalanceOf',
//     { args: [streamId], watch: true },
//   )

//   return useMemo(() => {
//     if (error || isLoading || !data || !streamId || !token) return undefined
//     return Amount.fromRawAmount(token, JSBI.BigInt(data[1]))
//   }, [data, error, isLoading, streamId, token])
// }
