import { parseUnits } from '@ethersproject/units'
import { ArrowSmDownIcon } from '@heroicons/react/outline'
import { ZERO } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import { Button, Dialog, Dots, Typography } from '@sushiswap/ui'
import { MIN_BID_AMOUNT } from 'config'
import { useAuctionMakerContract } from 'hooks/useAuctionMarketContract'
// import { createToast } from 'components'
import { ChangeEvent, FC, useCallback, useRef, useState } from 'react'
import { useAccount, useNetwork, useSendTransaction } from 'wagmi'

import { batchAction, startBidAction, unwindTokenAction } from './actions'
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
  const { data: account } = useAccount()
  const contract = useAuctionMakerContract()
  const { sendTransactionAsync, isLoading: isWritePending } = useSendTransaction()

  const bid = useCallback(async () => {
    if (!amount || !contract || !account?.address || !rewardToken) return

    const actions: string[] = []
    rewardToken.tokensToUnwind.forEach((token) =>
      actions.push(unwindTokenAction({ contract, token0: rewardToken.address, token1: token })),
    )
    actions.push(startBidAction({ contract, rewardTokenAddress: rewardToken.address, amount, to: account.address }))

    try {
      const data = await sendTransactionAsync({
        request: {
          from: account?.address,
          to: contract?.address,
          data: batchAction({ contract, actions }),
        },
      })

      // createToast({
      //   title: 'Create stream',
      //   description: `You have successfully created a stream`,
      //   promise: data.wait(),
      // })
    } catch (e: any) {
      // setError(e.message)
    }

    setAmount(undefined)
  }, [amount, account?.address, contract, rewardToken, sendTransactionAsync])

  const onInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (isNaN(+e.target.value) || +e.target.value <= 0 || !bidToken) {
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
            <div>
              You must bid at least{' '}
              {`
            ${bidToken ? Amount.fromRawAmount(bidToken?.currency, MIN_BID_AMOUNT).toExact() : ''} ${
                bidToken?.currency.symbol
              }`}
              .
            </div>
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
