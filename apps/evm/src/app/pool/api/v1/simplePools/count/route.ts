import {
  poolsCountInputSchema,
  processPoolsCount,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '../../../cors'

export async function GET(request: NextRequest) {
  const parsedParams = poolsCountInputSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }

  const protocols = parsedParams.data.protocols
  const chainIds = parsedParams.data.chainIds
  const symbols = parsedParams.data.tokenSymbols
  const onlyIncentivized = parsedParams.data.isIncentivized

  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query: `
          SELECT COUNT(p.entityId)
          FROM 
              (SELECT * FROM entities WHERE namespace = '${
                process.env.ROCKSET_ENV
              }' AND entityType = 'Pool' AND isWhitelisted = true) AS p
          JOIN
              (SELECT * FROM entities WHERE namespace = '${
                process.env.ROCKSET_ENV
              }' AND entityType = 'Token' AND isWhitelisted = true) AS t0
          ON p.token0Id = t0.entityId
          ${`
            ${onlyIncentivized ? 'INNER JOIN' : 'LEFT JOIN'}
              (SELECT poolId FROM entities WHERE namespace = '${
                process.env.ROCKSET_ENV
              }' AND entityType = 'Incentive') AS i
            ON p.entityId = i.poolId
          `}
          JOIN
              (SELECT * FROM entities WHERE namespace = '${
                process.env.ROCKSET_ENV
              }' AND entityType = 'Token' AND isWhitelisted = true) AS t1
          ON p.token1Id = t1.entityId
          WHERE true = true ${
            protocols
              ? `AND p.protocol IN (${protocols.map((p) => `'${p}'`)})`
              : ''
          }
          ${chainIds ? `AND p.chainId IN (${chainIds.join(', ')})` : ''}
          ${
            symbols
              ? symbols.length === 1
                ? `AND (t0.symbol IN (${symbols.map(
                    (s) => `'${s}'`,
                  )}) OR t1.symbol IN (${symbols.map((s) => `'${s}'`)}))`
                : `AND (t0.symbol IN (${symbols.map(
                    (s) => `'${s}'`,
                  )}) AND t1.symbol IN (${symbols.map((s) => `'${s}'`)}))`
              : ''
          }
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
        ...CORS,
        'Cache-Control': 'public, s-maxage=60',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } else {
    return new Response(processedCount.error.message, { headers: CORS, status: 500 })
  }
}
