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
        address: bid.bidToken.id,
        decimals: Number(bid.bidToken.decimals),
        symbol: bid.bidToken.symbol,
        name: bid.bidToken.name,
      }),
       bid.amount,
    )
    this.user = bid.user
    this.timestamp = new Date(Number(bid.createdAtTimestamp) * 1000)
    this.block = bid.createdAtBlock
  }
}
