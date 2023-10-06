import {
  AxelarGMPRecoveryAPI,
  AxelarQueryAPI,
  Environment,
} from '@axelar-network/axelarjs-sdk'
import { ChainId } from 'sushi/chain'
import { AxelarAdapterChainId } from 'sushi/config'
import { Type } from 'sushi/currency'
import {
  Address,
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  toHex,
} from 'viem'

export const axelarGMPApi = new AxelarGMPRecoveryAPI({
  environment: Environment.MAINNET,
})

export const axelarQueryApi = new AxelarQueryAPI({
  environment: Environment.MAINNET,
})

export const AXELAR_CHAIN_NAME = {
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.AVALANCHE]: 'Avalanche',
  [ChainId.BASE]: 'base',
  [ChainId.BSC]: 'binance',
  [ChainId.CELO]: 'celo',
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.FANTOM]: 'Fantom',
  [ChainId.KAVA]: 'kava',
  [ChainId.LINEA]: 'linea',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.POLYGON]: 'Polygon',
} as const

const toBytes32 = (str: string): `0x${string}` =>
  toHex(
    BigInt(toHex(str, { size: 32 })) |
      BigInt(toHex(0xff & toBytes(str).length, { size: 32 })),
  )

/*
    AxelarBridgeParams {
        address token; // token getting bridged
        bytes32 destinationChain; // destination chain name
        address destinationAddress; // destination address for _execute call
        bytes32 symbol; // bridged token symbol
        uint256 amount; // amount to bridge
        address to; // address for fallback transfers on _execute call
    }
*/

export const encodeAxelarBridgeParams = ({
  srcBridgeToken,
  dstBridgeToken,
  amount,
  receiver,
  to,
}: {
  srcBridgeToken: Type
  dstBridgeToken: Type
  amount: Parameters<typeof BigInt>[0]
  receiver: Address
  to: Address
}) => {
  if (!srcBridgeToken.symbol)
    throw new Error('symbol is undefined in srcBridgeToken')
  return encodeAbiParameters(
    parseAbiParameters('address, bytes32, address, bytes32, uint256, address'),
    [
      srcBridgeToken.isNative
        ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        : (srcBridgeToken.address as Address), // TODO: check if correct
      toBytes32(
        AXELAR_CHAIN_NAME[dstBridgeToken.chainId as AxelarAdapterChainId],
      ),
      receiver,
      toBytes32(srcBridgeToken.symbol || ''),
      BigInt(amount),
      to,
    ],
  )
}

// estimate gas in executeWithToken()
export const estimateAxelarDstGas = (gasUsed?: number) => {
  // estGas = gasUsedFromTines ? (50K + gasUsed * 1.25) : 300k
  return gasUsed ? BigInt(Math.floor(gasUsed * 1.25) + 50_000) : 300_000n
}
