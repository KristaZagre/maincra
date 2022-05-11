import { Amount, Token } from '@sushiswap/currency'
import { Decimal } from '@sushiswap/math'

export enum RewardTokenStatus {
  READY = "READY", // available for auction, RewardToken has balance/lpBalance and is NOT in an active auction
  PENDING = "PENDING", // Used in a live auction
}

export class RewardToken {
  public readonly token: Token
  public readonly balance: Amount<Token> | undefined
  public readonly liquidity: Amount<Token> | undefined
  public readonly status: RewardTokenStatus
  public constructor({
    token,
    balance,
    liquidity,
    isUsedInLiveAuction,
  }: {
    token: Token
    balance: Amount<Token> | undefined
    liquidity: Amount<Token> | undefined
    isUsedInLiveAuction: boolean
  }) {
    this.token = token
    this.balance = balance
    this.liquidity = liquidity
    this.status = isUsedInLiveAuction ? RewardTokenStatus.PENDING : RewardTokenStatus.READY
  }

  public get totalBalance(): string {
    return Decimal(this.balance?.toExact()).add(this.liquidity?.toExact()).toString()
  }

}
