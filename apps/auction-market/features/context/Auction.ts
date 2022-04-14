import { BigNumber } from 'ethers'
import { access } from 'fs'
import { Bid } from './Bid'
import { AuctionRepresentation, AuctionStatus, TokenRepresentation } from './representations'

export class Auction {
  public readonly id: string
  public readonly status: AuctionStatus
  public readonly amount: BigNumber
  public readonly leadingBid: Bid
  public readonly startTime: Date
  public readonly endTime: Date
  public readonly token: TokenRepresentation // TODO: replace, use Currency from package/currency?
  private readonly minTTL: number
  private readonly maxTTL: number

  public constructor({ auction }: { auction: AuctionRepresentation }) {
    this.id = auction.id
    this.status = AuctionStatus[auction.status]
    this.amount = BigNumber.from(auction.rewardAmount)
    this.leadingBid = new Bid({bid: auction.leadingBid})
    this.startTime = new Date(parseInt(auction.createdAtTimestamp) * 1000)

    if (this.status === AuctionStatus.FINISHED) {
        this.endTime = new Date(parseInt(auction.maxTTL) * 1000)
    }
  }

//   public get remainingTime(): { days: number; hours: number; minutes: number; seconds: number } | undefined {
//     if (this.status !== StreamStatus.CANCELLED) {
//       const now = Date.now()
//       const interval = this.endTime.getTime() - now

//       let days = Math.floor(interval / (1000 * 60 * 60 * 24))
//       let hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
//       let minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60))
//       let seconds = Math.floor((interval % (1000 * 60)) / 1000)

//       return { days, hours, minutes, seconds }
//     }
//     return { days: 0, hours: 0, minutes: 0, seconds: 0 }
//   }
}
