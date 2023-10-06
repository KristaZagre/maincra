'use client'

import { formatNumber, formatPercent, formatUSD } from '@sushiswap/format'
import { Pool } from '@sushiswap/rockset-client'
import { Card, CardContent, CardHeader, CardLabel, CardTitle, classNames } from '@sushiswap/ui'
import { FC } from 'react'

interface PoolStats {
  pool: Pool
}

export const PoolStats: FC<PoolStats> = ({ pool }) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <CardLabel>Liquidity</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatUSD(pool.liquidityUsd ?? 0)}{' '}
                <span className={classNames('text-xs', pool.last1DLiquidityChangePercent > 0 ? 'text-green' : 'text-red')}>
                  {pool.last1DLiquidityChangePercent > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.last1DLiquidityChangePercent))}
                </span>
              </div>
            ): null}
          </div>
          <div>
            <CardLabel>Volume (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatUSD(pool.last1DVolumeUsd ?? 0)}{' '}
                <span className={classNames('text-xs', pool.last1DVolumeChangePercent > 0 ? 'text-green' : 'text-red')}>
                  {pool.last1DVolumeChangePercent > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.last1DVolumeChangePercent))}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <CardLabel>Fees (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatUSD(pool.last1DFeeUsd ?? 0)}{' '}
                <span className={classNames('text-xs', pool.last1DFeeChangeUsd > 0 ? 'text-green' : 'text-red')}>
                  {pool.last1DFeeChangeUsd > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.last1DFeeChangeUsd))}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <CardLabel>Transactions (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatNumber(pool.last1DTxCount).replace('.00', '')}{' '}
                <span className={classNames('text-xs', pool.last1DTxCountChangePercent > 0 ? 'text-green' : 'text-red')}>
                  {pool.last1DTxCountChangePercent > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.last1DTxCountChangePercent))}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
