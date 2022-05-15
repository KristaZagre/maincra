import { BigNumber } from 'ethers'

import { BidRepresentation, UserRepresentation } from './representations'

export class Bid {
  public readonly id: string
  public readonly amount: BigNumber
  public readonly user: UserRepresentation
  public readonly timestamp: Date
  public readonly block: BigNumber
  
  public constructor({ bid }: { bid: BidRepresentation }) {
    this.id = bid.id
    this.amount = BigNumber.from(bid.amount)
    this.user = bid.user
    this.timestamp = new Date(parseInt(bid.createdAtTimestamp) * 1000)
    this.block = BigNumber.from(bid.createdAtBlock)
  }
}
