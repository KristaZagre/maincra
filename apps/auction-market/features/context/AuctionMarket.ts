import { Amount, Token } from '@sushiswap/currency'
import { LiquidityPosition } from 'features/LiquidityPosition'
import { Auction } from './Auction'
import { AuctionStatus } from './representations'

export class AuctionMarket {
  public readonly live: Set<string> = new Set()
  public readonly waiting: Record<string, Amount<Token>> = {}
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
      if (balance && address && this.hasNotBeenIncluded(address)) {
        this.waiting[address] = balance
      }
    })
    liquidityPositions.forEach((lp) => {
      if (this.hasNotBeenIncluded(lp.pair.token0.address.toLowerCase())) {
        const liquidity = Amount.fromRawAmount(
          lp.pair.token0,
          lp.pair.getLiquidityValue(lp.pair.token0, lp.totalSupply, lp.balance).quotient.toString(),
        )
        this.waiting[lp.pair.token0.address.toLowerCase()] = liquidity
      }
      if (this.hasNotBeenIncluded(lp.pair.token1.address.toLowerCase())) {
        const liquidity = Amount.fromRawAmount(
          lp.pair.token1,
          lp.pair.getLiquidityValue(lp.pair.token1, lp.totalSupply, lp.balance).quotient.toString(),
        )
        this.waiting[lp.pair.token1.address.toLowerCase()] = liquidity
      }
    })
  }

  private hasNotBeenIncluded(address: string): boolean {
    return !this.live.has(address) || !this.waiting[address] || !this.finalised.has(address)
  }
}
