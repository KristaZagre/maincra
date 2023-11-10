import {
  analyticBucketsInputSchema,
  processArray,
  processBucket,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '../cors'

export async function GET(request: NextRequest) {
  const parsedParams = analyticBucketsInputSchema.safeParse({
    ...Object.fromEntries(request.nextUrl.searchParams),
  })

  if (!parsedParams.success) {
    return NextResponse.json(parsedParams.error, { status: 400 })
  }
  const chainIds = parsedParams.data.chainIds

  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query: `
        SELECT 
        ps.timeBucket,
        ps.granularity,
        ps.timestamp,
        SUM(ps.volumeUSD) as volumeUSD,
        SUM(ps.liquidityUSD) as liquidityUSD
        FROM
            entities ps
        JOIN
            entities p ON ps.poolId = p.entityId
        WHERE
            ps.namespace = '${process.env.ROCKSET_ENV}'
            AND ps.entityType = 'PoolStat'
            AND ps.granularity = 'day'
           AND p.namespace = '${process.env.ROCKSET_ENV}'
            AND p.entityType = 'Pool'
            AND p.isWhitelisted = true
            ${chainIds ? `AND p.chainId IN (${chainIds.join(', ')})` : ''}
        GROUP BY
            ps.granularity, ps.timestamp, ps.timeBucket
        ORDER BY
            ps.timeBucket DESC
        LIMIT 50;
        `,
      parameters: [
        {
          name: 'granularity',
          type: 'string',
          value: parsedParams.data.granularity,
        },
      ],
    },
  })

  const results = result.results as unknown[]

  const processedBuckets = processArray.filterErrors(results, processBucket)

  return NextResponse.json(processedBuckets, {
    headers: {
      ...CORS,
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  })
}
