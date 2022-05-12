import { ChainId } from '@sushiswap/chain'
import { CurrencyAmount, Pair } from '@sushiswap/core-sdk'
import { Amount, Token } from '@sushiswap/currency'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import {
  AuctionRepresentation,
  LiquidityPositionRepresentation,
  PairRepresentation,
  TokenRepresentation,
} from 'features/context/representations'
import { RewardToken } from 'features/context/RewardToken'
// import { toTokens } from 'features/LPTransformer'
import { getLiquidityPositions } from 'graph/graph-client'
import { useTokenBalancesWithLoadingIndicator } from 'hooks/Tokens'
import { useTokensFromLP } from 'hooks/useTokensFromLP'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'
import { parseUnits } from 'ethers/lib/utils'
import { useAuctionMakerBalance, useLiquidityPositionedPairs } from 'hooks/useAuctionMarketAssets'
interface Props {
  auctionRepresentations?: AuctionRepresentation[]
  lpRepresentations?: LiquidityPositionRepresentation[]
  tokenRepresentations?: TokenRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  const sdk = getBuiltGraphSDK()
  const auctionRepresentations = (await await sdk.Auctions()).KOVAN_AUCTION_tokens.reduce<AuctionRepresentation[]>(
    (acc, cur) => {
      if (cur.auctions) {
        acc.push(cur.auctions[0])
      }
      return acc
    },
    [],
  )

  const lpRepresentations = (await getLiquidityPositions(query.chainId)) as LiquidityPositionRepresentation[]
  const tokenRepresentations = (await (await sdk.Tokens()).KOVAN_EXCHANGE_tokens) as TokenRepresentation[]
  return {
    props: {
      auctionRepresentations,
      lpRepresentations,
      tokenRepresentations,
    },
  }
}

const Auctions: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  auctionRepresentations,
  lpRepresentations,
  tokenRepresentations,
}) => {
  // const router = useRou()
  const auctions = useMemo(
    () => auctionRepresentations?.map((auction) => new Auction({ auction })),
    [auctionRepresentations],
  )
  const [balances, loading] = useAuctionMakerBalance(ChainId.KOVAN, tokenRepresentations)
  const liquidityPositions = useLiquidityPositionedPairs(lpRepresentations)
  const auctionMarket = useMemo(() => new AuctionMarket({ auctions, liquidityPositions, balances}), [auctions, liquidityPositions, balances])

  return (
    <Layout>
      <div className="px-2 pt-16">
        <h1>STATUSES</h1>
        <div>
          <div>LIVE: {auctionMarket.live.size}</div>
          <div>NOT STARTED: {auctionMarket.waiting.size}</div>
          <div>FINALIZED: {auctionMarket.finalised.size}</div>
        </div>
        <h1>Auctions</h1>
        {auctions?.length ? (
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
        <h1>Balance</h1>
        {/* <div>{tokenRepresentations?.length}</div> */}
        <div>
          {/* {!balanceLoading
            ? rewardTokens.map((token) => (
                <div key={token?.token.address}>
                 {token.token.address} {token.token.symbol} - {token.status}, Balance: {token.balance?.toExact() ?? 0} Liquidity: {token.liquidity?.toExact() ?? 0} 
                </div>
              ))
            : 'Loading..'} */}
        </div>
      </div>
    </Layout>
  )
}

export default Auctions
