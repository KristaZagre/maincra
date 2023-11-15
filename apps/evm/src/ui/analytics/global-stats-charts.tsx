'use client'

import { FC, useMemo } from 'react'

import {
  AnalyticBucket,
  AnalyticsBucketGranularity,
} from '@sushiswap/rockset-client'
import { useAnalyticBuckets } from 'src/lib/flair/hooks/analytics/buckets/buckets'
import { SUPPORTED_CHAIN_IDS } from '../../config'
import { TVLChart } from './tvl-chart'
import { VolumeChart } from './volume-chart'

export const GlobalStatsCharts: FC = () => {
  const { data, isLoading } = useAnalyticBuckets({
    granularity: AnalyticsBucketGranularity.DAY,
    chainIds: SUPPORTED_CHAIN_IDS,
  })
  const transformedData = useMemo(
    () => (!isLoading && data !== undefined ? convertData(data) : []),
    [isLoading, data],
  )

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TVLChart x={transformedData?.[0]?.[0]} y={transformedData?.[0]?.[1]} />
      <VolumeChart
        x={transformedData?.[1]?.[0]}
        y={transformedData?.[1]?.[1]}
      />
    </section>
  )
}

// temporarily transforming data, should rewrite TVL/Volume charts to accept the data as is
function convertData(inputData: AnalyticBucket[]): number[][][] {
  const timestamps: number[] = []
  const liquidityValues: number[] = []
  const volumeValues: number[] = []

  for (let i = 0; i < inputData.length; i++) {
    timestamps.push(inputData[i].timestamp)
    if (inputData[i].liquidityUSD !== null) {
      liquidityValues.push(inputData[i].liquidityUSD as number)
    }
    if (inputData[i].volumeUSD !== null) {
      volumeValues.push(inputData[i].volumeUSD as number)
    }
  }

  return [
    [timestamps, liquidityValues],
    [timestamps, volumeValues],
  ]
}
