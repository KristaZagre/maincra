import { CurrencyAmount, Pair } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'

export interface LiquidityPosition {
  pair: Pair
  balance: CurrencyAmount<Token>
  totalSupply: CurrencyAmount<Token>
}
