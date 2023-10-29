import { Protocol } from '@sushiswap/client'
import { V2Position } from '@sushiswap/rockset-client'
import { useAccount } from '@sushiswap/wagmi'
import { SUPPORTED_CHAIN_IDS } from 'config'
import { useV2Positions } from 'lib/flair/hooks/positions/v2/v2'
import React, { FC, ReactNode } from 'react'

interface PositionCardList {
  children({
    positions,
    isLoading,
  }: { positions: V2Position[]; isLoading: boolean }): ReactNode
}

const value = (position: V2Position) =>
  (Number(position.balance) / Number(position.pool.liquidity)) *
  Number(position.pool.liquidityUSD)

export const PositionCardList: FC<PositionCardList> = ({ children }) => {
  const { address } = useAccount()
  const { data: userPositions, isLoading } = useV2Positions(
    {
      user: address!,
      chainIds: SUPPORTED_CHAIN_IDS,
    },
    { enabled: !!address },
  )

  return (
    <>
      {children({
        positions: isLoading
          ? new Array(6).fill(null)
          : (userPositions || [])
              .filter((el) => el.pool.protocol === Protocol.SUSHISWAP_V2)
              .sort((a, b) => value(b) - value(a)),
        isLoading: isLoading,
      })}
    </>
  )
}
