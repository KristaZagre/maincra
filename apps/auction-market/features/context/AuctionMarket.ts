import { Amount, Token } from '@sushiswap/currency'
import { LiquidityPosition } from 'features/LiquidityPosition'

import { Auction } from './Auction'
import { AuctionStatus } from './representations'
import { RewardToken } from './RewardToken'


export class AuctionMarket {
  public readonly live: Set<string> = new Set()
  public readonly nonFinalised: Set<string> = new Set()
  public readonly available: Record<string, RewardToken> = {}
  public readonly finalised: Set<string> = new Set()
  public readonly bidTokenAddress: string | undefined

  public constructor({
    bidTokenAddress,
    auctions,
    liquidityPositions,
    balances,
    chainId,
  }: {
    bidTokenAddress?: string
    auctions?: Auction[]
    liquidityPositions: LiquidityPosition[]
    balances: (Amount<Token> | undefined)[]
    chainId: number | undefined
  }) {
    this.bidTokenAddress = bidTokenAddress
    auctions?.forEach((auction) => {
      if (auction.status === AuctionStatus.FINISHED) {
        this.finalised.add(auction.rewardAmount.currency.address.toLowerCase())
        
      } else if (auction.status === AuctionStatus.NON_FINALIZED) {
        this.nonFinalised.add(auction.rewardAmount.currency.address.toLowerCase())
      }
      else {
        this.live.add(auction.rewardAmount.currency.address.toLowerCase())
      }
    })
    liquidityPositions
      .forEach((lp) => {
        this.addLpBalance(lp.pair.token0, lp.pair.token1, lp)
        this.addLpBalance(lp.pair.token1, lp.pair.token0, lp)
      })

    balances.forEach((balance) => {
      const address = balance?.currency.address.toLowerCase()
      if (balance && address && !this.isLive(address)) {
        if (!this.available[address]) {
          this.available[address] = new RewardToken({ token: balance.currency, tokenBalance: balance })
        } else {
          this.available[address].updateTokenBalance(balance)
        }
      }
    })
  }

  private addLpBalance(token0: Token, token1: Token, lp: LiquidityPosition) {
    if (!this.isLive(token0.address.toLowerCase()) && token0.address.toLowerCase() !== this.bidTokenAddress) {
      if (this.available[token0.address.toLowerCase()]) {
        this.available[token0.address.toLowerCase()].addLpBalance(
          lp.pair.getLiquidityValue(token0, lp.totalSupply, lp.balance) as unknown as Amount<Token>, // TODO: refactor ugly hack when Pair is extracted to monorepo
        )
        this.available[token0.address.toLowerCase()].addTokenToUnwind(token1.address.toLowerCase())
      } else {
        this.available[token0.address.toLowerCase()] = new RewardToken({
          token: token0,
          lpBalance: Amount.fromRawAmount(
            token0,
            lp.pair.getLiquidityValue(token0, lp.totalSupply, lp.balance).quotient.toString(),
          ),
        })
        this.available[token0.address.toLowerCase()].addTokenToUnwind(token1.address.toLocaleLowerCase())
      }
    }
  }

  private isLive(address: string): boolean {
    return this.live.has(address)
  }
}
