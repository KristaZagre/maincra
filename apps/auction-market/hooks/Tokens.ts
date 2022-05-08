import { arrayify } from '@ethersproject/bytes'
import { parseBytes32String } from '@ethersproject/strings'
import { ChainTokenMap, Token } from '@sushiswap/core-sdk'
import { isAddress, getAddress } from '@ethersproject/address'
import { NEVER_RELOAD, useMultipleContractSingleData, useSingleCallResult } from '../lib/hooks/multicall'
import { useCombinedActiveList } from '../lib/state/token-lists'
import { useMemo } from 'react'
import { useNetwork } from 'wagmi'
import { useBytes32TokenContract, useTokenContract } from './useContract'
import { Amount } from '@sushiswap/currency'
import ERC20_ABI  from 'abis/erc20.json'
import {JSBI} from '@sushiswap/math'
import { Interface } from 'ethers/lib/utils'

// reduce token map into standard address <-> Token mapping
function useTokensFromMap(tokenMap: ChainTokenMap): { [address: string]: Token } {
  const { activeChain } = useNetwork()
  const chainId = activeChain?.id

  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>(
      (newMap, address) => {
        newMap[address] = tokenMap[chainId][address].token
        return newMap
      },
      {},
    )

    return mapWithoutUrls
  }, [chainId, tokenMap])
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  return useTokensFromMap(allTokens)
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
    ? parseBytes32String(bytes32)
    : defaultValue
}

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
export function useToken(tokenAddress?: string | null): Token | undefined | null {
  const { activeChain } = useNetwork()
  const chainId = activeChain?.id
  const tokens = useAllTokens()

  const address = tokenAddress && isAddress(tokenAddress) ? getAddress(tokenAddress) : undefined

  const tokenContract = useTokenContract(address, false)
  const tokenContractBytes32 = useBytes32TokenContract(address, false)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD,
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)

  return useMemo(() => {
    if (token) return token
    if (tokenAddress === null) return null
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenAddress,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
  ])
}

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
 console.log({anyLoading, balances})

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: Amount<Token> | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = Amount.fromRawAmount(token, amount)
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