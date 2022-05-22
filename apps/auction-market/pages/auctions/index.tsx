import { Tab } from '@headlessui/react'
import { ChainId } from '@sushiswap/chain'
import { Chip, Typography } from '@sushiswap/ui'
import AvailableAssetsTable from 'features/AvailableAssetsTable'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import {
  AuctionRepresentation,
  AuctionStatus,
  LiquidityPositionRepresentation,
  TokenRepresentation,
} from 'features/context/representations'
import FinishedAuctionTable from 'features/FinishedAuctionTable'
import LiveAuctionTable from 'features/LiveAuctionTable'
import { getAuctions, getExchangeTokens, getLiquidityPositions } from 'graph/graph-client'
import { useAuctionMakerBalance, useLiquidityPositionedPairs } from 'hooks/useAuctionMarketAssets'
import { useBidTokenAddress, useBidTokenBalance } from 'hooks/useBidToken'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { FC, Fragment, useMemo } from 'react'
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
        <Tab.Group>
          <Tab.List className="flex flex-row gap-10">
            <Tab as={Fragment}>
              {({ selected }) => (
                <div className={selected ? 'border-t-2' : ''}>
                  <div className="flex flex-row gap-2 mt-2">
                    <Typography
                      variant="h3"
                      weight={500}
                      className={selected ? 'text-slate-200' : 'text-slate-400 hover:text-white'}
                    >
                      Live Auctions
                    </Typography>
                    <Chip
                      label={auctionMarket ? auctionMarket?.live.size.toString() : '0'}
                      color="green"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </Tab>

            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={selected ? 'border-t-2' : ''}>
                  <div className="flex flex-row gap-2 mt-2 ">
                    <Typography
                      variant="h3"
                      weight={500}
                      className={selected ? 'text-slate-200' : 'text-slate-400 hover:text-white'}
                    >
                      Not started
                    </Typography>
                    <Chip
                      label={auctionMarket ? Object.keys(auctionMarket.waiting).length.toString() : '0'}
                      color="yellow"
                      className="mt-1"
                    />
                  </div>
                </button>
              )}
            </Tab>

            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={selected ? 'border-t-2' : ''}>
                  <div className="flex flex-row gap-2 mt-2">
                    <Typography
                      variant="h3"
                      weight={500}
                      className={selected ? 'text-slate-200' : 'text-slate-400 hover:text-white'}
                    >
                      Finalized
                    </Typography>
                    <Chip
                      label={auctionMarket ? auctionMarket?.finalised.size.toString() : '0'}
                      color="blue"
                      className="mt-1"
                    />
                  </div>
                </button>
              )}
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <LiveAuctionTable
                auctions={auctions?.filter((auction) => auction.status === AuctionStatus.ONGOING)}
                placeholder={'No Live Auctions'}
                loading={isValidatingAuctions}
                bidToken={bidTokenBalance}
              />
            </Tab.Panel>
            <Tab.Panel>
              <FinishedAuctionTable
                auctions={auctions?.filter((auction) => auction.status === AuctionStatus.FINISHED)}
                placeholder={'No Finished Auctions'}
                loading={isValidatingAuctions}
              />
            </Tab.Panel>
            <Tab.Panel>
              <AvailableAssetsTable
                assets={auctionMarket?.waiting ? Object.values(auctionMarket?.waiting) : []}
                bidToken={bidTokenBalance}
                placeholder={'No Assets available'}
                loading={isValidatingAuctions || isValidatingLPs || isValidatingTokens}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </Layout>
  )
}

export default _AuctionsPage
