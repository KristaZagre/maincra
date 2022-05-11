import { ChainId } from '@sushiswap/chain'
import { Amount, Token } from '@sushiswap/currency'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'
import { Auction } from 'features/context/Auction'
import { AuctionMarket } from 'features/context/AuctionMarket'
import { AuctionRepresentation, PairRepresentation, TokenRepresentation } from 'features/context/representations'
import { RewardToken } from 'features/context/RewardToken'
// import { toTokens } from 'features/LPTransformer'
import { getPairs } from 'graph/graph-client'
import { useTokenBalancesWithLoadingIndicator } from 'hooks/Tokens'
import { useTokensFromLP } from 'hooks/useTokensFromLP'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import { getBuiltGraphSDK } from '../../.graphclient'
import Layout from '../../components/Layout'

interface Props {
  auctionRepresentations?: AuctionRepresentation[]
  pairRepresentations?: PairRepresentation[]
  tokenRepresentations?: TokenRepresentation[]
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (typeof query.chainId !== 'string') return { props: {} }
  const sdk = getBuiltGraphSDK()
  const auctionRepresentations = (await (await sdk.Auctions())).KOVAN_AUCTION_tokens
    .reduce<AuctionRepresentation[]>((acc, cur) => {
    if (cur.auctions) {
    acc.push(cur.auctions[0])
    }
    return acc
  }, []) 
  
  const pairRepresentations = (await getPairs(query.chainId)) as PairRepresentation[]
  const tokenRepresentations = (await (await sdk.Tokens()).KOVAN_EXCHANGE_tokens) as TokenRepresentation[]
  return {
    props: {
      auctionRepresentations,
      pairRepresentations,
      tokenRepresentations,
    },
  }
}

const Auctions: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  auctionRepresentations,
  pairRepresentations,
  tokenRepresentations,
}) => {
  const [auctions, tokens] = useMemo(
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
    ],
    [auctionRepresentations, tokenRepresentations],
  )

  const [lpBalances, balanceLoading] = useTokenBalancesWithLoadingIndicator(AUCTION_MAKER_ADDRESSES[42], tokens)

  const [tokenList, loading] = useTokensFromLP(
    ChainId.KOVAN,
    AUCTION_MAKER_ADDRESSES[ChainId.KOVAN],
    pairRepresentations,
  )

  const rewardTokens = useMemo(() => {
    let tokens: Record<
      string,
      { token: Token; balance: Amount<Token> | undefined; lpBalance: Amount<Token> | undefined }
    > = {}
    Object.entries(lpBalances)
      .filter(([, token]) => token?.greaterThan(0))
      .forEach(([address, amount]) => {
        if (amount?.currency) {
          tokens[address] = { token: amount?.currency, balance: undefined, lpBalance: amount }
        }
      })
    tokenList?.forEach((amount) => {
      if (tokens[amount.currency.address]) {
        tokens[amount.currency.address].balance = amount
      } else {
        tokens[amount.currency.address] = { token: amount?.currency, balance: amount, lpBalance: undefined }
      }
    })
    return Object.values(tokens).map(
      (value) =>
        new RewardToken({
          token: value.token,
          balance: value.balance,
          liquidity: value.lpBalance,
          isUsedInLiveAuction: false,
        }),
    )
  }, [lpBalances, tokenList])

  const auctionMarket = useMemo( () => new AuctionMarket({auctions, rewardTokens}), [auctions, rewardTokens])

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
          {!balanceLoading && !loading
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
