import { ChainId } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'

import { BidRepresentation, UserRepresentation } from './representations'

export class Bid {
  public readonly id: string
  public readonly amount: Amount<Token>
  public readonly user: UserRepresentation
  public readonly timestamp: Date
  public readonly block: string

  public constructor({ bid }: { bid: BidRepresentation }) {
    this.id = bid.id
    this.amount = Amount.fromRawAmount(
      new Token({
        chainId: ChainId.KOVAN,
        address: bid.token.id,
        decimals: Number(bid.token.decimals),
        symbol: bid.token.symbol,
        name: bid.token.name,
      }),
       bid.amount,
    )
    this.user = bid.user
    this.timestamp = new Date(Number(bid.createdAtTimestamp) * 1000)
    this.block = bid.createdAtBlock
  }
}
