import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../.graphclient'
import Layout from '../components/Layout'
import { Auction } from 'features/context/Auction'
import { AuctionRepresentation } from 'features/context/representations'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

interface Props {
  auctionRepresentations: AuctionRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const sdk = await getBuiltGraphSDK()
  const auctionRepresentations = (await (await sdk.Auctions()).auctions) as AuctionRepresentation[]
  return {
    props: { auctionRepresentations },
  }
}

const AuctionMarket: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ auctionRepresentations }) => {
  const auctions = useMemo(
    () => auctionRepresentations.map((auction) => new Auction({ auction })),
    [auctionRepresentations],
  )
  return (
    <Layout>
      <div className="px-2 pt-16">
        <h1>Auctions</h1>

        {auctions.length ? (
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
      </div>
    </Layout>
  )
}

export default AuctionMarket
