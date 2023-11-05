import { useLocalStorage } from '@sushiswap/hooks'
import { useTrade as useApiTrade } from '@sushiswap/react-query'
import { ADDRESS_ZERO } from '@sushiswap/v3-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChainId } from 'sushi/chain'
import { isSwapApiEnabledChainId } from 'sushi/config'
import { Amount, Type, USDC } from 'sushi/currency'
import { Fraction } from 'sushi/math'
import { parseUnits } from 'viem'
import { useClientTrade, useFeeData, watchNetwork } from '../..'

interface UsePrice {
  currency: Type | undefined
}

const useSwapApi = () => useLocalStorage('swapApi', true)

const SWAP_API_BASE_URL =
  process.env.SWAP_API_V0_BASE_URL ||
  process.env.NEXT_PUBLIC_SWAP_API_V0_BASE_URL

const useFallback = (chainId?: ChainId) => {
  const [swapApi] = useSwapApi()

  const initialFallbackState = useMemo(
    () =>
      chainId &&
      (!isSwapApiEnabledChainId(chainId) ||
        (isSwapApiEnabledChainId(chainId) &&
          typeof SWAP_API_BASE_URL === 'undefined')),

    [chainId],
  )

  const [isFallback, setIsFallback] = useState(initialFallbackState)

  const resetFallback = useCallback(() => {
    setIsFallback(initialFallbackState)
  }, [initialFallbackState])

  return {
    isFallback: !swapApi || isFallback,
    setIsFallback,
    resetFallback,
  }
}

export const usePrice = ({ currency }: UsePrice) => {
  const { data: feeData } = useFeeData({
    chainId: currency?.chainId,
    enabled: Boolean(currency?.chainId),
  })

  const { isFallback, setIsFallback, resetFallback } = useFallback(
    currency?.chainId,
  )

  const swapAmount = useMemo(
    () =>
      currency && currency.chainId in USDC
        ? Amount.fromRawAmount(
            USDC[currency.chainId as keyof typeof USDC],
            parseUnits(
              '10',
              USDC[currency.chainId as keyof typeof USDC].decimals,
            ),
          )
        : undefined,
    [currency],
  )

  const apiTrade = useApiTrade({
    chainId: currency?.chainId as ChainId,
    fromToken: swapAmount?.currency,
    toToken: currency,
    amount: swapAmount,
    slippagePercentage: '0.5',
    gasPrice: feeData?.gasPrice,
    recipient: ADDRESS_ZERO,
    enabled: Boolean(
      !isFallback &&
        swapAmount &&
        currency &&
        !swapAmount.currency.equals(currency),
    ),
    carbonOffset: false,
    onError: () => {
      console.error('api trade error')
      setIsFallback(true)
    },
  })

  const clientTrade = useClientTrade({
    chainId: currency?.chainId as ChainId,
    fromToken: swapAmount?.currency,
    toToken: currency,
    amount: swapAmount,
    slippagePercentage: '0.5',
    gasPrice: feeData?.gasPrice,
    recipient: ADDRESS_ZERO,
    enabled: Boolean(
      isFallback &&
        swapAmount &&
        currency &&
        !swapAmount.currency.equals(currency),
    ),
    carbonOffset: false,
    onError: () => {
      console.error('client trade error')
    },
  })

  // Reset the fallback on network switch
  useEffect(() => {
    const unwatch = watchNetwork(({ chain }) => {
      if (chain) {
        resetFallback()
      }
    })
    return () => unwatch()
  }, [resetFallback])

  return useMemo(() => {
    const tradeResponse = (isFallback ? clientTrade : apiTrade) as ReturnType<
      typeof useApiTrade
    >
    return {
      ...tradeResponse,
      data:
        swapAmount && currency && swapAmount.currency.equals(currency)
          ? new Fraction(
              parseUnits('1', 18).toString(),
              parseUnits('1', 18).toString(),
            )
          : tradeResponse?.data?.swapPrice
          ? new Fraction(
              parseUnits(
                tradeResponse?.data?.swapPrice
                  ?.invert()
                  ?.toFixed(17), // div by 10
                18,
              ).toString(),
              parseUnits('1', 18).toString(),
            )
          : undefined,
    }
  }, [isFallback, apiTrade, clientTrade, swapAmount, currency])
}
