import {
  poolsCountInputSchema,
  processPoolsCount,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const parsedParams = poolsCountInputSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }

  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query: `
          SELECT COUNT(p.entityId)
          FROM 
              (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool' AND isWhitelisted = true) AS p
          JOIN
              (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t0
          ON p.token0Id = t0.entityId
          JOIN
              (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t1
          ON p.token1Id = t1.entityId
      `,
    },
  })

  const results = result.results as []

  const processedCount = processPoolsCount(
    Object.values(results)[0]
      ? { count: Object.values(results)[0]['?COUNT'] }
      : { count: 0 },
  )

  if (processedCount.success === true) {
    return NextResponse.json(processedCount.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } else {
    return new Response(processedCount.error.message, { status: 500 })
  }
}
