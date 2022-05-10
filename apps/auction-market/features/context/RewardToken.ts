import { Amount, Token } from '@sushiswap/currency'

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
}
