import { Card } from '@sushiswap/ui'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import React, { FC, useMemo, useState } from 'react'

import { LiquidityDepthWidget } from './LiquidityDepthWidget'
import { PoolChartGraph } from './PoolChartGraph'
import { PoolChartPeriod, PoolChartPeriods } from './PoolChartPeriods'
import { PoolChartType, PoolChartTypes } from './PoolChartTypes'
import { ExtendedPool } from 'lib/hooks/api/useFlairPoolGraphData'

const statisticsChart = [PoolChartType.Volume, PoolChartType.TVL, PoolChartType.Fees, PoolChartType.Depth]

interface Charts {
  pool: ExtendedPool
  address: string
  chainId: SushiSwapV3ChainId
}

export const StatisticsCharts: FC<Charts> = ({ pool, address, chainId }) => {
  const [chart, setChart] = useState<PoolChartType>(statisticsChart[0])
  const [period, setPeriod] = useState<PoolChartPeriod>(PoolChartPeriod.Month)

  const periods = useMemo(() => {
    if (chart === PoolChartType.Depth) return []

    return [PoolChartPeriod.Day, PoolChartPeriod.Week, PoolChartPeriod.Month, PoolChartPeriod.Year, PoolChartPeriod.All]
  }, [chart])

  return (
    <Card>
      <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 border-b border-accent md:flex-row">
        <PoolChartTypes charts={statisticsChart} selectedChart={chart} setChart={setChart} />
        <PoolChartPeriods periods={periods} selectedPeriod={period} setPeriod={setPeriod} />
      </div>
      {chart === PoolChartType.Depth ? (
        <LiquidityDepthWidget pool={pool} chainId={chainId} address={address} />
      ) : (
        <PoolChartGraph chart={chart} period={period} address={address} chainId={chainId} />
      )}
    </Card>
  )
}
