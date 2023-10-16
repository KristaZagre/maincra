import {
  SushiSwapV2Pool,
  Trade,
  TradeType,
  Version as TradeVersion,
  findSingleRouteExactIn,
} from '@sushiswap/amm'
import { BentoBoxChainId, isBentoBoxChainId } from '@sushiswap/bentobox-sdk'
import { RouteProcessor3ChainId } from '@sushiswap/route-processor-sdk'
import { RouteStatus } from '@sushiswap/tines'
import {
  SUSHISWAP_V2_FACTORY_ADDRESS,
  SushiSwapV2ChainId,
  isSushiSwapV2ChainId,
} from '@sushiswap/v2-sdk'
import {
  SushiSwapV2PoolState,
  useBentoBoxTotal,
  useCurrencyCombinations,
  useFeeData,
  useSushiSwapV2Pools,
} from '@sushiswap/wagmi'
import { useMemo } from 'react'
import { Amount, Type as Currency, WNATIVE } from 'sushi/currency'

export type UseTradeOutput =
  | Trade<
      Currency,
      Currency,
      TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
      TradeVersion.V1 | TradeVersion.V2
    >
  | undefined

/**
 * Returns trade for a desired swap.
 * @param chainId
 * @param tradeType whether we request an exact output amount or we provide an exact input amount
 * @param amountSpecified the exact amount to swap in/out
 * @param mainCurrency the desired input/payment currency
 * @param otherCurrency the desired output/payment currency
 */
export function useTrade(
  chainId: SushiSwapV2ChainId | RouteProcessor3ChainId,
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amountSpecified?: Amount<Currency>,
  mainCurrency?: Currency,
  otherCurrency?: Currency,
): UseTradeOutput {
  const { data } = useFeeData({
    chainId,
  })

  const [currencyIn, currencyOut] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [mainCurrency, otherCurrency]
        : [otherCurrency, mainCurrency],
    [tradeType, mainCurrency, otherCurrency],
  )

  // Generate currency combinations of input and output token based on configured bases
  const currencyCombinations = useCurrencyCombinations(
    chainId,
    currencyIn,
    currencyOut,
  )

  // SushiSwapV2 pairs
  const { data: pools } = useSushiSwapV2Pools(
    chainId as SushiSwapV2ChainId,
    currencyCombinations,
    {
      enabled: isSushiSwapV2ChainId(chainId),
    },
  )

  // Filter SushiSwapV2 and trident pools by existance
  const filteredPools = useMemo(
    () =>
      Object.values(
        pools
          // filter out invalid pools
          .filter(
            (
              result,
            ): result is [SushiSwapV2PoolState.EXISTS, SushiSwapV2Pool] =>
              Boolean(result[0] === SushiSwapV2PoolState.EXISTS && result[1]),
          )
          .map(([, pool]) => pool),
      ),
    [pools],
  )

  const currencyInRebase = useBentoBoxTotal(
    chainId as BentoBoxChainId,
    currencyIn,
    {
      enabled: isBentoBoxChainId(chainId),
    },
  )
  const currencyOutRebase = useBentoBoxTotal(
    chainId as BentoBoxChainId,
    currencyOut,
    {
      enabled: isBentoBoxChainId(chainId),
    },
  )

  return useMemo(() => {
    if (
      data?.gasPrice &&
      currencyIn &&
      currencyInRebase &&
      currencyOut &&
      currencyOutRebase &&
      currencyIn.wrapped.address !== currencyOut.wrapped.address &&
      chainId &&
      amountSpecified &&
      amountSpecified.greaterThan(0) &&
      otherCurrency &&
      filteredPools.length > 0
    ) {
      if (tradeType === TradeType.EXACT_INPUT) {
        if (chainId in SUSHISWAP_V2_FACTORY_ADDRESS) {
          const v2Route = findSingleRouteExactIn(
            currencyIn.wrapped,
            currencyOut.wrapped,
            amountSpecified.quotient,
            filteredPools.filter(
              (pool): pool is SushiSwapV2Pool =>
                pool instanceof SushiSwapV2Pool,
            ),
            WNATIVE[amountSpecified.currency.chainId],
            Number(data.gasPrice),
          )

          // console.log([
          //   currencyIn.wrapped,
          //   currencyOut.wrapped,
          //   BigNumber.from(amountSpecified.toShare(currencyInRebase).quotient.toString()).toString(),
          //   filteredPools
          //     .filter((pool): pool is ConstantProductPool => pool instanceof ConstantProductPool)
          //     .map((pool) => [pool.liquidityToken.address, pool.reserve0.toExact(), pool.reserve1.toExact()]),
          //   WNATIVE[amountSpecified.currency.chainId],
          //   data.gasPrice.toNumber(),
          // ])

          return Trade.exactIn(
            v2Route,
            amountSpecified,
            currencyOut,
            TradeVersion.V1,
            undefined,
            undefined,
          )
        }

        const v2Route = findSingleRouteExactIn(
          currencyIn.wrapped,
          currencyOut.wrapped,
          amountSpecified.quotient,
          filteredPools.filter(
            (pool): pool is SushiSwapV2Pool => pool instanceof SushiSwapV2Pool,
          ),
          WNATIVE[amountSpecified.currency.chainId],
          Number(data.gasPrice),
        )

        if (v2Route.status === RouteStatus.Success) {
          console.debug('Found v2 route', v2Route)
          return Trade.exactIn(
            v2Route,
            amountSpecified,
            currencyOut,
            TradeVersion.V1,
          )
        } else {
          console.debug('No v2 route', v2Route)
        }

        // TODO: Use best trade if both available
      } else if (tradeType === TradeType.EXACT_OUTPUT) {
        //
      }
    }
  }, [
    data,
    currencyIn,
    currencyInRebase,
    currencyOut,
    currencyOutRebase,
    chainId,
    amountSpecified,
    otherCurrency,
    filteredPools,
    tradeType,
  ])
}
