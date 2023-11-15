
import {
  CardCurrencyAmountItem,
  CardGroup,
  CardLabel,
} from '@sushiswap/ui/components/card'
import { FC } from 'react'
import { formatUSD } from 'sushi'

import { usePoolPosition } from './PoolPositionProvider'
import { Pool } from '@sushiswap/rockset-client'

interface PoolPositionProps {
  pool: Pool
}

export const PoolPositionDesktop: FC<PoolPositionProps> = () => {
  const { underlying1, underlying0, value1, value0, isLoading } =
    usePoolPosition()

  return (
    <CardGroup>
      <CardLabel>Unstaked</CardLabel>
      <CardCurrencyAmountItem
        isLoading={isLoading}
        amount={underlying0}
        fiatValue={formatUSD(value0)}
      />
      <CardCurrencyAmountItem
        isLoading={isLoading}
        amount={underlying1}
        fiatValue={formatUSD(value1)}
      />
    </CardGroup>
  )
}
