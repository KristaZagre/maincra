import { AddressZero } from '@ethersproject/constants'
import { parseUnits } from '@ethersproject/units'
import { ArrowSmDownIcon } from '@heroicons/react/outline'
import { ZERO } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import { Button, Dialog, Dots, Typography } from '@sushiswap/ui'
import { createToast } from 'components/Toast'
import { AUCTION_MAKER_ADDRESSES } from 'config'
import { calculateMinimumBid } from 'functions/calculateMinimumBid'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useAuctionMakerContract } from 'hooks/useAuctionMarketContract'
import { ChangeEvent, FC, useCallback, useMemo, useRef, useState } from 'react'
import { useAccount, useContractWrite, useNetwork } from 'wagmi'

import AUCTION_MAKER_ABI from '../abis/auction-maker.json'
import { Auction } from './context/Auction'

interface BidModalProps {
  bidToken?: Amount<Token>
  auction?: Auction
}

const BidModal: FC<BidModalProps> = ({ auction, bidToken }) => {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<Amount<Token>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeChain } = useNetwork()
  const { data: account } = useAccount()
  const contract = useAuctionMakerContract()

  const { writeAsync: writePlaceBid, isLoading: isPlacingBid } = useContractWrite(
    {
      addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
      contractInterface: AUCTION_MAKER_ABI,
    },
    'placeBid',
    {
      onSuccess() {
        setOpen(false)
      },
    },
  )
  const [tokenApprovalState, approveToken] = useApproveCallback(open, amount, bidToken?.currency.address ?? undefined)

  const minimumBid = useMemo(
    () => (auction?.bidAmount ? calculateMinimumBid(auction?.bidAmount) : undefined),
    [auction],
  )

  const placeBid = useCallback(async () => {
    if (!amount || !contract || !account?.address) return
    try {
      const data = await writePlaceBid({
        args: [auction?.rewardAmount.currency.address, amount.quotient.toString(), account.address],
      })
    
      console.log({data})

      createToast({
        title: 'Place bid',
        description: `You have successfully placed a bid!`,
        promise: data.wait(),
      })
    } catch (e: any) {
      // setError(e.message)
      console.log({e})
    }

    setAmount(undefined)
  }, [amount, account?.address, contract, writePlaceBid, auction])

  const onInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (isNaN(+e.target.value) || +e.target.value < 0 || !bidToken) {
        setAmount(undefined)
      } else {
        setAmount(
          Amount.fromRawAmount(
            bidToken.currency,
            JSBI.BigInt(parseUnits(e.target.value, bidToken.currency.decimals).toString()),
          ),
        )
      }
    },
    [bidToken],
  )

  return (
    <>
      <Button
        variant="filled"
        color="gradient"
        // disabled={stream?.recipient.id.toLowerCase() !== account?.address?.toLowerCase()}
        onClick={() => {
          setOpen(true)
        }}
      >
        Bid
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="space-y-4 !max-w-sm">
          <Dialog.Header title="Make Bid" onClose={() => setOpen(false)} />
          {auction
            ? `${auction.remainingTime?.hours} H ${auction.remainingTime?.minutes} M ${auction.remainingTime?.seconds} S`
            : 'This will be the first bid to kickstart the auction!'}

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
              {`You must bid at least 
            ${minimumBid ? minimumBid.toExact() : ''} ${bidToken?.currency.symbol}`}
              .
            </div>
            <div>Reward amount: {`${auction?.rewardAmount.toExact()} ${auction?.rewardAmount.currency.symbol}`}.</div>
            <div className="flex justify-between gap-3">
              <Typography variant="sm" weight={400}>
                Bid Amount
              </Typography>
            </div>
            <div className="flex mb-3">
              <input
                value={amount?.toExact()}
                ref={inputRef}
                onChange={onInput}
                type="text"
                inputMode="decimal"
                title="Token Amount"
                autoComplete="off"
                autoCorrect="off"
                placeholder="0.00"
                pattern="^[0-9]*[.,]?[0-9]*$"
                className="p-0 pb-1 !border-b border-t-0 border-l-0 border-r-0 border-slate-700 placeholder:text-slate-500 bg-transparent 0 text-2xl !ring-0 !outline-none font-bold w-full"
              />
              <Typography
                weight={700}
                variant="sm"
                className="text-slate-200"
                onClick={() => {
                  if (bidToken?.currency && minimumBid) {
                    setAmount(
                      Amount.fromRawAmount(
                        bidToken.currency,
                        JSBI.BigInt(parseUnits(minimumBid.toExact(), bidToken.currency.decimals).toString()),
                      ),
                    )
                  }
                }}
              >
                USE MINIMUM
              </Typography>
            </div>
            <div>
              {bidToken?.currency &&
                tokenApprovalState !== ApprovalState.APPROVED &&
                tokenApprovalState !== ApprovalState.UNKNOWN && (
                  <Button
                    variant="filled"
                    color="blue"
                    fullWidth
                    disabled={tokenApprovalState === ApprovalState.PENDING}
                    onClick={approveToken}
                  >
                    {tokenApprovalState === ApprovalState.PENDING ? (
                      <Dots>Approving {bidToken?.currency?.symbol}</Dots>
                    ) : (
                      `Approve ${bidToken?.currency?.symbol}`
                    )}
                  </Button>
                )}
            </div>
            <div>Balance: {bidToken?.toExact()}</div>
            <Button
              variant="filled"
              color="gradient"
              fullWidth
              disabled={
                !amount ||
                isPlacingBid ||
                !bidToken ||
                tokenApprovalState !== ApprovalState.APPROVED ||
                !amount.greaterThan(ZERO) ||
                amount.greaterThan(JSBI.BigInt(bidToken.quotient))
              }
              onClick={placeBid}
            >
              {!amount?.greaterThan(ZERO) ? (
                'Enter an amount'
              ) : bidToken && amount.greaterThan(bidToken) ? (
                'Not enough balance'
              ) : isPlacingBid ? (
                <Dots>Confirming Bid</Dots>
              ) : (
                'Bid'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
export default BidModal
