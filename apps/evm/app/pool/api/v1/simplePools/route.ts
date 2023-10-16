import {
  poolOrderByToField,
  processArray,
  processSimplePool,
  simplePoolsInputSchema,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const parsedParams = simplePoolsInputSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }

  const orderBy = poolOrderByToField[parsedParams.data.orderBy]

  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query: `
      SELECT 
        p.entityId as id,
        p.chainId,
        CONCAT(t0.symbol, '-', t1.symbol) AS name,
        p.address,
        p.fee,
        p.last1DFeeApr,
        p.last1DFeeUsd,
        p.last1DVolumeUsd,
        p.last1DVolumeUsd,
        p.last30DVolumeUsd,
        p.last7DVolumeUsd,
        p.liquidity,
        p.liquidityUsd,
        p.protocol,
        p.token0Address,
        p.token0Id,
        t0.name AS token0Name,
        t0.symbol AS token0Symbol,
        t0.decimals AS token0Decimals,
        p.token1Address,
        p.token1Id,
        t1.name AS token1Name,
        t1.symbol AS token1Symbol,
        t1.decimals AS token1Decimals
      FROM 
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool' AND isWhitelisted = true) AS p
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t0
      ON p.token0Id = t0.entityId
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t1
      ON p.token1Id = t1.entityId
			WHERE ${orderBy} IS NOT NULL
			ORDER BY ${orderBy} ${parsedParams.data.orderDir}
      OFFSET ${parsedParams.data.pageIndex} ROWS 
      FETCH NEXT ${parsedParams.data.pageSize} ROWS ONLY;
      `,
      parameters: [
        {
          name: 'orderBy',
          type: 'string',
          value: orderBy,
        },
        {
          name: 'orderDirection',
          type: 'string',
          value: parsedParams.data.orderDir,
        },
      ],
    },
  })

  const results = (result.results || []) as unknown[]

  const processedSimplePools = processArray.filterErrors(
    results,
    processSimplePool,
  )

  return Response.json(processedSimplePools, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  })
}
