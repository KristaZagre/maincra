/* eslint-disable @typescript-eslint/no-empty-function */
import type { ChainId } from '../../chain'
import { Native, WNATIVE, WNATIVE_ADDRESS } from '../../currency'
import { BridgeUnlimited, RToken } from '@sushiswap/tines'
import { PublicClient } from 'viem'
import { type PoolCode, NativeWrapBridgePoolCode } from '../pool-code'
import { LiquidityProvider, LiquidityProviders } from './liquidity-provider'

export class NativeWrapProvider extends LiquidityProvider {
  poolCodes: PoolCode[]

  constructor(chainId: ChainId, client: PublicClient) {
    super(chainId, client)
    const native = Native.onChain(chainId)
    const nativeRToken: RToken = {
      address: '',
      name: native.name,
      symbol: native.symbol,
      chainId: chainId,
      decimals: 18,
    }
    const bridge = new BridgeUnlimited(
      WNATIVE_ADDRESS[chainId],
      nativeRToken,
      WNATIVE[chainId] as RToken,
      0,
      50_000,
    )
    this.poolCodes = [
      new NativeWrapBridgePoolCode(bridge, LiquidityProviders.NativeWrap),
    ]
    this.lastUpdateBlock = -1
  }

  getType(): LiquidityProviders {
    return LiquidityProviders.NativeWrap
  }

  getPoolProviderName(): string {
    return 'NativeWrap'
  }

  startFetchPoolsData() {}
  async fetchPoolsForToken(): Promise<void> {}
  getCurrentPoolList(): PoolCode[] {
    return this.poolCodes
  }
  stopFetchPoolsData() {}
}
