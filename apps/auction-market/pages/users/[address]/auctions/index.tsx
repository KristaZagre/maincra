import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../../../.graphclient'
import Layout from '../../../../components/Layout'
import { Auction } from 'features/context/Auction'
import { AuctionRepresentation } from 'features/context/representations'

interface Props {
  auctions?: AuctionRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.address !== 'string') return { props: {} }
  const sdk = await getBuiltGraphSDK()
  const auctions = (await sdk.UserAuctions({ id: query.address })).user?.auctions.reduce<AuctionRepresentation[]>((acc, cur) => {
    acc.push(cur.auction)
    return acc
  }, [])
  return {
    props: auctions,
  }
}

const Auctions: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ auctions }) => {
  const userAuctions = useMemo(() => auctions?.map((auction) => new Auction({ auction })), [auctions])
  return (
    <Layout>
      <h1>Auctions</h1>

      {userAuctions?.length ? (
        userAuctions.map((auction) => (
          <div key={auction.id}>
            {auction.startDate.toISOString().substring(0, 10)} {``}
            {auction.token.name} {``}
            {auction.amount.toString()} {auction.token.symbol} {``}
            {auction.bids[0].amount.toString()} {auction.token.symbol} {``}
            {auction.leadingBid.amount.toString()} {auction.token.symbol} {``}
            {auction.remainingTime?.hours} {'H'} {auction.remainingTime?.minutes} {'M'} {auction.remainingTime?.seconds}{' '}
            {'S'}
          </div>
        ))
      ) : (
        <div>
          <i>No Auctions found..</i>
        </div>
      )}
    </Layout>
  )
}

export default Auctions
