import { Amount, Price, tryParseAmount } from '@sushiswap/currency'
import { STARGATE_ETH } from '@sushiswap/stargate'
import { useMemo } from 'react'

import { BridgeState } from '../../components'
import { useBridgeFees } from './useBridgeFees'

export const useBridgeOutput = (state: BridgeState) => {
  const { amount, dstToken, srcChainId, srcToken } = state
  const { bridgeFee, isLoading } = useBridgeFees(state)

  const srcAmountIn = Amount.fromRawAmount(
    srcToken?.isNative ? STARGATE_ETH[srcChainId] : srcToken?.wrapped,
    amount?.quotient.toString() || 0
  )

  const srcAmountOut = useMemo(
    () => (bridgeFee ? srcAmountIn?.subtract(bridgeFee) : undefined),
    [bridgeFee, srcAmountIn]
  )

  const dstAmountOut = useMemo(() => {
    if (!srcAmountOut || !dstToken) return
    return tryParseAmount(
      srcAmountOut.toFixed(srcAmountOut.currency.decimals > dstToken.decimals ? dstToken.decimals : undefined),
      dstToken
    )
  }, [dstToken, srcAmountOut])

  const price = useMemo(
    () => (amount && dstAmountOut ? new Price({ baseAmount: amount, quoteAmount: dstAmountOut }) : undefined),
    [amount, dstAmountOut]
  )

  return useMemo(
    () => ({
      srcAmountOut,
      dstAmountOut,
      price,
      bridgeFee,
      isLoading,
    }),
    [bridgeFee, dstAmountOut, isLoading, price, srcAmountOut]
  )
}
