import { AddressZero } from '@ethersproject/constants'
import { useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { useAuctionMakerContract } from './useAuctionMarketContract'

export function useUnfinalizedAuctions(auctionIds: string[]) {
  const contract = useAuctionMakerContract()
  const results = useSingleContractMultipleData(contract, 'bids', auctionIds?.map((id) => [id]))

  const anyLoading: boolean = useMemo(() => results.some((callState) => callState.loading), [results])
  return useMemo(() => {
    return contract && auctionIds && !anyLoading
      ? auctionIds.filter((auction, i) => {
          const bidder = results?.[i]?.result?.[0]
          const needsFinalizing = bidder != AddressZero
          if (needsFinalizing) {
            return auction
          }
        })
      : []
  }, [anyLoading, auctionIds, contract, results])
}
