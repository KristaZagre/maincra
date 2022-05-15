import { AddressZero } from '@ethersproject/constants'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { Contract } from 'ethers'
import { useContract, useNetwork, useSigner } from 'wagmi'

import AUCTION_MAKER_ABI from '../abis/auction-maker.json'

export function useAuctionMakerContract(): Contract | null {
  const { data: signer } = useSigner()
  const { activeChain } = useNetwork()
  return useContract({
    addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
    contractInterface: AUCTION_MAKER_ABI,
    signerOrProvider: signer,
  })
}
