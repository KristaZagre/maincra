import { Auction } from './Auction'
import { AuctionRepresentation, AuctionStatus } from './representations'
import { RewardToken } from './RewardToken'

export class AuctionMarket {
  public readonly live: number
  public readonly notStarted: number
  public readonly finalised: number

  public constructor({ auctions, rewardTokens }: { auctions?: Auction[]; rewardTokens: RewardToken[] }) {
    let live = 0
    let finalised = 0
    auctions?.forEach((auction) => {
      if (auction.status === AuctionStatus.FINISHED) {
        finalised++
      } else {
        live++
      }
    })
    this.live = live
    this.finalised = finalised
    this.notStarted = rewardTokens.filter((token) =>
      auctions?.some((auction) => auction.token.id !== token.token.address),
    ).length
  }
}
