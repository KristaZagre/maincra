import { CardTitle } from '@sushiswap/ui'
import React, { FC } from 'react'

import { SteerLiquidityInRangeChip } from './SteerLiquidityInRangeChip'
import { SteerTokenDistributionBar } from './SteerTokenDistributionBar'
import { Vault } from '@sushiswap/rockset-client'

interface SteerLiquidityDistributionWidgetProps {
  vault: Vault
}

export const SteerLiquidityDistributionWidget: FC<
  SteerLiquidityDistributionWidgetProps
> = ({ vault }) => {
  return (
    <>
      <div className="flex justify-between">
        <CardTitle>Liquidity Distribution</CardTitle>

        <SteerLiquidityInRangeChip vault={vault} />
      </div>
      <SteerTokenDistributionBar vault={vault} />
    </>
  )
}
