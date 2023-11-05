import { ChainId } from '../chain'

export const SWAP_API_ENABLED_NETWORKS = [
  ChainId.ARBITRUM,
  ChainId.ARBITRUM_NOVA,
  ChainId.AVALANCHE,
  ChainId.BASE,
  ChainId.BSC,
  ChainId.CELO,
  ChainId.ETHEREUM,
  ChainId.FANTOM,
  ChainId.GNOSIS,
  ChainId.OPTIMISM,
  ChainId.POLYGON,
  ChainId.POLYGON_ZKEVM,
]
export type SwapApiEnabledChainId = typeof SWAP_API_ENABLED_NETWORKS[number]
export const isSwapApiEnabledChainId = (
  chainId: number,
): chainId is SwapApiEnabledChainId =>
  SWAP_API_ENABLED_NETWORKS.includes(chainId as SwapApiEnabledChainId)
