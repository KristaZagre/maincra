import { MinusIcon, PlusIcon } from '@heroicons/react-v1/solid'
import { LinkInternal } from '@sushiswap/ui'
import { Button } from '@sushiswap/ui/components/button'
import { Currency } from '@sushiswap/ui/components/currency'
import { List } from '@sushiswap/ui/components/list/List'
import React, { FC } from 'react'
import { formatPercent, formatUSD } from 'sushi'

import { V2Position } from '@sushiswap/rockset-client'
import { usePoolPosition } from './PoolPositionProvider'

interface PositionQuickHoverTooltipProps {
  row: V2Position
}

export const PositionQuickHoverTooltip: FC<PositionQuickHoverTooltipProps> = ({
  row,
}) => {
  const { underlying0, underlying1, value1, value0 } = usePoolPosition()

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-gray-500 dark:text-slate-500">
          <span className="font-semibold text-gray-900 dark:text-slate-50">
            Total APR
          </span>{' '}
          • Rewards + Fees
        </span>
        <span className="text-3xl font-medium text-gray-900 dark:text-slate-50">
          {formatPercent(row.pool.totalApr1d)}{' '}
          <span className="text-[10px] text-gray-500 dark:text-slate-500">
            {formatPercent(row.pool.incentiveApr)} +{' '}
            {formatPercent(row.pool.feeApr1d)}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={PlusIcon} asChild size="sm" variant="secondary">
          <LinkInternal href={`/pools/${row.pool.id}/add`}>
            Deposit
          </LinkInternal>
        </Button>
        <Button icon={MinusIcon} asChild size="sm" variant="secondary">
          <LinkInternal href={`/pools/${row.pool.id}/remove`}>
            Withdraw
          </LinkInternal>
        </Button>
      </div>

      <List className="!pt-5">
        <div className="flex justify-between">
          <List.Label>Position</List.Label>
          <List.Label>{formatUSD(value0 + value1)}</List.Label>
        </div>
        <List.Control className="!bg-secondary">
          {underlying0 && (
            <List.Item
              loading={!underlying0}
              icon={Currency.Icon}
              iconProps={{
                currency: underlying0?.currency,
              }}
              title={
                <div className="flex items-baseline gap-2">
                  {underlying0?.toSignificant(6)} {underlying0?.currency.symbol}
                  <span className="text-[10px] text-gray-600 dark:text-slate-400 text-slate-600">
                    {formatUSD(value0)}
                  </span>
                </div>
              }
            />
          )}
          {underlying1 && (
            <List.Item
              loading={!underlying1}
              icon={Currency.Icon}
              iconProps={{
                currency: underlying1?.currency,
              }}
              title={
                <div className="flex items-baseline gap-2">
                  {underlying1?.toSignificant(6)} {underlying1?.currency.symbol}
                  <span className="text-[10px] text-gray-600 dark:text-slate-400 text-slate-600">
                    {formatUSD(value1)}
                  </span>
                </div>
              }
            />
          )}
        </List.Control>
      </List>
    </div>
  )
}
