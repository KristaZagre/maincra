import { Amount, Token } from '@sushiswap/currency'

export class RewardToken {
  public readonly address: string
  public readonly name?: string
  public readonly symbol?: string
  public readonly decimals: number
  public tokenBalance?: Amount<Token>
  public readonly lpBalance?: Amount<Token>
  // public readonly totalBalance?: JSBI getter
  public readonly tokensToUnwind: Set<string> = new Set()

  public constructor({
    token,
    tokenBalance,
    lpBalance,
  }: {
    token: Token
    tokenBalance?: Amount<Token>
    lpBalance?: Amount<Token>
  }) {
    this.address = token.address
    this.symbol = token.symbol
    this.decimals = token.decimals
    this.name = token.name
    this.tokenBalance = tokenBalance
    this.lpBalance = lpBalance
  }

  public addTokenToUnwind(address: string): void {
    this.tokensToUnwind.add(address)
  }

  public addLpBalance(amount: Amount<Token>): void {
    this.lpBalance?.add(amount)
  }

  public updateTokenBalance(amount: Amount<Token>) {
    this.tokenBalance = amount
  }

  public getTotalBalance(): string | undefined {
    if (!this.tokenBalance) {
      return this.lpBalance?.toExact()
    } 
    if (!this.lpBalance) {
      return this.tokenBalance.toExact()
    }
    return this.lpBalance?.add(this.tokenBalance).toExact()
  }
}
