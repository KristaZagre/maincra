import { Amount, Token } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import ERC20_ABI from 'abis/erc20.json'
import IUniswapV2PairABI from 'abis/IUniswapV2Pair.json'
import { Interface } from 'ethers/lib/utils'
import { PairRepresentation } from 'features/context/representations'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { useTokenBalancesWithLoadingIndicator } from './Tokens'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export function useTokensFromLP(
  chainId: number,
  address: string,
  pairs: PairRepresentation[] | undefined,
): [Amount<Token>[] | undefined, boolean] {
  const [lpTokens, lpTokensAssets] = toLpTokens(chainId, pairs)
  const [lpTokensWithBalance, loadingBalance] = useTokenBalancesWithLoadingIndicator(address, lpTokens)

  const filteredTokens = useMemo(
    () => Object.entries(lpTokensWithBalance).filter(([, token]) => token?.greaterThan(0)),
    [lpTokensWithBalance],
  )

  const lpAddresses = useMemo(() => filteredTokens.map((vt) => vt[0]), [filteredTokens])
  const ERC20Interface = new Interface(ERC20_ABI)
  const totalSupplies = useMultipleContractSingleData(lpAddresses, ERC20Interface, 'totalSupply')
  const reserves = useMultipleContractSingleData(lpAddresses, PAIR_INTERFACE, 'getReserves')
  const anyLoading: boolean = useMemo(
    () =>
      totalSupplies.some((callState) => callState.loading) ||
      reserves.some((callState) => callState.loading) ||
      loadingBalance,
    [totalSupplies, reserves, loadingBalance],
  )

  let summarizedTokens = useMemo(() => {
    if (anyLoading || !address || !filteredTokens.length) return []
    let tokens: Record<string, Amount<Token>> = {}

    filteredTokens.forEach(([lpAddress, token], i) => {
      const supply = JSBI.BigInt(totalSupplies?.[i]?.result?.[0])
      const pair = lpTokensAssets.get(lpAddress.toLowerCase())
      const balance = lpTokensWithBalance[lpAddress]?.quotient
      const reserve0 = JSBI.BigInt(reserves?.[i]?.result?.reserve0)
      const reserve1 = JSBI.BigInt(reserves?.[i]?.result?.reserve1)

      if (!supply || !token || !pair || !balance || !reserve0 || !reserve1) return

      const token0Liquidity = Amount.fromRawAmount(pair[0], JSBI.divide(JSBI.multiply(balance, reserve0), supply))
      const token1Liquidity = Amount.fromRawAmount(pair[1], JSBI.divide(JSBI.multiply(balance, reserve1), supply))
      const tokenAddress0 = pair[0].address.toLowerCase()
      const tokenAddress1 = pair[1].address.toLowerCase()
      tokens[tokenAddress0] ? tokens[tokenAddress0].add(token0Liquidity) : tokens[tokenAddress0] = token0Liquidity
      tokens[tokenAddress1] ? tokens[tokenAddress1].add(token1Liquidity) : tokens[tokenAddress1] = token1Liquidity
    })
    return tokens
  }
  , [anyLoading, address, filteredTokens, totalSupplies, reserves, lpTokensAssets, lpTokensWithBalance])
  return [Object.values(summarizedTokens), anyLoading]
}

export function toLpTokens(chainId: number, pairs: PairRepresentation[] | undefined): [Token[], Map<string, Token[]>] {
  if (!pairs) return [[], new Map()]
  return [
    Object.values(pairs).map(
      (pair) =>
        new Token({
          chainId,
          address: pair.id,
          decimals: 18,
          symbol: pair.token0.symbol.concat('/').concat(pair.token1.symbol),
          name: 'SUSHI LP Token',
        }),
    ),
    new Map(
      Object.values(pairs).map((pair) => [
        pair.id,
        [
          new Token({
            chainId,
            address: pair.token0.id,
            decimals: Number(pair.token0.decimals),
            symbol: pair.token0.symbol,
            name: pair.token0.name,
          }),
          new Token({
            chainId,
            address: pair.token1.id,
            decimals: Number(pair.token1.decimals),
            symbol: pair.token1.symbol,
            name: pair.token1.name,
          }),
        ],
      ]),
    ),
    // Object.values(pairs).map((pair) => ({
    //     [pair.id]: {
    //       token0: new Token({
    //         chainId,
    //         address: pair.token0.id,
    //         decimals: Number(pair.token0.decimals),
    //         symbol: pair.token0.symbol,
    //         name: pair.token0.name,
    //       }),
    //       token1: new Token({
    //         chainId,
    //         address: pair.token1.id,
    //         decimals: Number(pair.token1.decimals),
    //         symbol: pair.token1.symbol,
    //         name: pair.token1.name,
    //       }),
    //     },
    //   })),
  ]
}
