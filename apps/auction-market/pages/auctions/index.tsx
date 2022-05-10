import { ChainId } from '@sushiswap/chain'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { Auction } from 'features/context/Auction'
import { AuctionRepresentation, PairRepresentation } from 'features/context/representations'
// import { toTokens } from 'features/LPTransformer'
import { getPairs } from 'graph/graph-client'
import { useTokenBalancesWithLoadingIndicator } from 'hooks/Tokens'
import { useTokensFromLP } from 'hooks/useLpToken'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'

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
  const auctions = useMemo(
    () => auctionRepresentations?.map((auction) => new Auction({ auction })),
    [auctionRepresentations],
  )

  const [tokenList, loading] = useTokensFromLP(
    ChainId.KOVAN,
    AUCTION_MAKER_ADDRESSES[ChainId.KOVAN],
    pairsRepresentation,
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
        <div>
          {!loading ? tokenList?.map((token) => (
                  <div key={token?.currency.address}>
                    {token?.currency.symbol} {token?.toExact()}
                  </div>
                ))
            : 'Loading..'}
        </div>
      </div>
    </Layout>
  )
}

export default AuctionMarket
