import { allChains } from '@sushiswap/wagmi-config/chains'
import { configureChains, createConfig } from '@wagmi/core'
// import { alchemyProvider } from '@wagmi/core/providers/alchemy'
import { publicProvider } from '@wagmi/core/providers/public'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'
import { ChainId } from '@sushiswap/chain'

// const alchemyId = process.env['ALCHEMY_ID'] || process.env['NEXT_PUBLIC_ALCHEMY_ID']

// if (!alchemyId) {
//   throw Error('NO ALCHEMY ID SET')
// }
createConfig(
  configureChains(allChains, [
    jsonRpcProvider({
    rpc: (chain) => {
      if (chain.id === ChainId.GNOSIS) {
        return {http: 'https://rpc.ankr.com/gnosis'}
      }
    },
  }),
    publicProvider(),
  ])
)
