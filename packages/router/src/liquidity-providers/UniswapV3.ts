import { ChainId } from '@sushiswap/chain'
import { PublicClient } from 'viem'

import { LiquidityProviders } from './LiquidityProvider'
import { UniswapV3BaseProvider } from './UniswapV3Base'

export class UniswapV3Provider extends UniswapV3BaseProvider {
  constructor(chainId: ChainId, client: PublicClient) {
    const factory = {
      [ChainId.ETHEREUM]: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
      [ChainId.POLYGON]: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
      [ChainId.ARBITRUM]: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
      [ChainId.OPTIMISM]: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    } as const
    const stateMultiCall = {
      [ChainId.ETHEREUM]: '0x9c764d2e92da68e4cdfd784b902283a095ff8b63',
      [ChainId.POLYGON]: '0x6dc993fe1e945a640576b4dca81281d8e998df71',
      [ChainId.ARBITRUM]: '0xabb58098a7b5172a9b0b38a1925a522dbf0b4fc3',
      [ChainId.OPTIMISM]: '0x4ff0dec5f9a763aa1e5c2a962aa6f4edfee4f9ea',
    } as const

    super(chainId, client, factory, stateMultiCall)
  }
  getType(): LiquidityProviders {
    return LiquidityProviders.UniswapV3
  }
  getPoolProviderName(): string {
    return 'UniswapV3'
  }
}
