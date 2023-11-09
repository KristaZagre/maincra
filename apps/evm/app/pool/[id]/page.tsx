import { PoolProtocol } from '@sushiswap/rockset-client'
import { Separator } from '@sushiswap/ui'
import { getPool } from 'lib/flair/fetchers/pool/id/pool'
import { notFound } from 'next/navigation'
import { ID } from 'sushi/types'
// import { ManageV2LiquidityCard } from 'ui/pool/ManageV2LiquidityCard'
import { PoolTransactionsV2 } from 'ui/pool/PoolTransactionsV2'
// import {
//   PoolPositionProvider,
//   PoolPositionRewardsProvider,
//   PoolPositionStakedProvider,
//   UnknownTokenAlert,
// } from '../../../ui/pool'
import { PoolChartV2 } from '../../../ui/pool/PoolChartV2'
import { PoolComposition } from '../../../ui/pool/PoolComposition'
// import { PoolMyRewards } from '../../../ui/pool/PoolMyRewards'
import { PoolPageV3 } from '../../../ui/pool/PoolPageV3'
// import { PoolPosition } from '../../../ui/pool/PoolPosition'
import { PoolRewards } from '../../../ui/pool/PoolRewards'
import { PoolStats } from '../../../ui/pool/PoolStats'

export default async function PoolPage({ params }: { params: { id: string } }) {
  // TODO: Add validation, use unsanitize from 'sushi/format'
  const id = params.id.replace('%3A', ':') as ID

  const { success, data: pool } = await getPool(
    { id },
    {
      next: { revalidate: 60 },
    },
  )

  if (!pool) {
    notFound()
  }

  if (pool.protocol === PoolProtocol.SUSHISWAP_V3) {
    return <PoolPageV3 pool={pool} />
  }

  return (
    <>
      {/* <UnknownTokenAlert pool={pool} /> */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_400px] gap-6">
          <div>{/* <ManageV2LiquidityCard pool={pool} /> */}</div>
          <div className="flex flex-col gap-6">
            {/* <PoolPositionProvider pool={pool}>
              <PoolPositionStakedProvider pool={pool}>
                <PoolPositionRewardsProvider pool={pool}>
                  <PoolPosition pool={pool} />
                  <PoolMyRewards pool={pool} />
                </PoolPositionRewardsProvider>
              </PoolPositionStakedProvider>
            </PoolPositionProvider> */}
          </div>
        </div>
        <div className="py-4">
          <Separator />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[auto_400px] gap-6">
          <div>
            <PoolChartV2 id={id} />
          </div>
          <div className="flex flex-col gap-6">
            <PoolComposition pool={pool} />
            <PoolStats pool={pool} />
            <PoolRewards pool={pool} />
          </div>
        </div>
        <div className="py-4">
          <Separator />
        </div>
        <PoolTransactionsV2 pool={pool} />
      </div>
    </>
  )
}
