import { AddressZero } from '@ethersproject/constants'
import { ArrowSmDownIcon } from '@heroicons/react/outline'
import { ZERO } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import { Button, Dialog, Dots, Typography } from '@sushiswap/ui'
import AUCTION_MAKER_ABI from 'abis/auction-maker.json'
import { AUCTION_MAKER_ADDRESSES } from 'config'
// import { createToast } from 'components'
import { ChangeEvent, FC, useCallback, useRef, useState } from 'react'
import { useContractWrite, useNetwork } from 'wagmi'

import { RewardToken } from './context/RewardToken'

interface BidModalProps {
  bidToken?: Amount<Token>
  rewardToken: RewardToken
}

const BidModal: FC<BidModalProps> = ({ bidToken, rewardToken }) => {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<Amount<Token>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeChain } = useNetwork()

  const { writeAsync, isLoading: isWritePending } = useContractWrite(
    {
      addressOrName: activeChain?.id ? AUCTION_MAKER_ADDRESSES[activeChain.id] : AddressZero,
      contractInterface: AUCTION_MAKER_ABI,
    },
    'withdrawFromStream',
    {
      onSuccess() {
        setOpen(false)
      },
    },
  )

  const bid = useCallback(async () => {
    if (!amount) return
    const data = await writeAsync({
      // args: [BigNumber.from(stream.id), BigNumber.from(amount.quotient.toString()), stream.recipient.id, false, '0x'],
    })

    // createToast({
    //   title: 'Withdraw from stream',
    //   description: `You have successfully withdrawn ${amount.toSignificant(6)} ${
    //     amount.currency.symbol
    //   } from your stream`,
    //   promise: data.wait(),
    // })

    setAmount(undefined)
  }, [amount, writeAsync])

  const onInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (isNaN(+e.target.value) || +e.target.value <= 0) {
        setAmount(undefined)
      } 
      else {
        setAmount(bidToken)
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
          This will be the first bid to kickstart the auction!
          <div className="flex justify-center !-mb-8 !mt-3 relative">
            <div className="p-1 bg-slate-800 border-[3px] border-slate-700 rounded-2xl">
              <ArrowSmDownIcon width={24} height={24} className="text-slate-200" />
            </div>
          </div>
          <div
            className="-ml-6 !-mb-6 -mr-6 p-6 pt-8 bg-slate-800 border-t rounded-2xl border-slate-700 flex flex-col gap-1"
            onClick={() => inputRef.current?.focus()}
          >
            <div>You must bid at least 25 {bidToken?.currency.symbol}.</div>
            <div>Reward amount: {`${rewardToken.getTotalBalance()} ${rewardToken.symbol}`}.</div>
            <div className="flex justify-between gap-3">
              <Typography variant="sm" weight={400}>
                Bid Amount
              </Typography>
              <Typography
                weight={700}
                variant="sm"
                className="text-slate-200"
                onClick={() => {
                  // if (stream?.token) setAmount(balance)
                  // setAmount(JSBI.BigInt(bidToken.data?.value))
                }}
              >
                {/* {balance ? balance.toSignificant(6) : ''} {stream?.token.symbol} */}
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
            </div>
            <div>Balance: {bidToken?.toExact()}</div>
            <Button
              variant="filled"
              color="gradient"
              fullWidth
              disabled={
                isWritePending ||
                !amount ||
                !bidToken ||
                !amount.greaterThan(ZERO) ||
                amount.greaterThan(JSBI.BigInt(bidToken.quotient))
              }
              onClick={bid}
            >
              {!amount?.greaterThan(ZERO) ? (
                'Enter an amount'
              ) : bidToken && amount.greaterThan(bidToken) ? (
                'Not enough balance'
              ) : isWritePending ? (
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
