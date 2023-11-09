import { Breadcrumb, Container } from '@sushiswap/ui'
import { getPool } from 'lib/flair/fetchers/pool/id/pool'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'
import { ID } from 'sushi/types'
import { PoolHeader } from '../../../ui/pool/PoolHeader'

export const metadata = {
  title: 'Pool 💦',
}

export default async function Layout({
  children,
  params,
}: { children: React.ReactNode; params: { id: string } }) {
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
  const headersList = headers()
  const referer = headersList.get('referer')
  return (
    <>
      <Container maxWidth="5xl" className="px-4">
        <Breadcrumb />
      </Container>
      <Container maxWidth="5xl" className="px-4 pt-10">
        <PoolHeader
          backUrl={referer?.includes('/pool?') ? referer?.toString() : '/pool'}
          address={pool.address}
          pool={pool}
          apy={{ rewards: /*pool?.incentiveApr*/ 0, fees: pool?.feeApr1d }}
        />
      </Container>
      <section className="flex flex-col flex-1 mt-4">
        <div className="bg-gray-50 dark:bg-white/[0.02] border-t border-accent pt-10 pb-20 h-full">
          <Container maxWidth="5xl" className="px-2 sm:px-4">
            {children}
          </Container>
        </div>
      </section>
    </>
  )
}
