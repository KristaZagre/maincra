'use client'

import { ChainId } from '@sushiswap/chain'
import { formatPercent, formatUSD } from '@sushiswap/format'
import { CardContent, CardHeader, classNames, SkeletonText } from '@sushiswap/ui'
import { CardDescription, CardTitle } from '@sushiswap/ui/components/card'
import { SkeletonBox } from '@sushiswap/ui/components/skeleton'
import { format } from 'date-fns'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import { usePoolGraphData } from 'lib/hooks/api/useFlairPoolGraphData'
import { useTheme } from 'next-themes'
import { FC, useCallback, useMemo } from 'react'
import tailwindConfig from 'tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'

import { chartPeriods, PoolChartPeriod } from './PoolChartPeriods'
import { PoolChartType } from './PoolChartTypes'

interface PoolChartProps {
  chart: PoolChartType.Volume | PoolChartType.Fees | PoolChartType.TVL | PoolChartType.APR
  period: PoolChartPeriod
  address: string
  chainId: ChainId
}

const tailwind = resolveConfig(tailwindConfig)

export const PoolChartGraph: FC<PoolChartProps> = ({ chart, period, address, chainId }) => {
  const { resolvedTheme } = useTheme()

  const { data: hourBuckets, isLoading: isLoadingHourly } = usePoolGraphData({
    poolAddress: address,
    chainId,
    granularity: 'hour'
  })
  
  const { data: dailyBuckets, isLoading: isLoadingDaily } = usePoolGraphData({
    poolAddress: address,
    chainId,
    granularity: 'day'
  })

  const isLoading = useMemo(() => isLoadingHourly || isLoadingDaily, [isLoadingHourly, isLoadingDaily])

  const [xData, yData]: [number[], number[]] = useMemo(() => {
    const data = (chartPeriods[period] < chartPeriods[PoolChartPeriod.Week] ? hourBuckets : dailyBuckets) || []

    const currentDate = Math.round(Date.now())
    const [x, y] = data.reduce<[number[], number[]]>(
      (acc, cur) => {
        if (cur.timestamp * 1000 >= currentDate - chartPeriods[period]) {
          acc[0].push(cur.timestamp)
          if (chart === PoolChartType.Fees) {
            acc[1].push(Number(cur.feeUsd))
          } else if (chart === PoolChartType.Volume) {
            acc[1].push(Number(cur.volumeUsd))
          } else if (chart === PoolChartType.TVL) {
            acc[1].push(Number(cur.liquidityUsd))
          } else if (chart === PoolChartType.APR) {
            acc[1].push(Number(cur.feeApr))
          }
        }
        return acc
      },
      [[], []]
    )

    return [x.reverse(), y.reverse()]
  }, [chart, period, hourBuckets, dailyBuckets])

  // Transient update for performance
  const onMouseOver = useCallback(
    ({ name, value }: { name: number; value: number }) => {
      const valueNodes = document.getElementsByClassName('hoveredItemValue')
      const nameNodes = document.getElementsByClassName('hoveredItemName')

      if (valueNodes[0]) {
        if (chart === PoolChartType.APR) {
          valueNodes[0].innerHTML = formatPercent(value)
        } else {
          valueNodes[0].innerHTML = formatUSD(value)
        }
      }

      if (valueNodes[1]) {
        if (chart === PoolChartType.Fees) {
          valueNodes[1].innerHTML = formatUSD(value)
        }
      }

      if (nameNodes[0]) {
        nameNodes[0].innerHTML = format(
          new Date(name * 1000),
          `dd MMM yyyy${chartPeriods[period] < chartPeriods[PoolChartPeriod.Week] ? ' p' : ''}`
        )
      }
    },
    [period, chart]
  )

  const DEFAULT_OPTION: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        extraCssText: 'z-index: 1000; padding: 0 !important; box-shadow: none !important',
        responsive: true,
        // @ts-ignore
        backgroundColor: 'transparent',
        textStyle: {
          fontSize: 12,
          fontWeight: 600,
        },
        formatter: (params: any) => {
          onMouseOver({ name: params[0].name, value: params[0].value })

          const date = new Date(Number(params[0].name * 1000))
          return `<div class="flex flex-col gap-0.5 paper bg-white/50 dark:bg-slate-800/50 px-3 py-2 rounded-xl overflow-hidden shadow-lg">
            <span class="text-sm dark:text-slate-50 text-gray-900 font-medium">${
              chart === PoolChartType.APR ? formatPercent(params[0].value) : formatUSD(params[0].value)
            }</span>
            <span class="text-xs text-gray-500 dark:text-slate-400 font-medium">${
              date instanceof Date && !isNaN(date?.getTime())
                ? format(date, `dd MMM yyyy${chartPeriods[period] < chartPeriods[PoolChartPeriod.Week] ? ' p' : ''}`)
                : ''
            }</span>
          </div>`
        },
        borderWidth: 0,
      },
      toolbox: {
        show: false,
      },
      grid: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      dataZoom: {
        show: false,
        start: 0,
        end: 100,
      },
      visualMap: {
        show: false,
        // @ts-ignore
        color: [tailwind.theme.colors.blue['500']],
      },
      xAxis: [
        {
          show: false,
          type: 'category',
          data: xData,
        },
      ],
      yAxis: [
        {
          show: false,
          type: 'value',
          name: 'Volume',
        },
      ],
      series: [
        {
          name: 'Volume',
          type: chart === PoolChartType.TVL || chart === PoolChartType.APR ? 'line' : 'bar',
          smooth: true,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: 'blue',
            normal: {
              barBorderRadius: 2,
            },
          },
          areaStyle: {
            // @ts-ignore
            color: tailwind.theme.colors.blue['500'],
          },
          animationEasing: 'elasticOut',
          animationDelayUpdate: function (idx: number) {
            return idx * 2
          },
          data: yData,
        },
      ],
    }),
    [xData, chart, yData, onMouseOver, period]
  )

  return (
    <>
      <CardHeader>
        <CardTitle>
          <span className="hoveredItemValue">
            {chart === PoolChartType.APR ? formatPercent(yData[yData.length - 1]) : formatUSD(yData[yData.length - 1])}
          </span>{' '}
          {chart === PoolChartType.Volume && (
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
              <span className="text-xs top-[-2px] relative">•</span>{' '}
              <span className="hoveredItemValue">{formatUSD(Number(yData[yData.length - 1]))}</span> earned
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {xData.length ? (
            <div className="text-sm text-gray-500 dark:text-slate-500 hoveredItemName">
              {format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')}
            </div>
          ) : (
            <SkeletonText fontSize="sm" />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SkeletonBox className={classNames('h-[400px] w-full dark:via-slate-800 dark:to-slate-900')} />
        ) : (
          <ReactECharts option={DEFAULT_OPTION} style={{ height: 400 }} />
        )}
      </CardContent>
    </>
  )
}
