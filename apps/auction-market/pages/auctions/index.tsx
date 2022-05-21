import { ChainId } from '@sushiswap/chain'
import AvailableAssetsTable from 'features/AvailableAssetsTable'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import {
  AuctionRepresentation,
  AuctionStatus,
  LiquidityPositionRepresentation,
  TokenRepresentation
} from 'features/context/representations'
import FinishedAuctionTable from 'features/FinishedAuctionTable'
import LiveAuctionTable from 'features/LiveAuctionTable'
import { getAuctions, getExchangeTokens, getLiquidityPositions } from 'graph/graph-client'
import { useAuctionMakerBalance, useLiquidityPositionedPairs } from 'hooks/useAuctionMarketAssets'
import { useBidTokenAddress, useBidTokenBalance } from 'hooks/useBidToken'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { FC, useMemo } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { useNetwork } from 'wagmi'

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
    () =>
      activeChain?.id
        ? auctionRepresentations?.map((auction) => new Auction({ chainId: activeChain.id, auction }))
        : [],
    [auctionRepresentations, activeChain],
  )
  const [balances, loading] = useAuctionMakerBalance(ChainId.KOVAN, bidTokenAddress, tokenRepresentations)
  const liquidityPositions = useLiquidityPositionedPairs(lpRepresentations)
  const auctionMarket = useMemo(() => {
    if (!isValidatingAuctions || !isValidatingLPs || !isValidatingTokens || !activeChain?.id) {
      return new AuctionMarket({ bidTokenAddress, chainId: activeChain?.id, auctions, liquidityPositions, balances })
    }
  }, [
    auctions,
    liquidityPositions,
    balances,
    isValidatingAuctions,
    isValidatingLPs,
    isValidatingTokens,
    activeChain,
    bidTokenAddress,
  ])

  return (
    <Layout>
      <div className="flex flex-col gap-10 px-2 pt-16">
        <div className="flex flex-row gap-5">
          <div>LIVE: {auctionMarket ? auctionMarket?.live.size : 0}</div>
          <div>NOT STARTED: {auctionMarket ? Object.keys(auctionMarket.waiting).length : 0}</div>
          <div>FINALIZED: {auctionMarket ? auctionMarket?.finalised.size : 0}</div>
        </div>
        <h1>Live Auctions</h1>
        <LiveAuctionTable
          auctions={auctions?.filter((auction) => auction.status === AuctionStatus.ONGOING)}
          placeholder={'No Live Auctions'}
          loading={isValidatingAuctions}
          bidToken={bidTokenBalance}
        />
        <h1>Finished Auctions</h1>
        <FinishedAuctionTable
          auctions={auctions?.filter((auction) => auction.status === AuctionStatus.FINISHED)}
          placeholder={'No Finished Auctions'}
          loading={isValidatingAuctions}
        />

          <h1>Available Assets</h1>
          <AvailableAssetsTable
            assets={ auctionMarket?.waiting ? Object.values(auctionMarket?.waiting) : []}
            bidToken={bidTokenBalance}
            placeholder={'No Assets available'}
            loading={isValidatingAuctions || isValidatingLPs || isValidatingTokens}
          />

      </div>
    </Layout>
  )
}

export default _AuctionsPage
