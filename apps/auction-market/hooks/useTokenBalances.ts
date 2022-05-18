import { isAddress } from '@ethersproject/address'
import { Token } from '@sushiswap/core-sdk'
import { Amount } from '@sushiswap/currency'
import { JSBI } from '@sushiswap/math'
import ERC20_ABI from 'abis/erc20.json'
import { Interface } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from '../lib/hooks/multicall'



const ERC20Interface = new Interface(ERC20_ABI)
const tokenBalancesGasRequirement = { gasRequired: 125_000 }

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
 export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: Amount<Token> | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address ?? "") !== false) ?? [],
    [tokens]
  )
  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])

  const balances = useMultipleContractSingleData(
    validatedTokenAddresses,
    ERC20Interface,
    'balanceOf',
    useMemo(() => [address], [address]),
    tokenBalancesGasRequirement
  )
  const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances])

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: Amount<Token> | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address.toLowerCase()] = Amount.fromRawAmount(token, amount)
            }
            return memo
          }, {})
        : {},
      anyLoading,
    ],
    [address, validatedTokens, anyLoading, balances]
  )
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: Amount<Token> | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}