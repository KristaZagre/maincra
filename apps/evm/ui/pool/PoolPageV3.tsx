'use client'

// import { useConcentratedLiquidityPoolStats } from '@sushiswap/react-query'
import { CardLabel, Separator, SkeletonText, classNames } from '@sushiswap/ui'
import {
  Card,
  CardContent,
  CardCurrencyAmountItem,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sushiswap/ui/components/card'
import { Toggle } from '@sushiswap/ui/components/toggle'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import {
  useConcentratedLiquidityPool,
  useConcentratedLiquidityPoolReserves,
} from '@sushiswap/wagmi/future/hooks'
import { useTokenAmountDollarValues } from 'lib/hooks'
import React, { FC, useMemo, useState } from 'react'
import { formatPercent, formatUSD } from 'sushi'
import { ChainId } from 'sushi/chain'

import { Pool } from '@sushiswap/rockset-client'
import { useExtendedPool } from 'lib/hooks/api/useFlairPoolGraphData'
import { ConcentratedLiquidityProvider } from './ConcentratedLiquidityProvider'
import { ConcentratedPositionsTable } from './ConcentratedPositionsTable'
import { PoolTransactionsV3 } from './PoolTransactionsV3'
// import { PoolRewardDistributionsCard } from './PoolRewardDistributionsCard'
import { PoolsFiltersProvider } from './PoolsFiltersProvider'
import { StatisticsCharts } from './StatisticsChart'

enum Granularity {
  Day = 0,
  Week = 1,
}

const PoolPageV3: FC<{ pool: Pool }> = ({ pool }) => {
  return (
    <ConcentratedLiquidityProvider>
      <_Pool pool={pool} />
    </ConcentratedLiquidityProvider>
  )
}

const _Pool: FC<{ pool: Pool }> = ({ pool }) => {
  const { id } = pool
  const extendedPool = useExtendedPool({ pool })
  const [_chainId, address] = id.split(':')
  const chainId = +_chainId as SushiSwapV3ChainId
  const [granularity, setGranularity] = useState<Granularity>(Granularity.Day)

  const { data: cPool } = useConcentratedLiquidityPool({
    chainId,
    token0: extendedPool.token0,
    token1: extendedPool.token1,
    feeAmount: pool.swapFee * 10000000,
  })

  const { data: reserves, isLoading: isReservesLoading } =
    useConcentratedLiquidityPoolReserves({
      pool: cPool,
      chainId,
    })

  const fiatValues = useTokenAmountDollarValues({ chainId, amounts: reserves })
  // const incentiveAmounts = useMemo(() => poolStats?.incentives.map((el) => el.reward), [poolStats?.incentives])
  // const incentiveAmounts = null
  // const fiatValuesIncentives = useTokenAmountDollarValues({
  //   chainId,
  //   amounts: incentiveAmounts,
  // })

  const { volumeUSD, volumeUSDChangePercent, feeUSD, feeUSDChangePercent } =
    useMemo(
      () => ({
        volumeUSD:
          granularity === Granularity.Week
            ? pool.volumeUSD1w
            : pool.volumeUSD1d ?? 0,
        volumeUSDChangePercent:
          granularity === Granularity.Week
            ? pool.volumeUSDChangePercent1w
            : pool.volumeUSDChangePercent1d,
        feeUSD:
          granularity === Granularity.Week ? pool.feeUSD1w : pool.feeUSD1d ?? 0,
        feeUSDChangePercent:
          granularity === Granularity.Week
            ? pool.feeUSDChangePercent1w
            : pool.feeUSDChangePercent1d,
      }),
      [pool, granularity],
    )

  return (
    <div className="flex flex-col gap-6">
      <PoolsFiltersProvider>
        <ConcentratedPositionsTable
          chainId={pool.chainId as ChainId}
          poolId={pool.address}
        />
      </PoolsFiltersProvider>
      <div className="py-4">
        <Separator />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[auto_400px] gap-6">
        <StatisticsCharts
          pool={extendedPool}
          address={address}
          chainId={chainId}
        />
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Liquidity</CardTitle>
              <CardDescription>
                {formatUSD(fiatValues[0] + fiatValues[1])}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardCurrencyAmountItem
                isLoading={isReservesLoading}
                amount={reserves?.[0]}
                fiatValue={formatUSD(fiatValues[0])}
              />
              <CardCurrencyAmountItem
                isLoading={isReservesLoading}
                amount={reserves?.[1]}
                fiatValue={formatUSD(fiatValues[1])}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex flex-col justify-between md:flex-row gap-y-4">
                  Statistics
                  <div className="flex items-center gap-1">
                    <Toggle
                      variant="outline"
                      size="xs"
                      pressed={granularity === Granularity.Day}
                      onClick={() => setGranularity(Granularity.Day)}
                    >
                      24H
                    </Toggle>
                    <Toggle
                      variant="outline"
                      size="xs"
                      pressed={granularity === Granularity.Week}
                      onClick={() => setGranularity(Granularity.Week)}
                    >
                      1W
                    </Toggle>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <CardLabel>Volume</CardLabel>
                  {pool ? (
                    <div className="text-xl font-semibold">
                      {formatUSD(volumeUSD)}{' '}
                      <span
                        className={classNames(
                          'text-xs',
                          volumeUSDChangePercent > 0
                            ? 'text-green'
                            : 'text-red',
                        )}
                      >
                        {formatPercent(volumeUSDChangePercent)}
                      </span>
                    </div>
                  ) : (
                    <SkeletonText />
                  )}
                </div>
                <div>
                  <CardLabel>Fees</CardLabel>
                  {pool ? (
                    <div className="text-xl font-semibold">
                      {formatUSD(feeUSD)}{' '}
                      <span
                        className={classNames(
                          'text-xs',
                          feeUSDChangePercent > 0 ? 'text-green' : 'text-red',
                        )}
                      >
                        {formatPercent(feeUSDChangePercent)}
                      </span>
                    </div>
                  ) : (
                    <SkeletonText />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="py-4">
        <Separator />
      </div>
      {/* <PoolRewardDistributionsCard pool={extendedPool} /> */}
      <PoolTransactionsV3 pool={extendedPool} />
    </div>
  )
}

export { PoolPageV3 }
