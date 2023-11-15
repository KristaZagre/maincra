
import { LinkInternal } from '@sushiswap/ui'
import { unstable_cache } from 'next/cache'
import notFound from 'src/app/pool/not-found'
import { ID, unsanitize } from 'sushi'
import {
  PoolPositionProvider
} from '../../../../../ui/pool'
import { ConcentratedLiquidityProvider } from '../../../../../ui/pool/ConcentratedLiquidityProvider'
import { MigrateTab } from '../../../../../ui/pool/MigrateTab'
import { getPool } from 'src/lib/flair/fetchers/pool/id/pool'

export default async function MigratePage({
  params,
}: { params: { id: string } }) {
  const poolId = unsanitize(params.id)
  const { success, data: pool } = await unstable_cache(
    async () => getPool({id: poolId as ID}),
    ['pool', poolId],
    {
      revalidate: 60 * 15,
    },
  )()

  if (!pool) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <LinkInternal
        href={'/pool/migrate'}
        className="text-sm text-blue hover:underline"
      >
        ← Back
      </LinkInternal>
      <div className="flex flex-col gap-6">
        <PoolPositionProvider pool={pool}>
          <ConcentratedLiquidityProvider>
            <MigrateTab pool={pool} />
          </ConcentratedLiquidityProvider>
        </PoolPositionProvider>
      </div>
    </div>
  )
}
