'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@sushiswap/ui'
import { FC } from 'react'

import { Pool, PoolProtocol } from '@sushiswap/rockset-client'
import { AddSectionV2 } from './AddSectionV2'
import { PoolPositionProvider } from './PoolPositionProvider'
import { RemoveSectionV2 } from './RemoveSectionV2'

interface ManageV2LiquidityCardProps {
  pool: Pool
}

export const ManageV2LiquidityCard: FC<ManageV2LiquidityCardProps> = ({
  pool,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage</CardTitle>
        <CardDescription>Manage your position</CardDescription>
      </CardHeader>
      <Tabs className="w-full" defaultValue="add">
        <CardContent>
          <TabsList className="!flex">
            <TabsTrigger
              testdata-id="add-tab"
              value="add"
              className="flex flex-1"
            >
              Add
            </TabsTrigger>
            <TabsTrigger
              testdata-id="remove-tab"
              value="remove"
              className="flex flex-1"
            >
              Remove
            </TabsTrigger>
          </TabsList>
        </CardContent>
        <div className="px-6 pb-4">
          <Separator />
        </div>
        <PoolPositionProvider pool={pool}>
          <TabsContent value="add">
            <CardContent>
              {pool.protocol === PoolProtocol.SUSHISWAP_V2 ? (
                <AddSectionV2 pool={pool} />
              ) : null}
            </CardContent>
          </TabsContent>
          <TabsContent value="remove">
            <CardContent>
              {pool.protocol === PoolProtocol.SUSHISWAP_V2 ? (
                <RemoveSectionV2 pool={pool} />
              ) : null}
            </CardContent>
          </TabsContent>
        </PoolPositionProvider>
      </Tabs>
    </Card>
  )
}
