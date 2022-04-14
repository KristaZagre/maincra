import { FC } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'

interface Props {
  auction: Auction
  bids: Bid[]
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

interface Bid {
  id: string
  amount: string
  createdAtBlock: string
  createdAtTimestamp: string
}

const Auction: FC<Props> = (props) => {
  let { auction, bids } = props
  // const stream = useMemo(() => new Stream({ stream: rawStream }), [rawStream])

  return (
    <Layout>
      <div>
    <h2>Auction</h2>
        {auction ? (
          <div key={auction.id}>
            {auction.status} {``}
            {auction.bidAmount} {``} {auction.token.symbol} {``}
            {auction.rewardAmount} {``}
            {new Date(parseInt(auction.minTTL) * 1000).toLocaleString()} {``}
            {new Date(parseInt(auction.maxTTL) * 1000).toLocaleString()} {``}
          </div>
        ) : (
          'No auction found'
        )}
       
        
      </div>
      <div>
          <h2>Bids</h2>
        {bids.length ? (
          Object.values(bids).map((bid) => (
            <div key={bid.id}>
              {bid.amount} {``}
              {bid.createdAtBlock} {``} 
              {bid.createdAtTimestamp} {``}
            </div>
          ))
        ) : (
          <div>
            <i>No bids found..</i>
          </div>
        )} 
        </div>
    </Layout>
  )
}

export default Auction

export async function getServerSideProps({ query }) {
  const sdk = await getBuiltGraphSDK()
  const auction = (await sdk.Auction({ id: query.id })).auction
  const bids = (await sdk.Bids({ auctionId: query.id })).auction.bids
  return {
    props: {
      auction,
      bids,
    },
  }
}
