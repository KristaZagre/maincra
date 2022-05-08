import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'
import { Auction } from 'features/context/Auction'
import { AuctionRepresentation, PairRepresentation } from 'features/context/representations'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
// import { useAuctionMakerBalance } from 'hooks/useAuctionMarketContract'
import { getPairs } from 'graph/graph-client'
import { toTokens } from 'features/LPTransformer'
import { useAllTokens, useTokenBalances, useTokenBalancesWithLoadingIndicator } from 'hooks/Tokens'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { ChainId } from '@sushiswap/chain'

interface Props {
  auctionRepresentations?: AuctionRepresentation[]
  pairsRepresentation?: PairRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  const sdk = getBuiltGraphSDK()
  const auctionRepresentations = (await (await sdk.Auctions()).auctions) as AuctionRepresentation[]
  const pairsRepresentation = (await getPairs(query.chainId)) as PairRepresentation[]
  return {
    props: {
      auctionRepresentations,
      pairsRepresentation,
    },
  }
}

const AuctionMarket: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  auctionRepresentations,
  pairsRepresentation,
}) => {
  const tokens = useAllTokens()
  const [auctions, lpTokens] = useMemo(
    () => [auctionRepresentations?.map((auction) => new Auction({ auction })), toTokens(4, pairsRepresentation ?? [])],
    [auctionRepresentations, pairsRepresentation],
  )

  const [tokenWithBalances, loading] = useTokenBalancesWithLoadingIndicator(
    AUCTION_MAKER_ADDRESSES[ChainId.KOVAN],
    // Object.values(tokens),
    lpTokens,
  )

  return (
    <Layout>
      <div className="px-2 pt-16">
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
        <h1>LP Tokens</h1>
        count: {lpTokens?.length ?? 0}
        {/* {lpTokens?.length ? (
          lpTokens.map((token) => (
            <div key={token.address}>
              {token.address} {``}
              {token.symbol} {``}
              {token.name} {``}
            </div>
          ))
        ) : (
          <div>
            <i>No lp tokens found..</i>
          </div>
        )} */}
        <div>
          {!loading
            ? Object.values(tokenWithBalances)?.map((token) => (
                <div key={token?.currency.address}>
                  {/* {balance?.quotient} */}
                  {token?.currency.symbol} {token?.toExact()}
                </div>
              ))
            : 'LoAdInG. ... ....'}
        </div>
      </div>
    </Layout>
  )
}

export default AuctionMarket
