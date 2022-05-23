import { AddressZero } from '@ethersproject/constants'
import { ArrowSmDownIcon } from '@heroicons/react/outline'
import { Amount, Token } from '@sushiswap/currency'
import { shortenAddress } from '@sushiswap/format'
import { Button, Dialog, Typography } from '@sushiswap/ui'
import { createToast } from 'components/Toast'
import { AUCTION_MAKER_ADDRESSES } from 'config'
import { useAuctionMakerContract } from 'hooks/useAuctionMarketContract'
import { FC, useCallback, useRef, useState } from 'react'
import { useAccount, useContractWrite, useNetwork } from 'wagmi'

import AUCTION_MAKER_ABI from '../abis/auction-maker.json'
import { Auction } from './context/Auction'

interface FinalizeAuctionModalProps {
  bidToken?: Amount<Token>
  auction?: Auction
}

const FinalizeAuctionModal: FC<FinalizeAuctionModalProps> = ({ auction, bidToken }) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeChain } = useNetwork()
  const { data: account } = useAccount()
  const contract = useAuctionMakerContract()

  const { writeAsync: writeEndAuction, isLoading: isEndingAuction } = useContractWrite(
    {
      addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
      contractInterface: AUCTION_MAKER_ABI,
    },
    'end',
    {
      onSuccess() {
        setOpen(false)
      },
    },
  )

  const finalizeAuction = useCallback(async () => {
    if (!contract || !account?.address) return
    try {
      const data = await writeEndAuction({
        args: [auction?.rewardAmount.currency.address],
      })
      createToast({
        title: 'End auction',
        description: `You have successfully finalized an auction!`,
        promise: data.wait(),
      })
    } catch (e: any) {
      // setError(e.message)
      console.log({ e })
    }

  }, [account?.address, contract, writeEndAuction, auction])

  return (
    <>
      <Button
        variant="filled"
        color="gradient"
        onClick={() => {
          setOpen(true)
        }}
      >
        Finalize
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="space-y-4 !max-w-sm">
          <Dialog.Header title="Finalization" onClose={() => setOpen(false)} />
          {auction
            ? `${auction.remainingTime?.hours} H ${auction.remainingTime?.minutes} M ${auction.remainingTime?.seconds} S`
            : ''}

          <div className="flex justify-center !-mb-8 !mt-3 relative">
            <div className="p-1 bg-slate-800 border-[3px] border-slate-700 rounded-2xl">
              <ArrowSmDownIcon width={24} height={24} className="text-slate-200" />
            </div>
          </div>
          <div
            className="-ml-6 !-mb-6 -mr-6 p-6 pt-8 bg-slate-800 border-t rounded-2xl border-slate-700 flex flex-col gap-1"
            onClick={() => inputRef.current?.focus()}
          >
            <div>
              <Typography variant="sm" weight={400}>
                {`Bid from ${
                  auction?.leadingBid?.user.id ? shortenAddress(auction?.leadingBid?.user.id) : 'NA'
                } is accepted.`}
              </Typography>

              <Typography variant="lg" weight={700}>
                {`Amount: ${auction?.leadingBid?.amount.toExact()} ${auction?.leadingBid?.amount.currency.symbol}`}
              </Typography>
              <Typography variant="sm" weight={400}>
                The fund from non-accepted bids will be returned to participants once the auction is finalized.
              </Typography>
            </div>

            <Button variant="filled" color="gradient" fullWidth disabled={isEndingAuction} onClick={finalizeAuction}>
              Finalize Auction
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
export default FinalizeAuctionModal
