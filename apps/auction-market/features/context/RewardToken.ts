import { Amount, Token } from '@sushiswap/currency'

export class RewardToken {
  public readonly address: string
  public readonly name?: string
  public readonly symbol?: string
  public readonly decimals: number
  public tokenBalance?: Amount<Token>
  public readonly lpBalance?: Amount<Token>
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

  public getTotalBalance(): Amount<Token> | undefined {
    if (this.tokenBalance && this.lpBalance) {
      return this.lpBalance?.add(this.tokenBalance)
    } else if (!this.tokenBalance && this.lpBalance) {
      return this.lpBalance
    } else if (this.tokenBalance && !this.lpBalance) {
      return this.tokenBalance
    }
    return undefined
  }
}
