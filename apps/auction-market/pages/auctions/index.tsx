import { ChainId } from '@sushiswap/chain'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import {
  AuctionRepresentation,
  LiquidityPositionRepresentation,
  TokenRepresentation,
} from 'features/context/representations'
import { getLiquidityPositions } from 'graph/graph-client'
import { useAuctionMakerBalance, useLiquidityPositionedPairs } from 'hooks/useAuctionMarketAssets'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { FC, useMemo } from 'react'

import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'
interface Props {
  auctionRepresentations?: AuctionRepresentation[]
  lpRepresentations?: LiquidityPositionRepresentation[]
  tokenRepresentations?: TokenRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  const sdk = getBuiltGraphSDK()
  const auctionRepresentations = (await await sdk.Auctions()).KOVAN_AUCTION_tokens.reduce<AuctionRepresentation[]>(
    (acc, cur) => {
      if (cur.auctions) {
        acc.push(cur.auctions[0])
      }
      return acc
    },
    [],
  )
  const lpRepresentations = (await getLiquidityPositions(query.chainId)) as LiquidityPositionRepresentation[]
  const tokenRepresentations = (await (await sdk.Tokens()).KOVAN_EXCHANGE_tokens) as TokenRepresentation[]
  return {
    props: {
      auctionRepresentations,
      lpRepresentations,
      tokenRepresentations,
    },
  }
}

const Auctions: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  auctionRepresentations,
  lpRepresentations,
  tokenRepresentations,
}) => {
  const auctions = useMemo(
    () => auctionRepresentations?.map((auction) => new Auction({ auction })),
    [auctionRepresentations],
  )
  const [balances, loading] = useAuctionMakerBalance(ChainId.KOVAN, tokenRepresentations)
  const liquidityPositions = useLiquidityPositionedPairs(lpRepresentations)
  const auctionMarket = useMemo(
    () => new AuctionMarket({ auctions, liquidityPositions, balances }),
    [auctions, liquidityPositions, balances],
  )

  return (
    <Layout>
      <div className="px-2 pt-16">
        <h1>STATUSES</h1>
        <div>
          <div>LIVE: {auctionMarket.live.size}</div>
          <div>NOT STARTED: {Object.keys(auctionMarket.waiting).length}</div>
          <div>FINALIZED: {auctionMarket.finalised.size}</div>
        </div>
        <h1>Auctions</h1>
        {auctions?.length ? (
          auctions.map((auction) => (
            <div key={auction.id}>
              {auction.status} {``}
              {auction.amount.toString()} {` SUSHI `}
              {auction.leadingBid.amount.toString()} {auction.token.symbol} {``}
              {auction.remainingTime?.hours} {'H'} {auction.remainingTime?.minutes} {'M'}{' '}
              {auction.remainingTime?.seconds} {'S'}
              <Link href={`/users/${auction.leadingBid.user.id.toLowerCase()}/auctions/`}>[User Auctions]</Link>
              <Link href={`/auction/${auction.id}`}>[Auction Page]</Link>
            </div>
          ))
        ) : (
          <div>
            <i>No Auctions found..</i>
          </div>
        )}
        <h1>AVAILABLE FOR START:</h1>
        <div>
          {Object.entries(auctionMarket.waiting).map(([address, token]) => (
            <div key={address}>
              {token?.currency.symbol}, Balance: {token.toExact()}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Auctions
