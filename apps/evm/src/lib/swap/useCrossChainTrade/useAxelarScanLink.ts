import { useQuery } from '@tanstack/react-query'
import { ChainId } from 'sushi/chain'
import {
  AXELAR_ADAPTER_SUPPORTED_CHAIN_IDS,
  AxelarAdapterChainId,
} from 'sushi/config'
import { axelarGMPApi } from './SushiXSwap2'

export const useAxelarScanLink = ({
  tradeId,
  network0,
  network1,
  txHash,
}: {
  tradeId: string
  network0: ChainId
  network1: ChainId
  txHash: string | undefined
}) => {
  return useQuery({
    queryKey: ['axelarScanLink', { txHash, network0, network1, tradeId }],
    queryFn: async () => {
      if (
        txHash &&
        AXELAR_ADAPTER_SUPPORTED_CHAIN_IDS.includes(
          network0 as AxelarAdapterChainId,
        ) &&
        AXELAR_ADAPTER_SUPPORTED_CHAIN_IDS.includes(
          network1 as AxelarAdapterChainId,
        )
      ) {
        return axelarGMPApi.fetchGMPTransaction(txHash).then((data) => ({
          link: `https://axelarscan.io/gmp/${txHash}`,
          status: data.status,
          dstTxHash: data.executed?.transactionHash,
        }))
      }

      return {
        link: undefined,
        status: undefined,
        dstTxHash: undefined,
      }
    },
    refetchInterval: 2000,
    enabled: !!txHash,
  })
}
