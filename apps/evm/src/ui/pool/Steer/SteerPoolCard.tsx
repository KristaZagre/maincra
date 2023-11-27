'use client'

import { Pool } from '@sushiswap/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LinkInternal,
  Separator,
  Stat,
  StatLabel,
  StatValue,
  classNames,
} from '@sushiswap/ui'
import { FC } from 'react'
import { formatPercent, formatUSD } from 'sushi/format'

import { APRHoverCard } from '../APRHoverCard'
import { SteerAPRChart } from './SteerAPRChart'
import { SteerLiquidityDistributionWidget } from './SteerLiquidityDistributionWidget/SteerLiquidityDistributionWidget'
import { SteerStrategyConfig } from './constants'

interface SteerPoolCardProps {
  pool: Pool
  vault: Pool['steerVaults'][0]
}

export const SteerPoolCard: FC<SteerPoolCardProps> = ({ pool, vault }) => {
  return (
    <LinkInternal href={`/pool/${pool.id}/smart/${vault.id}`}>
      <Card
        className={classNames(
          'max-w-[400px] hover:border-blue-300 hover:shadow-md',
        )}
      >
        <CardHeader>
          {/* <div className="flex gap-2 pb-3">
            <Chip className="bg-blue/20 text-blue">
              <ShieldCheckIcon className="h-3 w-3" />
              Lowest risk
            </Chip>
          </div> */}
          <CardTitle>{SteerStrategyConfig[vault.strategy].name}</CardTitle>
          <CardDescription>
            {SteerStrategyConfig[vault.strategy].description}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Stat className="!p-0">
            <StatLabel size="sm">Weekly APR</StatLabel>
            <StatValue size="sm">
              <APRHoverCard pool={pool} smartPoolAPR={vault.apr}>
                <span className="underline decoration-dotted underline-offset-2">
                  {formatPercent(vault.apr + pool.incentiveApr)}
                </span>
              </APRHoverCard>
            </StatValue>
          </Stat>
          <div className="h-[200px] rounded-xl flex items-center justify-center">
            <SteerAPRChart vault={vault} />
          </div>
        </CardContent>
        <Separator />
        <div className="grid grid-cols-2 divide-x divide-accent">
          <Stat className="px-6 py-4">
            <StatLabel size="sm">TVL</StatLabel>
            <StatValue size="sm">{formatUSD(vault.reserveUSD)}</StatValue>
          </Stat>
          <Stat className="px-6 py-4">
            <StatLabel size="sm">Total Fees</StatLabel>
            {/* vault.feesUSD, will have to be total for now, will fix later */}
            <StatValue size="sm">{formatUSD(vault.feesUSD)}</StatValue>
          </Stat>
        </div>
        <Separator />
        <CardContent className="pt-6">
          <SteerLiquidityDistributionWidget vault={vault} />
        </CardContent>
      </Card>
    </LinkInternal>
  )
}
