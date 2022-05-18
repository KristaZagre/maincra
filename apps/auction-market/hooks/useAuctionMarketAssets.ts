import { ChainId } from '@sushiswap/chain'
import { CurrencyAmount, Pair } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'
import { AUCTION_MAKER_ADDRESSES } from 'config'
import { parseUnits } from 'ethers/lib/utils'
import {
  LiquidityPositionRepresentation,
  TokenRepresentation,
} from 'features/context/representations'
import { LiquidityPosition } from 'features/LiquidityPosition'
import { useMemo } from 'react'

import { useTokenBalancesWithLoadingIndicator } from './useTokenBalances'

const LP_DECIMALS = 18

export function useAuctionMakerBalance(
  chainId: ChainId,
  bidTokenAddress: string | undefined,
  tokenRepresentations: TokenRepresentation[] | undefined,
): [(Amount<Token> | undefined)[], boolean] {
  const tokens = useMemo(
    () =>
      tokenRepresentations?.filter(token => token.id.toLowerCase() !== bidTokenAddress?.toLowerCase())
      .map(
        (token) =>
          new Token({
            chainId,
            address: token.id,
            decimals: Number(token.decimals),
            name: token.name,
            symbol: token.symbol,
          }),
      ),
    [tokenRepresentations, chainId],
  )
  const [balances, loading] = useTokenBalancesWithLoadingIndicator(AUCTION_MAKER_ADDRESSES[chainId], tokens)
  const filteredBalances = Object.values(balances).filter((token) => token?.greaterThan(0))
  return [filteredBalances, loading]
}

export function useLiquidityPositionedPairs(
  liquidityPositions: LiquidityPositionRepresentation[] | undefined,
): LiquidityPosition[] {
  //   // TODO: fix chainId, should it be passed in from queryParam or fetched from wagmi network hook?
  //   // The data is coming from subgraph initially, which is determined from queryparam
  return useMemo(
    () => liquidityPositions ? 
      liquidityPositions?.map((lp) => {
        const lpToken = new Token({
          chainId: ChainId.KOVAN,
          address: lp.pair.id,
          decimals: LP_DECIMALS,
        })
        const token0 = new Token({
          chainId: ChainId.KOVAN,
          address: lp.pair.token0.id,
          decimals: Number(lp.pair.token0.decimals),
          symbol: lp.pair.token0.symbol,
          name: lp.pair.token0.name,
        })
        const token1 = new Token({
          chainId: ChainId.KOVAN,
          address: lp.pair.token1.id,
          decimals: Number(lp.pair.token1.decimals),
          symbol: lp.pair.token1.symbol,
          name: lp.pair.token1.name,
        })
        return {
          pair: new Pair(
            CurrencyAmount.fromRawAmount(
              token0,
              parseUnits(lp.pair.reserve0, Number(lp.pair.token0.decimals)).toString(),
            ),
            CurrencyAmount.fromRawAmount(
              token1,
              parseUnits(lp.pair.reserve1, Number(lp.pair.token1.decimals)).toString(),
            ),
          ),
          balance: CurrencyAmount.fromRawAmount(lpToken, parseUnits(lp.liquidityTokenBalance, LP_DECIMALS).toString()),
          totalSupply: CurrencyAmount.fromRawAmount(lpToken, parseUnits(lp.pair.totalSupply, LP_DECIMALS).toString()),
        }
      }) : [],
    [liquidityPositions],
  )
}
