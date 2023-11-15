'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sushiswap/ui/components/card'
import { FC } from 'react'
import { formatUSD } from 'sushi'

import { PoolPositionDesktop } from './PoolPositionDesktop'
import { usePoolPosition } from './PoolPositionProvider'
import { Pool } from '@sushiswap/rockset-client'

interface PoolPositionProps {
  pool: Pool
}

export const PoolPosition: FC<PoolPositionProps> = ({ pool }) => {
  const { value0, value1 } = usePoolPosition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Position</CardTitle>
        <CardDescription>{formatUSD(value0 + value1)}</CardDescription>
      </CardHeader>
      <CardContent>
        <PoolPositionDesktop pool={pool} />
      </CardContent>
    </Card>
  )
}
