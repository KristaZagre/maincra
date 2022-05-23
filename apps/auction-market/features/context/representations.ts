export interface AuctionRepresentation {
  id: string
  rewardToken: TokenRepresentation
  bidToken: TokenRepresentation
  minTTL: string
  maxTTL: string
  status: string
  bidAmount: string
  rewardAmount: string
  leadingBid?: BidRepresentation
  txHash: string
  createdAtBlock: string
  createdAtTimestamp: string
  modifiedAtBlock: string
  modifiedAtTimestamp: string
  bids?: BidRepresentation[]
}

export interface TokenRepresentation {
  id: string
  name: string
  symbol: string
  decimals: string
}

export interface LiquidityPositionRepresentation {
  liquidityTokenBalance: string
  pair: PairRepresentation
}

export interface PairRepresentation {
  id: string
  totalSupply: string
  reserve0: string
  reserve1: string
  token0: TokenRepresentation
  token1: TokenRepresentation
}

export interface UserRepresentation {
  id: string
}

export interface BidRepresentation {
  id: string
  amount: string
  user: UserRepresentation
  rewardToken: TokenRepresentation
  bidToken: TokenRepresentation
  txHash: string
  createdAtBlock: string
  createdAtTimestamp: string
}

export enum AuctionStatus {
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
}
