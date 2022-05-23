import { Amount, Token } from '@sushiswap/currency'
import { toToken } from 'features/mapper'

import { Bid } from './Bid'
import { AuctionRepresentation, AuctionStatus } from './representations'

export class Auction {
  public readonly id: string
  public readonly status: AuctionStatus
  public readonly rewardAmount: Amount<Token>
  public readonly bidAmount: Amount<Token>
  public readonly leadingBid?: Bid
  public readonly startDate: Date
  public readonly endDate: Date
  public readonly bids?: Bid[]
  public readonly txHash: string
  private readonly minTTL: Date
  private readonly maxTTL: Date

  public constructor({ chainId, auction }: { chainId: number, auction: AuctionRepresentation }) {
    this.id = auction.id
    this.rewardAmount = Amount.fromRawAmount(toToken(chainId, auction.rewardToken), auction.rewardAmount)
    this.bidAmount = Amount.fromRawAmount(toToken(chainId, auction.bidToken), auction.bidAmount)
    if (auction.leadingBid) {
      this.leadingBid = new Bid({ bid: auction.leadingBid })
    }
    this.startDate = new Date(Number(auction.createdAtTimestamp) * 1000)
    this.minTTL = new Date(Number(auction.minTTL) * 1000)
    this.maxTTL = new Date(Number(auction.maxTTL) * 1000)
    this.txHash = auction.txHash
    const now = Date.now()
    if (this.minTTL.getTime() > now && this.maxTTL.getTime() > now) {
      this.endDate = this.minTTL < this.maxTTL ? this.minTTL : this.maxTTL
      this.status = AuctionStatus.ONGOING
    } else {
      this.endDate = new Date(Number(auction.modifiedAtTimestamp) * 1000)
      this.status = AuctionStatus.FINISHED
    }

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
