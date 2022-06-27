import { ChainId } from '@sushiswap/chain'

import { getBuiltGraphSDK } from '../../.graphclient'
import {
  GRAPH_HOST,
  LEGACY_SUBGRAPH_NAME,
  LEGACY_SUPPORTED_CHAINS,
  TRIDENT_SUBGRAPH_NAME,
  TRIDENT_SUPPORTED_CHAINS,
} from '../config'

export const getLegacyPools = async (chainId: ChainId) => {
  if (!LEGACY_SUPPORTED_CHAINS.includes(chainId)) {
    throw Error(`Unsupported Chain ${chainId}`)
  }
  const sdk = await getBuiltGraphSDK({ chainId, host: GRAPH_HOST, name: LEGACY_SUBGRAPH_NAME[chainId] })
  return { chainId, type: 'LEGACY', data: await sdk.LegacyPools() }
}

export const getTridentPools = async (chainId: ChainId) => {
  if (!TRIDENT_SUPPORTED_CHAINS.includes(chainId)) {
    throw Error(`Unsupported Chain ${chainId}`)
  }
  const sdk = await getBuiltGraphSDK({ chainId, host: GRAPH_HOST, name: TRIDENT_SUBGRAPH_NAME[chainId] })
  return { chainId, type: 'TRIDENT', data: await sdk.TridentPools() }
}
