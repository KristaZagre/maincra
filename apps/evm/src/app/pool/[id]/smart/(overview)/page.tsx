import { unstable_cache } from 'next/cache'
import notFound from 'src/app/pool/not-found'
import { getPool } from 'src/lib/flair/fetchers/pool/id/pool'
import { SteerCarousel } from 'src/ui/pool/Steer/SteerCarousel'
import { ID } from 'sushi'
import { unsanitize } from 'sushi/format'

export default async function PositionsCreatePage({
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

  return <SteerCarousel pool={pool} />
}
