import { Chain } from '@sushiswap/chain'
import { shortenAddress } from '@sushiswap/format'
import { isStargateBridgeToken, STARGATE_BRIDGE_TOKENS, STARGATE_TOKEN } from '@sushiswap/stargate'
import { Button, LinkExternal } from '@sushiswap/ui'
import { Currency } from '@sushiswap/ui/components/currency'
import { Dots } from '@sushiswap/ui/components/dots'
import { FC } from 'react'

import { useTrade } from '../../../lib/swap/useTrade'
import { useSwapState } from '../trade/TradeProvider'
import { StepState } from './StepStates'

interface ConfirmationDialogContent {
  txHash?: string
  dstTxHash?: string
  lzUrl?: string
  dialogState: { source: StepState; bridge: StepState; dest: StepState }
}

export const ConfirmationDialogContent: FC<ConfirmationDialogContent> = ({ txHash, lzUrl, dstTxHash, dialogState }) => {
  const { network0, network1, token0, token1, recipient } = useSwapState()
  const { data: trade } = useTrade({ crossChain: true })

  const swapOnDest = !isStargateBridgeToken(token1)
  const dstBridgeToken = token1?.isToken && isStargateBridgeToken(token1) ? token1 : STARGATE_BRIDGE_TOKENS[network1][0]

  if (dialogState.source === StepState.Sign) {
    return <>Please sign order with your wallet.</>
  }

  if (dialogState.source === StepState.Pending) {
    return (
      <>
        Waiting for your{' '}
        <Button asChild size="sm" variant="link">
          <LinkExternal href={txHash ? Chain.from(network0).getTxUrl(txHash) : ''}>transaction</LinkExternal>
        </Button>{' '}
        to be confirmed on {Chain.from(network0).name}
      </>
    )
  }

  if (dialogState.source === StepState.Failed) {
    return (
      <>
        <span className="text-red">Oops!</span> Your{' '}
        <span className="text-blue hover:underline cursor-pointer">transaction</span> failed
      </>
    )
  }

  if (dialogState.bridge === StepState.Pending) {
    return (
      <>
        Bridging{' '}
        <Button asChild size="sm" variant="link">
          <LinkExternal href={lzUrl || ''}>
            <Dots>to destination chain</Dots>
          </LinkExternal>
        </Button>{' '}
        <span className="flex items-center gap-1">
          powered by{' '}
          <div className="min-h-4 min-w-4">
            <Currency.Icon currency={STARGATE_TOKEN} width={16} height={16} />
          </div>{' '}
          Stargate
        </span>
      </>
    )
  }

  if (dialogState.dest === StepState.PartialSuccess) {
    return (
      <>
        We {`couldn't`} swap {dstBridgeToken.symbol} into {token1?.symbol}, {dstBridgeToken.symbol} has been send to{' '}
        {recipient ? (
          <Button asChild size="sm" variant="link">
            <LinkExternal href={Chain.from(network1).getAccountUrl(recipient)}>
              <Dots>{shortenAddress(recipient)}</Dots>
            </LinkExternal>
          </Button>
        ) : (
          'recipient'
        )}
      </>
    )
  }

  if (dialogState.dest === StepState.Success) {
    if (swapOnDest) {
      return (
        <>
          You sold{' '}
          <Button asChild size="sm" variant="link">
            <LinkExternal href={txHash ? Chain.from(network0).getTxUrl(txHash) : ''}>
              {trade?.amountIn?.toSignificant(6)} {token0?.symbol}
            </LinkExternal>
          </Button>{' '}
          for{' '}
          <Button asChild size="sm" variant="link">
            <LinkExternal href={dstTxHash ? Chain.from(network1).getTxUrl(dstTxHash) : ''}>
              {trade?.amountOut?.toSignificant(6)} {token1?.symbol}
            </LinkExternal>
          </Button>
        </>
      )
    } else {
      return (
        <>
          Sent{' '}
          <Button asChild size="sm" variant="link">
            <LinkExternal href={dstTxHash ? Chain.from(network1).getTxUrl(dstTxHash) : ''}>
              {trade?.amountOut?.toSignificant(6)} {token1?.symbol}
            </LinkExternal>
          </Button>{' '}
          to {recipient ? shortenAddress(recipient) : 'recipient'}
        </>
      )
    }
  }

  return <span />
}