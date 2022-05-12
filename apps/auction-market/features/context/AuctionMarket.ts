import { Amount, Token } from '@sushiswap/currency'
import { LiquidityPosition } from 'features/LiquidityPosition'
import { Auction } from './Auction'
import { AuctionStatus } from './representations'

export class AuctionMarket {
  public readonly live: Set<string> = new Set()
  public readonly waiting: Set<string> = new Set()
  public readonly finalised: Set<string> = new Set()

  public constructor({
    auctions,
    liquidityPositions,
    balances,
  }: {
    auctions?: Auction[]
    liquidityPositions: LiquidityPosition[]
    balances: (Amount<Token> | undefined)[]
  }) {
    auctions?.forEach((auction) => {
      if (auction.status === AuctionStatus.FINISHED) {
        this.finalised.add(auction.token.id)
      } else {
        this.live.add(auction.token.id)
      }
    })
    
    balances.forEach((balance) => {
      const address = balance?.currency.address.toLowerCase()
      if (address && this.hasNotBeenIncluded(address)) {
        this.waiting.add(address)
      }
    })
    liquidityPositions.forEach((lp) => {
      if (this.hasNotBeenIncluded(lp.pair.token0.address.toLowerCase())) {
        this.waiting.add(lp.pair.token0.address.toLowerCase())
      }
      if (this.hasNotBeenIncluded(lp.pair.token1.address.toLowerCase())) {
        this.waiting.add(lp.pair.token1.address.toLowerCase())
      }
    })
  }

  private hasNotBeenIncluded(address: string): boolean {
    return !this.live.has(address) || !this.waiting.has(address) || !this.finalised.has(address)
  }
}
