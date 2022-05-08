import { getBuiltGraphSDK } from '.graphclient'
import { ChainId } from '@sushiswap/chain'

const SUPPORTED_CHAINS = [ChainId.KOVAN]

const isNetworkSupported = (chainId: number) => SUPPORTED_CHAINS.includes(chainId)

export const getPairs = async (chainId: string) => {
  const network = Number(chainId)
  // console.log({network})
  // if (!isNetworkSupported(network)) return {}
  const sdk = await getBuiltGraphSDK()
  // if (network === ChainId.KOVAN) {
    return (await (await sdk.Pairs()).pairs) ?? {}
  // }
}
