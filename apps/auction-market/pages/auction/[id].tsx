import { Auction } from 'features/context/Auction'
import { Bid } from 'features/context/Bid'
import { AuctionRepresentation, BidRepresentation } from 'features/context/representations'
import { getAuction, getBids } from 'graph/graph-client'
import { useBidToken } from 'hooks/useBidToken'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { FC, useMemo } from 'react'
import useSWR, { SWRConfig } from 'swr'

import Layout from '../../components/Layout'

const fetcher = (params: any) =>
  fetch(params)
    .then((res) => res.json())
    .catch((e) => console.log(JSON.stringify(e)))

interface Props {
  fallback?: Record<string, any>
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string' || typeof query.id !== 'string') return { props: {} }
  return {
    props: {
      fallback: {
        [`/api/auction/${query.chainId}/${query.id}`]: await getAuction(query.id, query.chainId),
        [`/api/bids/${query.chainId}/${query.id}`]: await getBids(query.id, query.chainId),
      },
    },
  }
}

const _AuctionPage: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ fallback }) => {
  const router = useRouter()
  const chainId = Number(router.query.chainId)
  const id = router.query.id as string

  return (
    <SWRConfig value={{ fallback }}>
      <AuctionPage chainId={chainId} id={id} />
    </SWRConfig>
  )
}

const AuctionPage: FC<{ chainId: number; id: string }> = ({ chainId, id }) => {
  const { data: auctionRepresentation, isValidating: isValidatingAuction } = useSWR<AuctionRepresentation>(
    `/auction-market/api/auction/${chainId}/${id}`,
    fetcher,
  )
  const { data: bidRepresentations, isValidating: isValidatingBids } = useSWR<BidRepresentation[]>(
    `/auction-market/api/bids/${chainId}/${id}`,
    fetcher,
  )
  const bidToken = useBidToken()

  const auction = useMemo(
    () =>
      auctionRepresentation && bidToken
        ? new Auction({ bidToken, auction: auctionRepresentation })
        : undefined,
    [auctionRepresentation, bidToken],
  )
  const bids = useMemo(() => bidRepresentations?.map((bid) => new Bid({ bid })), [bidRepresentations])

  return (
    <Layout>
      <div>
        <h2>Auction</h2>
        {auction ? (
          <div key={auction.id}>
            {auction.status} {``}
            {auction.amount.toExact()} {auction.amount.currency.symbol}{``}
            {auction.leadingBid.amount.toExact()} {auction.leadingBid.amount.currency.symbol}{``}
            {auction.startDate.toLocaleDateString()} {``}
            {auction.endDate?.toLocaleDateString()} {``}
          </div>
        ) : (
          'No auction found'
        )}
      </div>
      <div>
        <h2>Bids</h2>
        {bids?.length ? (
          bids.map((bid) => <div key={bid.id}>{`${bid.amount.toExact()} ${bid.timestamp} ${bid.user?.id}`}</div>)
        ) : (
          <div>
            <i>No bids found..</i>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default _AuctionPage
