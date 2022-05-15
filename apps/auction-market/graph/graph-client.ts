import { ChainId } from '@sushiswap/chain'
import { AUCTION_MAKER_ADDRESSES } from 'config/network'

import { getBuiltGraphSDK } from '.graphclient'

const SUPPORTED_CHAINS = [ChainId.KOVAN]

const isNetworkSupported = (chainId: number) => SUPPORTED_CHAINS.includes(chainId)

export const getLiquidityPositions = async (chainId: string) => {
  const network = Number(chainId)
  // console.log({network})
  // if (!isNetworkSupported(network)) return {}
  const sdk = await getBuiltGraphSDK()
  // if (network === ChainId.KOVAN) {
  return (
    (await (await sdk.LiquidityPositions({ id: AUCTION_MAKER_ADDRESSES[ChainId.KOVAN] })).KOVAN_EXCHANGE_user)?.liquidityPositions)
  // }
}
