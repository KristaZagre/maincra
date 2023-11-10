import {
  analyticTokensInputSchema,
  processAnalyticToken,
  processArray,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '../cors'

export async function GET(request: NextRequest) {
  const parsedParams = analyticTokensInputSchema.safeParse({
    ...Object.fromEntries(request.nextUrl.searchParams),
  })

  if (!parsedParams.success) {
    return NextResponse.json(parsedParams.error, { status: 400 })
  }

  const chainIds = parsedParams.data.chainIds

  const client = await createClient()

  // COALESCE(t.v2TrackedVolumeUSD, 0) + COALESCE(t.v3TrackedVolumeUSD, 0) AS totalVolumeUSD,
  const result = await client.queries.query({
    sql: {
      query: `
      WITH LatestPrices AS (
        SELECT
            tokenAddress,
            timestamp,
            amountUsd,
            ROW_NUMBER() OVER (PARTITION BY tokenAddress ORDER BY timestamp DESC) AS rn
        FROM
            entities
        WHERE
            namespace IN ('${process.env.ROCKSET_ENV}', 'system')
            AND entityType = 'TokenPrice'
            AND amountUsd IS NOT NULL
      )
      SELECT
          {
            'id': t.entityId,
            'address': t.address,
            'chainId': t.chainId,
            'name': t.name,
            'symbol': t.symbol,
            'decimals': t.decimals,
          } as token,
          COALESCE(t.v2TrackedLiquidityUSD, 0) + COALESCE(t.v3TrackedLiquidityUSD, 0) AS totalLiquidityUSD,
          lp.amountUsd as price,
          t.volumeUSD24h
      FROM
          entities t
      LEFT JOIN LatestPrices lp ON t.address = lp.tokenAddress AND lp.rn = 1
      WHERE
          t.namespace = '${process.env.ROCKSET_ENV}'
          AND t.entityType = 'Token'
          AND isWhitelisted = true
          ${chainIds ? `AND t.chainId IN (${chainIds.join(', ')})` : ''}
      ORDER BY
        totalLiquidityUSD DESC
      LIMIT 20;
        `,
    },
  })

  const results = result.results as unknown[]

  const processedTokens = processArray.filterErrors(
    results,
    processAnalyticToken,
  )

  return NextResponse.json(processedTokens, {
    headers: {
      ...CORS,
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  })
}
