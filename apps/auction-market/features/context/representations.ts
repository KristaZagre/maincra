export interface AuctionRepresentation {
  id: string
  token: TokenRepresentation
  minTTL: string
  maxTTL: string
  status: string
  bidAmount: string
  rewardAmount: string
  leadingBid: BidRepresentation
  createdAtBlock: string
  createdAtTimestamp: string
  modifiedAtBlock: string
  modifiedAtTimestamp: string
}

export interface TokenRepresentation {
  id: string
  symbol: string
  name: string
  decimals: string
}

export interface UserRepresentation {
  id: string
}

export interface BidRepresentation {
  id: string
  amount: string
  user: UserRepresentation
  createdAtBlock: string
  createdAtTimestamp: string
}

export enum AuctionStatus {
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
}
