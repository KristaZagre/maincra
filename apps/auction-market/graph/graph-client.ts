import { ChainId } from '@sushiswap/chain'
import { AUCTION_MAKER_ADDRESSES } from 'config'
import {
  AuctionRepresentation,
  BidRepresentation,
  LiquidityPositionRepresentation,
  TokenRepresentation,
} from 'features/context/representations'

import { getBuiltGraphSDK } from '.graphclient'

const SUPPORTED_CHAINS = [ChainId.KOVAN]

const isNetworkSupported = (chainId: number) => SUPPORTED_CHAINS.includes(chainId)

export const getLiquidityPositions = async (chainId: string): Promise<LiquidityPositionRepresentation[]> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return []
  return (
    await (
      await getBuiltGraphSDK().KovanLiquidityPositions({ id: AUCTION_MAKER_ADDRESSES[network] })
    ).KOVAN_EXCHANGE_user
  )?.liquidityPositions as LiquidityPositionRepresentation[]
}

export const getAuctions = async (chainId: string): Promise<AuctionRepresentation[]> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return []
  return (await await getBuiltGraphSDK().KovanAuctions()).KOVAN_AUCTION_tokens.reduce<AuctionRepresentation[]>(
    (acc, cur) => {
      if (cur.auctions) {
        acc.push(cur.auctions[0])
      }
      return acc
    },
    [],
  )
}

export const getAuction = async (id: string, chainId: string): Promise<AuctionRepresentation | undefined> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return undefined
  return (await getBuiltGraphSDK().KovanAuction({ id }))?.KOVAN_AUCTION_auction as AuctionRepresentation
}

export const getBids = async (auctionId: string, chainId: string): Promise<BidRepresentation[] | []> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return []
  return (await getBuiltGraphSDK().KovanBids({ auctionId })).KOVAN_AUCTION_auction?.bids as BidRepresentation[]
}

export const getExchangeTokens = async (chainId: string): Promise<TokenRepresentation[]> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return []
  return (await (
    await getBuiltGraphSDK().KovanExchangeTokens()
  ).KOVAN_EXCHANGE_tokens) as TokenRepresentation[]
}

export const getUserAuctions = async (id: string, chainId: string): Promise<AuctionRepresentation[] | undefined> => {
  const network = Number(chainId)
  if (!isNetworkSupported(network)) return []
  return await (
    await getBuiltGraphSDK().KovanUserAuctions({ id })
  ).KOVAN_AUCTION_user?.auctions.reduce<AuctionRepresentation[]>((acc, cur) => {
    acc.push(cur.auction)
    return acc
  }, [])
}
