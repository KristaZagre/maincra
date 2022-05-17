import { Amount, Token } from '@sushiswap/currency'

import { Bid } from './Bid'
import { AuctionRepresentation, AuctionStatus, TokenRepresentation } from './representations'


export class Auction {
  public readonly id: string
  public readonly status: AuctionStatus
  public readonly amount: Amount<Token>
  public readonly leadingBid: Bid
  public readonly startDate: Date
  public readonly endDate: Date
  public readonly token: TokenRepresentation // TODO: replace, use Token from package/currency?
  public readonly bids?: Bid[]
  private readonly minTTL: Date
  private readonly maxTTL: Date

  public constructor({ bidToken, auction }: { bidToken: Token, auction: AuctionRepresentation }) {
    this.id = auction.id
    this.amount = Amount.fromRawAmount(bidToken, auction.rewardAmount)
    this.leadingBid = new Bid({ bid: auction.leadingBid })
    this.startDate = new Date(Number(auction.createdAtTimestamp) * 1000)
    this.minTTL = new Date(Number(auction.minTTL) * 1000)
    this.maxTTL = new Date(Number(auction.maxTTL) * 1000)
    this.token = auction.token

    if (auction.status === AuctionStatus.ONGOING) {
      const endTime = this.minTTL < this.maxTTL ? this.minTTL.getTime() : this.maxTTL.getTime()
      this.endDate = new Date(endTime * 1000)
    } else {
      this.endDate = new Date(Number(auction.modifiedAtTimestamp) * 1000)
    }
    const now = Date.now() * 1000
    this.status = this.endDate.getTime() >= now ? AuctionStatus.ONGOING : AuctionStatus.FINISHED
    
    this.bids = auction.bids?.map((bid) => new Bid({ bid }))
  }

  public get remainingTime(): { days: number; hours: number; minutes: number; seconds: number } | undefined {
    if (this.status === AuctionStatus.ONGOING) {
      const now = Date.now()
      const interval = this.endDate.getTime() - now

      let days = Math.floor(interval / (1000 * 60 * 60 * 24))
      let hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      let minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60))
      let seconds = Math.floor((interval % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds }
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

}
