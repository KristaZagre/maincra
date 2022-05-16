import { ChainId } from '@sushiswap/chain'
import { AddressMap } from '@sushiswap/core-sdk'

export const AUCTION_MAKER_ADDRESSES: AddressMap = {
  [ChainId.KOVAN]: '0xbdad049d6f60ba477fc468252ecd91bc722be6c9',
  [ChainId.GÖRLI]: '0x0000000000000000000000000000000000000000',
}

export const BID_TOKEN_ADDRESS: AddressMap = {
  [ChainId.KOVAN]: '0xb7a4f3e9097c08da09517b5ab877f7a917224ede', // USDC
  [ChainId.GÖRLI]: '0x0000000000000000000000000000000000000000',
}
