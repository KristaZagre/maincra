import { useTrade as useApiTrade } from '@sushiswap/react-query'
import { useFeeData } from '@sushiswap/wagmi'
import { useQuery } from '@tanstack/react-query'
import { log } from 'next-axiom'
import { useMemo } from 'react'
import { Amount, Currency, Native, axlUSDC } from 'sushi/currency'
import { ZERO_PERCENT } from 'sushi/math'
import { UseCrossChainTradeParams, UseCrossChainTradeReturn } from './types'

import { RouterLiquiditySource } from '@sushiswap/router'
import { AXELAR_ADAPTER_ADDRESS, AxelarAdapterChainId } from 'sushi/config'
import { parseUnits, stringify } from 'viem'
import {
  AXELAR_CHAIN_NAME,
  TransactionType,
  axelarQueryApi,
  encodeAxelarBridgeParams,
  encodeSwapData,
  estimateAxelarDstGas,
  getBridgeParams,
} from './SushiXSwap2'

export const useAxelarCrossChainTrade = ({
  network0,
  network1,
  token0,
  token1,
  amount,
  slippagePercentage,
  recipient,
  enabled,
  tradeId,
}: Omit<UseCrossChainTradeParams, 'network0' | 'network1'> & {
  network0: AxelarAdapterChainId
  network1: AxelarAdapterChainId
}) => {
  const { data: feeData0 } = useFeeData({ chainId: network0, enabled })
  const { data: feeData1 } = useFeeData({ chainId: network1, enabled })

  const bridgePath = useMemo(
    () => ({
      srcBridgeToken: axlUSDC[network0],
      dstBridgeToken: axlUSDC[network1],
    }),
    [network0, network1],
  )

  const isSrcSwap = Boolean(
    token0 &&
      bridgePath?.srcBridgeToken &&
      !token0.equals(bridgePath.srcBridgeToken),
  )
  const isDstSwap = Boolean(
    token1 &&
      bridgePath?.dstBridgeToken &&
      !token1.equals(bridgePath.dstBridgeToken),
  )

  const { data: srcTrade } = useApiTrade({
    chainId: network0,
    fromToken: token0,
    toToken: bridgePath?.srcBridgeToken,
    amount,
    slippagePercentage,
    gasPrice: feeData0?.gasPrice,
    recipient: AXELAR_ADAPTER_ADDRESS[network0],
    enabled: Boolean(isSrcSwap && enabled && amount),
    carbonOffset: false,
    source: RouterLiquiditySource.XSwap,
    onError: () => {
      log.error('xswap src swap api error')
    },
  })

  const { srcAmountOut, srcAmountOutMin, dstAmountIn, dstAmountInMin } =
    useMemo(() => {
      if (
        !amount ||
        !bridgePath ||
        (isSrcSwap && (!srcTrade?.amountOut || !srcTrade?.minAmountOut))
      )
        return {
          srcAmountOut: undefined,
          srcAmountOutMin: undefined,
          dstAmountIn: undefined,
          dstAmountInMin: undefined,
          bridgeImpact: undefined,
        }

      const srcAmountOut = isSrcSwap
        ? (srcTrade?.minAmountOut as Amount<Currency>)
        : amount

      const srcAmountOutMin = srcAmountOut

      const dstAmountIn = Amount.fromRawAmount(
        bridgePath.dstBridgeToken,
        parseUnits(srcAmountOut.toExact(), bridgePath.dstBridgeToken.decimals),
      )

      const dstAmountInMin = Amount.fromRawAmount(
        bridgePath.dstBridgeToken,
        parseUnits(
          srcAmountOutMin.toExact(),
          bridgePath.dstBridgeToken.decimals,
        ),
      )

      return {
        srcAmountOut,
        srcAmountOutMin,
        dstAmountIn,
        dstAmountInMin,
      }
    }, [
      bridgePath,
      isSrcSwap,
      srcTrade?.minAmountOut,
      srcTrade?.amountOut,
      amount,
    ])

  const { data: dstTrade } = useApiTrade({
    chainId: network1,
    amount: dstAmountIn,
    fromToken: bridgePath?.dstBridgeToken,
    toToken: token1,
    slippagePercentage,
    gasPrice: feeData1?.gasPrice,
    recipient,
    enabled: Boolean(isDstSwap && enabled && dstAmountIn),
    carbonOffset: false,
    source: RouterLiquiditySource.XSwap,
    onError: () => {
      log.error('xswap dst swap api error')
    },
  })

  return useQuery({
    queryKey: [
      'axelarCrossChainTrade',
      {
        tradeId,
        token0,
        token1,
        network0,
        network1,
        amount,
        slippagePercentage,
        recipient,
        srcTrade,
        dstTrade,
      },
    ],
    queryFn: async () => {
      if (
        !(
          token0 &&
          token1 &&
          amount &&
          bridgePath &&
          dstAmountIn &&
          feeData0?.gasPrice &&
          feeData1?.gasPrice
        )
      ) {
        throw new Error('useCrossChainTrade should not be enabled')
      }

      const { srcBridgeToken, dstBridgeToken } = bridgePath

      const dstAmountOut = isDstSwap ? dstTrade?.amountOut : dstAmountIn

      const dstAmountOutMin = isDstSwap
        ? dstTrade?.minAmountOut
        : dstAmountInMin

      let priceImpact = ZERO_PERCENT
      if (isSrcSwap) priceImpact = priceImpact.add(srcTrade?.priceImpact ?? 0)
      if (isDstSwap) priceImpact = priceImpact.add(dstTrade?.priceImpact ?? 0)

      if (!recipient) {
        return {
          priceImpact,
          amountIn: amount,
          amountOut: dstAmountOut,
          minAmountOut: dstAmountOutMin,
        } as UseCrossChainTradeReturn
      }

      const dstGasEstimate = estimateAxelarDstGas(dstTrade?.route?.gasSpent)

      let writeArgs
      let functionName
      let transactionType

      if (!isSrcSwap && !isDstSwap) {
        transactionType = TransactionType.Bridge
        functionName = 'bridge'
        writeArgs = [
          getBridgeParams({
            adapter: AXELAR_ADAPTER_ADDRESS[network0],
            amountIn: amount,
            to: recipient,
            adapterData: encodeAxelarBridgeParams({
              srcBridgeToken,
              dstBridgeToken,
              amount: amount.quotient,
              receiver: AXELAR_ADAPTER_ADDRESS[network1],
              to: recipient,
            }),
          }),
          recipient, // refundAddress
          '0x', // swapPayload
          '0x', // payloadData
        ]
      } else if (isSrcSwap && !isDstSwap && srcTrade?.minAmountOut) {
        const srcSwapData = encodeSwapData(
          srcTrade.writeArgs as Parameters<typeof encodeSwapData>[0],
        )

        transactionType = TransactionType.SwapAndBridge
        functionName = 'swapAndBridge'
        writeArgs = [
          getBridgeParams({
            adapter: AXELAR_ADAPTER_ADDRESS[network0],
            amountIn: amount,
            to: recipient,
            adapterData: encodeAxelarBridgeParams({
              srcBridgeToken,
              dstBridgeToken,
              amount: 0,
              receiver: AXELAR_ADAPTER_ADDRESS[network1],
              to: recipient,
            }),
          }),
          recipient, // refundAddress
          srcSwapData,
          '0x',
          '0x',
        ]
      } else if (!isSrcSwap && isDstSwap && dstTrade?.writeArgs) {
        const dstSwapData = encodeSwapData(
          dstTrade.writeArgs as Parameters<typeof encodeSwapData>[0],
        )

        transactionType = TransactionType.BridgeAndSwap
        functionName = 'bridge'
        writeArgs = [
          getBridgeParams({
            adapter: AXELAR_ADAPTER_ADDRESS[network0],
            amountIn: amount,
            to: recipient,
            adapterData: encodeAxelarBridgeParams({
              srcBridgeToken: srcBridgeToken,
              dstBridgeToken: dstBridgeToken,
              amount: amount.quotient,
              receiver: AXELAR_ADAPTER_ADDRESS[network1],
              to: recipient,
            }),
          }),
          recipient, // refundAddress
          dstSwapData,
          '0x', // dstPayload
        ]
      } else if (isSrcSwap && isDstSwap && srcTrade?.minAmountOut && dstTrade) {
        const srcSwapData = encodeSwapData(
          srcTrade.writeArgs as Parameters<typeof encodeSwapData>[0],
        )
        const dstSwapData = encodeSwapData(
          dstTrade.writeArgs as Parameters<typeof encodeSwapData>[0],
        )

        transactionType = TransactionType.CrossChainSwap
        functionName = 'swapAndBridge'
        writeArgs = [
          getBridgeParams({
            adapter: AXELAR_ADAPTER_ADDRESS[network0],
            amountIn: amount,
            to: recipient,
            adapterData: encodeAxelarBridgeParams({
              srcBridgeToken,
              dstBridgeToken,
              amount: 0,
              receiver: AXELAR_ADAPTER_ADDRESS[network1],
              to: recipient,
            }),
          }),
          recipient, // refundAddress
          srcSwapData, //srcSwapPayload
          dstSwapData, // dstPayload
          '0x',
        ]
      } else {
        throw new Error('Crosschain swap not found.')
      }

      const bridgeFeeAmount = BigInt(
        (await axelarQueryApi.estimateGasFee(
          AXELAR_CHAIN_NAME[network0],
          AXELAR_CHAIN_NAME[network1],
          Native.onChain(network0).symbol,
          dstGasEstimate,
        )) as string,
      )

      const bridgeFee = Amount.fromRawAmount(
        Native.onChain(network0),
        bridgeFeeAmount,
      )

      const value = amount.currency.isNative
        ? BigInt(amount.quotient) + BigInt(bridgeFeeAmount)
        : BigInt(bridgeFeeAmount)

      // est 200K gas for Axelar call
      const srcGasEstimate = 200_000n + BigInt(srcTrade?.route?.gasSpent ?? 0)

      const srcGasFee = Amount.fromRawAmount(
        Native.onChain(network0),
        srcGasEstimate * feeData0.gasPrice,
      )

      const gasSpent = srcGasFee.add(bridgeFee)

      return {
        transactionType,
        srcBridgeToken,
        dstBridgeToken,
        priceImpact,
        amountIn: amount,
        amountOut: dstAmountOut,
        minAmountOut: dstAmountOutMin,
        gasSpent: gasSpent.toFixed(6),
        bridgeFee: bridgeFee.toFixed(6),
        srcGasFee: srcGasFee.toFixed(6),
        writeArgs,
        route: {
          status: '',
        },
        functionName,
        value,
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    keepPreviousData: false,
    cacheTime: 0,
    enabled:
      enabled &&
      Boolean(
        network0 && network1 && token0 && token1 && amount && bridgePath,
      ) &&
      (isSrcSwap ? Boolean(srcTrade) : true) &&
      (isDstSwap ? Boolean(dstTrade) : true),
    queryKeyHashFn: stringify,
  })
}
