
import {
  Breadcrumb,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  LinkInternal,
} from '@sushiswap/ui'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'
import { unsanitize } from 'sushi/format'

import { PoolHeader } from '../../../../../ui/pool/PoolHeader'
import { getPool } from 'src/lib/flair/fetchers/pool/id/pool'
import { ID } from 'sushi'

export default async function Layout({
  children,
  params,
}: { children: React.ReactNode; params: { id: string } }) {
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

  const headersList = headers()
  const referer = headersList.get('referer')

  return (
    <>
      <Container maxWidth="5xl" className="px-4">
        <Breadcrumb />
      </Container>
      <Container maxWidth="5xl" className="px-4 pt-10">
        <PoolHeader
          backUrl={referer?.includes('/pool?') ? referer.toString() : '/pool'}
          address={pool.address}
          pool={pool}
        />
      </Container>
      <section className="flex flex-col flex-1 mt-4">
        <div className="bg-gray-50 dark:bg-white/[0.02] border-t border-accent pt-10 pb-20 h-full">
          <div className="flex flex-col gap-2">
            <Container maxWidth="5xl" className="px-2 sm:px-4">
              <LinkInternal
                href={`/pool/${params.id}`}
                className="text-sm text-blue hover:underline"
              >
                ← Pool details
              </LinkInternal>
              <CardHeader className="!px-0 !pb-0">
                <CardTitle>Available Strategies</CardTitle>
                <CardDescription>
                  Choose one of the following strategies:
                </CardDescription>
              </CardHeader>
            </Container>
            {children}
          </div>
        </div>
      </section>
    </>
  )
}
