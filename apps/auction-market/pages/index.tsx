import { FC } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { getBuiltGraphSDK } from '../.graphclient'
import Layout from '../components/Layout'

interface AuctionProps {
  auctions: Auction[]
}
interface Auction {
  id: string
  token: {
    name: string
    symbol: string
  }
  minTTL: string
  maxTTL: string
  status: string
  bidAmount: string
  rewardAmount: string
  highestBidder: {
    id: string
  }
}

const Furo: FC<AuctionProps> = ({ auctions }) => {
  return (
    <Layout>
      <div className="flex flex-col h-full gap-12 pt-40">
        <h1>Auctions</h1>
        {auctions.length ? (
          Object.values(auctions).map((auction) => (
            <div key={auction.id}>
              {auction.status} {``}
              {auction.bidAmount} {``} {auction.token.symbol} {``}
              {auction.rewardAmount} {``}
              {new Date(parseInt(auction.minTTL) * 1000).toLocaleString()} {``}
              {new Date(parseInt(auction.maxTTL) * 1000).toLocaleString()} {``}
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

export default Furo

export async function getServerSideProps() {
  const sdk = await getBuiltGraphSDK()
  const auctions = await (await sdk.Auctions()).auctions
  console.log(auctions)
  return {
    props: { auctions },
  }
}
