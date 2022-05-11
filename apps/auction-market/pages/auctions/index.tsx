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
import { Decimal, JSBI } from '@sushiswap/math'

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
  const [auctions, tokens, lpTokens] = useMemo(
    () => [
      auctionRepresentations?.map((auction) => new Auction({ auction })),
      tokenRepresentations?.map(
        (token) =>
          new Token({
            chainId: ChainId.KOVAN,
            address: token.id,
            decimals: Number(token.decimals),
            name: token.name,
            symbol: token.symbol,
          }),
      ),
      lpRepresentations?.map((lp) => {
        const tokenA = new Token({
          chainId: ChainId.KOVAN,
          address: lp.pair.token0.id,
          decimals: Number(lp.pair.token0.decimals),
          symbol: lp.pair.token0.symbol,
          name: lp.pair.token0.name,
        })
        const tokenB = new Token({
          chainId: ChainId.KOVAN,
          address: lp.pair.token1.id,
          decimals: Number(lp.pair.token1.decimals),
          symbol: lp.pair.token1.symbol,
          name: lp.pair.token1.name,
        })
        const lpTokenValue0 =
          (Decimal(lp.liquidityTokenBalance) * Decimal(lp.pair.reserve0)) / Decimal(lp.pair.totalSupply)
        const lpValue0 = Amount.fromRawAmount(tokenA, lpTokenValue0.toExponential(Number(lp.pair.token0.decimals)))
        const lpTokenValue1 =
          (Decimal(lp.liquidityTokenBalance) * Decimal(lp.pair.reserve1)) / Decimal(lp.pair.totalSupply)
        const lpValue1 = Amount.fromRawAmount(tokenA, lpTokenValue1.toExponential(Number(lp.pair.token1.decimals)))
        // TODO: convert to raw amount, create tokens
        console.log({ lpValue0, lpValue1 })
      }),
    ],
    [auctionRepresentations, tokenRepresentations, lpRepresentations],
  )

  const [tokenBalances, balanceLoading] = useTokenBalancesWithLoadingIndicator(AUCTION_MAKER_ADDRESSES[42], tokens)

  // const [tokenList, loading] = useTokensFromLP(
  //   ChainId.KOVAN,
  //   AUCTION_MAKER_ADDRESSES[ChainId.KOVAN],
  //   pairRepresentations,
  // )

  const rewardTokens = useMemo(() => {
    let tokens: Record<
      string,
      { token: Token; balance: Amount<Token> | undefined; lpBalance: Amount<Token> | undefined }
    > = {}
    Object.entries(tokenBalances)
      .filter(([, token]) => token?.greaterThan(0))
      .forEach(([address, amount]) => {
        if (amount?.currency) {
          tokens[address] = { token: amount?.currency, balance: undefined, lpBalance: amount }
        }
      })
    // tokenList?.forEach((amount) => {
    //   if (tokens[amount.currency.address]) {
    //     tokens[amount.currency.address].balance = amount
    //   } else {
    //     tokens[amount.currency.address] = { token: amount?.currency, balance: amount, lpBalance: undefined }
    //   }
    // })
    return Object.values(tokens).map(
      (value) =>
        new RewardToken({
          token: value.token,
          balance: value.balance,
          liquidity: value.lpBalance,
          isUsedInLiveAuction: false,
        }),
    )
    // }, [lpBalances, tokenList])
  }, [tokenBalances])

  const auctionMarket = useMemo(() => new AuctionMarket({ auctions, rewardTokens }), [auctions, rewardTokens])

  return (
    <Layout>
      <div className="px-2 pt-16">
        <h1>STATUSES</h1>
        <div>
          <div>LIVE: {auctionMarket.live}</div>
          <div>NOT STARTED: {auctionMarket.notStarted}</div>
          <div>FINALIZED: {auctionMarket.finalised}</div>
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
          {!balanceLoading
            ? rewardTokens.map((token) => (
                <div key={token?.token.address}>
                  {token.status} {token.balance?.toExact()} {token.liquidity?.toExact()} {token.token.symbol}
                </div>
              ))
            : 'Loading..'}
        </div>
      </div>
    </Layout>
  )
}

export default Auctions
