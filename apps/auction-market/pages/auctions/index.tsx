import { ChainId } from '@sushiswap/chain'
import { Token } from '@sushiswap/currency'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { Auction } from 'features/context/Auction'
import { AuctionRepresentation, PairRepresentation, TokenRepresentation } from 'features/context/representations'
// import { toTokens } from 'features/LPTransformer'
import { getPairs } from 'graph/graph-client'
import { useTokenBalancesWithLoadingIndicator } from 'hooks/Tokens'
import { useTokensFromLP } from 'hooks/useTokensFromLP'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'

interface Props {
  auctionRepresentations?: AuctionRepresentation[]
  pairRepresentations?: PairRepresentation[]
  tokenRepresentations?: TokenRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  const sdk = getBuiltGraphSDK()
  const auctionRepresentations = (await (await sdk.Auctions()).auctions) as AuctionRepresentation[]
  const pairRepresentations = (await getPairs(query.chainId)) as PairRepresentation[]
  const tokenRepresentations = (await (await sdk.Tokens()).tokens) as TokenRepresentation[]
  return {
    props: {
      auctionRepresentations,
      pairRepresentations,
      tokenRepresentations,
    },
  }
}

const AuctionMarket: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  auctionRepresentations,
  pairRepresentations,
  tokenRepresentations,
}) => {
  const [auctions, tokens] = useMemo(
    () => [
      auctionRepresentations?.map((auction) => new Auction({ auction })),
      tokenRepresentations?.map(
        (token) => new Token({ chainId: 4, address: token.id, decimals: Number(token.decimals), name: token.name, symbol: token.symbol }),),
    ],
    [auctionRepresentations, tokenRepresentations],
  )

  const [balances, balanceLoading] = useTokenBalancesWithLoadingIndicator(AUCTION_MAKER_ADDRESSES[42], tokens)


  const [tokenList, loading] = useTokensFromLP(
    ChainId.KOVAN,
    AUCTION_MAKER_ADDRESSES[ChainId.KOVAN],
    pairRepresentations,
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
        <h1>Balance</h1>
        {/* <div>{tokenRepresentations?.length}</div> */}
        <div>
          {!balanceLoading ? Object.values(balances)?.filter(token => token?.greaterThan(0)).map((token) => (
                  <div key={token?.currency.address}>
                    {token?.currency.symbol} {token?.toExact()}
                  </div>
                ))
            : 'Loading..'}
        </div>
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
