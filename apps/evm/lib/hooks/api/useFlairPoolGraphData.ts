'use client'

import { ChainId } from '@sushiswap/chain'
import { PoolBucket } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'

interface UsePoolGraphDataParams {
  poolAddress: string
  chainId: ChainId
  enabled?: boolean
}


export const usePoolGraphData = ({ poolAddress, chainId, enabled = true }: UsePoolGraphDataParams) => {

  return useQuery({
    queryKey: ['useFlairPoolGraphData', { poolAddress, chainId }],
    queryFn: 
    async () => fetch(`/pool/api/v1/pools/${chainId}/${poolAddress}/buckets`).then((data) => data.json()) as Promise<PoolBucket[]>,
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 86400000, // 24hs
    enabled: Boolean(poolAddress && chainId && enabled),
  })
}
