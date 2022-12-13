import { bentoBoxV1Abi } from '@sushiswap/abi'
import { BentoBoxChainId } from '@sushiswap/address'
import bentoBoxExports from '@sushiswap/bentobox/exports.json'
import { Contract } from 'ethers'
import { useContract, useProvider } from 'wagmi'

export const getBentoBoxContractConfig = (chainId: BentoBoxChainId | number | undefined) => {
  return {
    address:
      bentoBoxExports?.[chainId as keyof Omit<typeof bentoBoxExports, '31337'>]?.[0]?.contracts?.BentoBoxV1?.address ||
      '',
    abi: bentoBoxV1Abi,
  } as const
}

export function useBentoBoxContract(chainId: number | undefined): Contract | null {
  return useContract({
    ...getBentoBoxContractConfig(chainId),
    signerOrProvider: useProvider({ chainId }),
  })
}
