import { Pair } from '.graphclient'
import { Amount, Token } from '@sushiswap/currency'
import { Interface } from 'ethers/lib/utils'
import { PairRepresentation } from 'features/context/representations'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { useTokenBalancesWithLoadingIndicator } from './Tokens'
import ERC20_ABI from 'abis/erc20.json'
import { Decimal, JSBI } from '@sushiswap/math'

interface LpToken {
  [address: string]: Token
}

interface LpTokenAssets {
  [address: string]: {
    token0: Token
    token1: Token
  }
}


export function useTokensFromLP(chainId: number, address: string, pairs: PairRepresentation[] | undefined): Token[] {
  const [lpTokens, lpTokensAssets] = toLpTokens(chainId, pairs)
  const [lpTokensWithBalance, loading] = useTokenBalancesWithLoadingIndicator(address, lpTokens)

  const filteredTokens = useMemo(
    () => Object.entries(lpTokensWithBalance).filter(([, token]) => token?.greaterThan(0)),
    [lpTokensWithBalance],
  )
  // get total value
//   const validatedTokenAddresses = useMemo(() => filteredTokens.map((vt) => vt[0]), [filteredTokens])
//   const ERC20Interface = new Interface(ERC20_ABI)
//   console.log(validatedTokenAddresses)
//   const totalSupply = useMultipleContractSingleData(
//     validatedTokenAddresses,
//     ERC20Interface,
//     'totalSupply'
//   )
//   console.log({totalSupply})
//   const ratio = useMemo(() => {
//     return [
//       address && filteredTokens.length > 0
//         ? filteredTokens.map(([lpAddress, token], i) => {
//             const value = totalSupply?.[i]?.result?.[0]
//             if (!value || !token) return
//             const amount = Amount.fromRawAmount(token.currency, value)
//             const ratio = amount.divide(token.quotient)
//             return { [lpAddress]: Decimal(ratio.toExact()) }
//           }, {})
//         : [],
//     ]
//   }, [totalSupply, address, filteredTokens])

  // get balance for lp 1, token a and token b
  // get balance for lp 2, token a and token c
//   [token a, token b]
//   [arg: lp1]

//   console.log({ratio})
  // filteredTokens
    // const lpAssetsWithBalance = filteredTokens.map(([address]) => lpTokensAssets.get(address.toLowerCase()))
  //   console.log({lpAssetsWithBalance})

  //       console.log(address)
  //     return lpTokensAssets.})
  // const lpAssetsWithBalance = [...filteredTokens.v]
  //   console.log({lpAssetsWithBalance})

  // Multicall

  // return
  return []
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
