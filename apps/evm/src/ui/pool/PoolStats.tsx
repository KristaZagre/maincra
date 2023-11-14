'use client'

import { Pool } from '@sushiswap/rockset-client'
import {
  Card,
  CardContent,
  CardHeader,
  CardLabel,
  CardTitle,
  classNames,
} from '@sushiswap/ui'
// import { SkeletonText } from '@sushiswap/ui/components/skeleton'
// import { usePoolGraphData } from 'lib/hooks'
import { FC } from 'react'
// import { ChainId } from 'sushi/chain'
import { formatNumber, formatPercent, formatUSD } from 'sushi'

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
                {formatUSD(pool.liquidityUSD ?? 0)}{' '}
                <span
                  className={classNames(
                    'text-xs',
                    pool.liquidityUSDChangePercent1d > 0
                      ? 'text-green'
                      : 'text-red',
                  )}
                >
                  {pool.liquidityUSDChangePercent1d > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.liquidityUSDChangePercent1d))}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <CardLabel>Volume (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatUSD(pool.volumeUSD1d ?? 0)}{' '}
                <span
                  className={classNames(
                    'text-xs',
                    pool.volumeUSDChangePercent1d > 0
                      ? 'text-green'
                      : 'text-red',
                  )}
                >
                  {pool.volumeUSDChangePercent1d > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.volumeUSDChangePercent1d))}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <CardLabel>Fees (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatUSD(pool.feeUSD1d ?? 0)}{' '}
                <span
                  className={classNames(
                    'text-xs',
                    pool.feeUSDChange1d > 0 ? 'text-green' : 'text-red',
                  )}
                >
                  {pool.feeUSDChangePercent1d > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.feeUSDChangePercent1d))}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <CardLabel>Transactions (24h)</CardLabel>
            {pool ? (
              <div className="text-xl font-semibold">
                {formatNumber(pool.txCount1d).replace('.00', '')}{' '}
                <span
                  className={classNames(
                    'text-xs',
                    pool.txCountChangePercent1d > 0 ? 'text-green' : 'text-red',
                  )}
                >
                  {pool.txCountChangePercent1d > 0 ? '+' : '-'}
                  {formatPercent(Math.abs(pool.txCountChangePercent1d))}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
