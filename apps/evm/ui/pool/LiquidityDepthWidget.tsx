'use client'

import { useConcentratedLiquidityPoolStats } from '@sushiswap/react-query'
import { SkeletonBox } from '@sushiswap/ui/components/skeleton'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import React, { FC, useMemo } from 'react'

import { useConcentratedDerivedMintInfo } from './ConcentratedLiquidityProvider'
import { useDensityChartData } from './LiquidityChartRangeInput/hooks'
import { PoolDepthChart } from './PoolDepthChart'

interface LiquidityDepthWidget {
  address: string
  chainId: SushiSwapV3ChainId
}

// ID has to be set (and unique) if there are multiple charts on the same page
export const LiquidityDepthWidget: FC<LiquidityDepthWidget> = ({ address, chainId }) => {
  const { data: poolStats } = useConcentratedLiquidityPoolStats({ chainId, address })

  const { price, invertPrice, noLiquidity } = useConcentratedDerivedMintInfo({
    account: undefined,
    chainId,
    token0: poolStats?.token0,
    token1: poolStats?.token1,
    baseToken: poolStats?.token0,
    feeAmount: poolStats?.feeAmount,
    existingPosition: undefined,
  })

  const { isLoading, formattedData } = useDensityChartData({
    chainId,
    token0: poolStats?.token0,
    token1: poolStats?.token1,
    feeAmount: poolStats?.feeAmount,
  })

  const current = useMemo(() => {
    if (!price) return null

    return parseFloat((invertPrice ? price.invert() : price)?.toSignificant(8))
  }, [invertPrice, price])

  return (
    <>
      {isLoading && <SkeletonBox className="w-full h-full" />}

      {!noLiquidity && !isLoading && formattedData && current && poolStats && (
        <PoolDepthChart poolStats={poolStats} series={formattedData} current={current} />
      )}
    </>
  )
}