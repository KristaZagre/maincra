'use client'

import { SkeletonBox } from '@sushiswap/ui/components/skeleton'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import React, { FC, useMemo } from 'react'
import { Bound } from 'src/lib/constants'

import { ExtendedPool } from 'lib/hooks/api/useFlairPoolGraphData'
import { useConcentratedDerivedMintInfo } from './ConcentratedLiquidityProvider'
import LiquidityChartRangeInput from './LiquidityChartRangeInput'
import { useDensityChartData } from './LiquidityChartRangeInput/hooks'

interface LiquidityDepthWidget {
  pool: ExtendedPool
  address: string
  chainId: SushiSwapV3ChainId
}

// ID has to be set (and unique) if there are multiple charts on the same page
export const LiquidityDepthWidget: FC<LiquidityDepthWidget> = ({
  pool,
  chainId,
}) => {
  // const { data: poolStats } = useConcentratedLiquidityPoolStats({ chainId, address })

  const { price, invertPrice, noLiquidity } = useConcentratedDerivedMintInfo({
    account: undefined,
    chainId,
    token0: pool.token0,
    token1: pool.token1,
    baseToken: pool.token0,
    feeAmount: pool.swapFee * 1000000,
    existingPosition: undefined,
  })

  const { isLoading, data } = useDensityChartData({
    chainId,
    token0: pool.token0,
    token1: pool.token1,
    feeAmount: pool.swapFee * 1000000,
  })

  const current = useMemo(() => {
    if (!price) return null

    return parseFloat((invertPrice ? price.invert() : price)?.toSignificant(8))
  }, [invertPrice, price])

  return (
    <>
      {isLoading && <SkeletonBox className="w-full h-full" />}
      {!noLiquidity && !isLoading && data && current && pool && (
        <LiquidityChartRangeInput
          chainId={chainId}
          currencyA={pool.token0}
          currencyB={pool.token1}
          feeAmount={pool.swapFee * 1000000}
          ticksAtLimit={{ [Bound.LOWER]: false, [Bound.UPPER]: false }}
          price={
            price
              ? parseFloat(
                  (invertPrice ? price.invert() : price).toSignificant(8),
                )
              : undefined
          }
          priceLower={undefined}
          priceUpper={undefined}
          interactive={false}
          hideBrushes={true}
          onLeftRangeInput={() => {}}
          onRightRangeInput={() => {}}
        />
      )}
    </>
  )
}
