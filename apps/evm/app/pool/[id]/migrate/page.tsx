'use client'

import { LinkInternal } from '@sushiswap/ui'
import { notFound } from 'next/navigation'
import React from 'react'
import { PoolPositionProvider } from 'ui/pool'
import { ConcentratedLiquidityProvider } from 'ui/pool/ConcentratedLiquidityProvider'

import { getPool } from 'lib/flair/fetchers/pool/id/pool'
import { ID } from 'sushi/types'
import { MigrateTab } from '../../../../ui/pool/MigrateTab'

export default async function MigratePage({
  params,
}: { params: { id: string } }) {
  // TODO: Validate id
  const pool = await getPool(
    { id: params.id as ID },
    { next: { revalidate: 60 } },
  )

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
