'use client'

import { Card } from '@sushiswap/ui'
import React, { FC, useState } from 'react'

import { ID } from 'sushi/types'
import { PoolChartGraph } from './PoolChartGraph'
import { PoolChartPeriod, PoolChartPeriods } from './PoolChartPeriods'
import { PoolChartType, PoolChartTypes } from './PoolChartTypes'

const charts = [
  PoolChartType.Volume,
  PoolChartType.TVL,
  PoolChartType.Fees,
  PoolChartType.APR,
] as const
const periods = [
  PoolChartPeriod.Day,
  PoolChartPeriod.Week,
  PoolChartPeriod.Month,
  PoolChartPeriod.Year,
  PoolChartPeriod.All,
]

interface PoolChartV2Props {
  id: ID
}

const PoolChartV2: FC<PoolChartV2Props> = ({ id }) => {
  const [chart, setChart] = useState<typeof charts[number]>(charts[0])
  const [period, setPeriod] = useState<PoolChartPeriod>(PoolChartPeriod.Month)

  return (
    <Card>
      <div className="border-b border-accent px-6 py-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <PoolChartTypes
          charts={charts}
          selectedChart={chart}
          setChart={setChart}
        />
        <PoolChartPeriods
          periods={periods}
          selectedPeriod={period}
          setPeriod={setPeriod}
        />
      </div>
      <PoolChartGraph chart={chart} period={period} id={id} />
    </Card>
  )
}

export { PoolChartV2 }
