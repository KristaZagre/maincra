import { otherChains } from '@sushiswap/wagmi-config'
import { allChains, configureChains, createClient } from '@wagmi/core'
import { alchemyProvider } from '@wagmi/core/providers/alchemy'
import { publicProvider } from '@wagmi/core/providers/public'

const alchemyId = process.env.ALCHEMY_ID || process.env.NEXT_PUBLIC_ALCHEMY_ID

if (!alchemyId) {
  throw Error('NO ALCHEMY ID SET')
} else {
  console.log(`Using Alchemy ID: ${alchemyId}`)
}

const { provider } = configureChains(
  [...allChains, ...otherChains],
  [publicProvider(), alchemyProvider({ apiKey: alchemyId })]
)
createClient({
  autoConnect: true,
  provider,
})
