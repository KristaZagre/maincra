import { ChainId } from '@sushiswap/chain'
import BidModal from 'features/BidModal'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import {
  AuctionRepresentation,
  LiquidityPositionRepresentation,
  TokenRepresentation
} from 'features/context/representations'
import { getAuctions, getExchangeTokens, getLiquidityPositions } from 'graph/graph-client'
import { useAuctionMakerBalance, useLiquidityPositionedPairs } from 'hooks/useAuctionMarketAssets'
import { useBidTokenAddress, useBidTokenBalance } from 'hooks/useBidToken'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useMemo } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { useAccount, useNetwork } from 'wagmi'
import Layout from '../../components/Layout'


const fetcher = (params: any) =>
  fetch(params)
    .then((res) => res.json())
    .catch((e) => console.log(JSON.stringify(e)))

interface Props {
  fallback?: Record<string, any>
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  return {
    props: {
      fallback: {
        [`/api/auctions/${query.chainId}`]: await getAuctions(query.chainId),
        [`/api/liquidity-positions/${query.chainId}`]: await getLiquidityPositions(query.chainId),
        [`/api/tokens/${query.chainId}`]: await getExchangeTokens(query.chainId),
      },
    },
  }
}

const _AuctionsPage: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ fallback }) => {
  const router = useRouter()
  const chainId = Number(router.query.chainId)
  return (
    <SWRConfig value={{ fallback }}>
      <AuctionsPage chainId={chainId} />
    </SWRConfig>
  )
}
const AuctionsPage: FC<{ chainId: number }> = ({ chainId }) => {
  const { activeChain } = useNetwork()
  const address = useAccount()


  const { data: auctionRepresentations, isValidating: isValidatingAuctions } = useSWR<AuctionRepresentation[]>(
    `/auction-market/api/auctions/${chainId}`,
    fetcher,
  )
  const { data: lpRepresentations, isValidating: isValidatingLPs } = useSWR<LiquidityPositionRepresentation[]>(
    `/auction-market/api/liquidity-positions/${chainId}`,
    fetcher,
  )
  const { data: tokenRepresentations, isValidating: isValidatingTokens } = useSWR<TokenRepresentation[]>(
    `/auction-market/api/tokens/${chainId}`,
    fetcher,
  )
  const bidTokenAddress = useBidTokenAddress()
  const bidTokenBalance = useBidTokenBalance()

  const auctions = useMemo(
    () => bidTokenBalance ? auctionRepresentations?.map((auction) => new Auction({ bidToken: bidTokenBalance.currency, auction })) : [],
    [auctionRepresentations, bidTokenBalance],
  )
  const [balances, loading] = useAuctionMakerBalance(ChainId.KOVAN, bidTokenAddress, tokenRepresentations)
  const liquidityPositions = useLiquidityPositionedPairs(lpRepresentations)
  const auctionMarket = useMemo(() => {
    if (!isValidatingAuctions || !isValidatingLPs || !isValidatingTokens || !activeChain?.id) {
      return new AuctionMarket({ bidTokenAddress, chainId: activeChain?.id, auctions, liquidityPositions, balances })
    }
  }, [auctions, liquidityPositions, balances, isValidatingAuctions, isValidatingLPs, isValidatingTokens, activeChain])

  return (
    <Layout>
      <div className="flex flex-col gap-10 px-2 pt-16">
        <div className="flex flex-row gap-5">
          <div>LIVE: {auctionMarket ? auctionMarket?.live.size : 0}</div>
          <div>NOT STARTED: {auctionMarket ? Object.keys(auctionMarket.waiting).length : 0}</div>
          <div>FINALIZED: {auctionMarket ? auctionMarket?.finalised.size : 0}</div>
        </div>
        <div>
          <h1>Auctions</h1>
          {auctions?.length ? (
            auctions.map((auction) => (
              <div key={auction.id}>
                {auction.status} {``}
                {auction.amount.toExact()} {auction.amount.currency.symbol} {``}
                {auction.leadingBid.amount.toExact()} {auction.token.symbol} {``}
                {auction.remainingTime?.hours} {'H'} {auction.remainingTime?.minutes} {'M'}{' '}
                {auction.remainingTime?.seconds} {'S'}
                <Link href={`/users/${auction.leadingBid.user.id.toLowerCase()}/auctions?chainId=${chainId}`}>
                  [User Auctions]
                </Link>
                <Link href={`/auction/${auction.id}?chainId=${chainId}`}>[Auction Page]</Link>
              </div>
            ))
          ) : (
            <div>
              <i>No Auctions found..</i>
            </div>
          )}
        </div>

        {/* <AuctionWaitingTable 
        tokens={Object.values(auctionMarket.waiting)} 
        placeholder={"No assets available"} 
        loading={(isValidatingAuctions || isValidatingLPs || isValidatingTokens)} /> */}
        <div>
          <h1>Not Started</h1>
          {!isValidatingAuctions || !isValidatingLPs || !isValidatingTokens
            ? auctionMarket?.waiting
              ? Object.entries(auctionMarket.waiting).map(([address, token]) => (
                  <>
                    <div key={address} className="flex flex-row justify-between text-center">
                      <div>{token?.symbol}</div>
                      <div>{token.getTotalBalance()}</div>
                    <BidModal bidToken={bidTokenBalance} rewardToken={token} />
                    </div>
                  </>
                ))
              : 'No tokens available'
            : 'Loading..'}
        </div>
      </div>
    </Layout>
  )
}

export default _AuctionsPage
