import { TridentChainId } from '@sushiswap/trident-sdk'
import { SushiSwapV2ChainId } from '@sushiswap/v2-sdk'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'

export type SwapChainId =
  | TridentChainId
  | SushiSwapV2ChainId
  | SushiSwapV3ChainId

import { UserPosition } from '@sushiswap/graph-client'
import { SimplePool } from '@sushiswap/rockset-client'

export interface PositionWithPool extends Omit<UserPosition, 'pool'> {
  pool: SimplePool
}
