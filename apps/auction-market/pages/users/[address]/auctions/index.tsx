import { Auction } from 'features/context/Auction'
import { AuctionRepresentation } from 'features/context/representations'
import { getUserAuctions } from 'graph/graph-client'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { FC, useMemo } from 'react'

import Layout from '../../../../components/Layout'

interface Props {
  auctions?: AuctionRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string' || typeof query.address !== 'string') return { props: {} }
  return {
    props: {
      auctions: await getUserAuctions(query.address, query.chainId),
    },
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
