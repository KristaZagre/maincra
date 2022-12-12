import { otherChains } from '@sushiswap/wagmi-config'
import { Address, useContract, useProvider } from 'wagmi'
import * as allChains from '@wagmi/core/chains'

import { multicall3Abi } from '../abis'

const chains = [...Object.values(allChains), ...otherChains]

export const getMulticall3ContractConfig = (chainId: number | undefined) => ({
  address: (chains.find((chain) => chain.id === chainId)?.contracts?.multicall3?.address || '') as Address,
  abi: multicall3Abi,
})

export function useMulticall3Contract(chainId: number): ReturnType<typeof useContract> {
  return useContract({
    ...getMulticall3ContractConfig(chainId),
    signerOrProvider: useProvider({ chainId }),
  })
}
