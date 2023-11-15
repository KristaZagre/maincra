'use client'

import { Pool, Protocol } from '@sushiswap/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Message,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@sushiswap/ui'
import Link from 'next/link'
import { FC } from 'react'

import { AddSectionLegacy } from './AddSectionLegacy'
import { PoolPositionProvider } from './PoolPositionProvider'
import { PoolPositionRewardsProvider } from './PoolPositionRewardsProvider'
import { PoolPositionStakedProvider } from './PoolPositionStakedProvider'
import { RemoveSectionLegacy } from './RemoveSectionLegacy'



interface ManageV2LiquidityCardProps {
  pool: Pool
  tab?: 'stake' | 'unstake' | 'add' | 'remove'
}

export const ManageV2LiquidityCard: FC<ManageV2LiquidityCardProps> = ({
  pool,
  tab = 'add',
}) => {
  const isFarm = pool.wasIncentivized || pool.isIncentivized

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage</CardTitle>
        <CardDescription>Manage your position</CardDescription>
      </CardHeader>
      <Tabs
        value={tab}
        onValueChange={() => {}}
        className="w-full"
        defaultValue={tab}
      >
        <CardContent>
          <TabsList className="!flex">
            <Link href={`/pool/${pool.id}/add`} className="flex flex-1">
              <TabsTrigger
                testdata-id="add-tab"
                value="add"
                className="flex flex-1"
              >
                Add
              </TabsTrigger>
            </Link>
            <Link href={`/pool/${pool.id}/remove`} className="flex flex-1">
              <TabsTrigger
                testdata-id="remove-tab"
                value="remove"
                className="flex flex-1"
              >
                Remove
              </TabsTrigger>
            </Link>
          </TabsList>
        </CardContent>
        <div className="px-6 pb-4">
          <Separator />
        </div>
        <PoolPositionProvider pool={pool}>
          <PoolPositionStakedProvider pool={pool}>
            <PoolPositionRewardsProvider pool={pool}>
              <TabsContent value="add">
                <CardContent>
                    <AddSectionLegacy pool={pool} />
                </CardContent>
              </TabsContent>
              <TabsContent value="remove">
                <CardContent>
                    <RemoveSectionLegacy pool={pool} />
                </CardContent>
              </TabsContent>
            </PoolPositionRewardsProvider>
          </PoolPositionStakedProvider>
        </PoolPositionProvider>
      </Tabs>
    </Card>
  )
}
