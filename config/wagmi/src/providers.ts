import { ChainId } from '@sushiswap/chain'
import type { ChainProviderFn } from '@wagmi/core'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'
import { publicProvider } from '@wagmi/core/providers/public'

export const allProviders: ChainProviderFn[] = [
  // jsonRpcProvider({
  //   priority: 0,
  //   rpc: (chain) => {
  //     if (chain.id !== 1) return null
  //     return {
  //       http: `https://api.securerpc.com/v1`,
  //       webSocket: `wss://api.securerpc.com/v1`,
  //     }
  //   },
  // }),
  // alchemyProvider({ apiKey: alchemyId, priority: 1 }),
  // publicProvider({ priority: 2 }),

  // jsonRpcProvider({
  //   priority: 0,
  //   rpc: (chain) => {
  //     if (chain.id !== 1) return null
  //     return {
  //       http: `https://api.securerpc.com/v1`,
  //       webSocket: `wss://api.securerpc.com/v1`,
  //     }
  //   },
  // }),
  jsonRpcProvider({
    rpc: (chain) => {
      if (chain.id === ChainId.GNOSIS) {
        return { http: 'https://rpc.ankr.com/gnosis' }
      }
    },
  }),
  publicProvider(),

  // infuraProvider({ infuraId }),
]
