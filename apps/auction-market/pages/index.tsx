import { useMemo } from 'react'
import { FC } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { getBuiltGraphSDK } from '../.graphclient'
import Layout from '../components/Layout'
import { Auction } from '../features/context/Auction'
import { AuctionRepresentation } from '../features/context/representations'

interface Props {
  auctionRepresentations: AuctionRepresentation[]
}

const AuctionMarket: FC<Props> = ({ auctionRepresentations }) => {
  const auctions = useMemo(
    () => auctionRepresentations.map((auction) => new Auction({ auction })),
    [auctionRepresentations],
  )
  return (
    <Layout>
      <div className="flex flex-col h-full gap-12 pt-40">
        <h1>Auctions</h1>

        {auctions.length ? (
          auctions.map((auction) => (
            <div key={auction.id}>
              {auction.status} {``}
              {auction.amount.toString()} {` SUSHI `}
              {auction.leadingBid.amount.toString()} {auction.token?.symbol}
              {auction.startTime.toLocaleDateString()} {``}
              {auction.endTime?.toLocaleDateString()} {``}
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

export async function getServerSideProps() {
  const sdk = await getBuiltGraphSDK()
  const auctionRepresentations = await (await sdk.Auctions()).auctions
  return {
    props: { auctionRepresentations },
  }
}
