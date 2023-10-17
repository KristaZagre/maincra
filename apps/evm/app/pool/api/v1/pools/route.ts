import {
  poolOrderByToField,
  poolsInputSchema,
  processArray,
  processSimplePool,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const parsedParams = poolsInputSchema.safeParse(
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
        p.blockNumber,
        p._name as name,
        p.address,
        p.fee,
        p.feeGrowthGlobal0X128,
        p.feeGrowthGlobal1X128,
        p.feeUsd,
        p.isWhitelisted,
        p.last1DFeeApr,
        p.last1DFeeChangeUsd,
        p.last1DFeeUsd,
        p.last1DLiquidityUsd,
        p.last1DLiquidityChangePercent,
        p.last1DTxCount,
        p.last1DTxCountChangePercent,
        p.last1DVolumeUsd,
        p.last1DVolumeChangePercent,
        p.last1DVolumeChangeUsd,
        p.last1HFeeApr,
        p.last1HFeeChangeUsd,
        p.last1HFeeUsd,
        p.last1HLiquidityUsd,
        p.last1HTxCount,
        p.last1HVolumeUsd,
        p.last30DFeeApr,
        p.last30DFeeAprChange,
        p.last30DFeeAprChangePercent,
        p.last30DFeeChangePercent,
        p.last30DFeeChangeUsd,
        p.last30DFeeUsd,
        p.last30DLiquidityChangePercent,
        p.last30DLiquidityChangeUsd,
        p.last30DLiquidityUsd,
        p.last30DTxCount,
        p.last30DTxCountChange,
        p.last30DTxCountChangePercent,
        p.last30DVolumeChangePercent,
        p.last30DVolumeChangeUsd,
        p.last30DVolumeUsd,
        p.last7DFeeApr,
        p.last7DFeeChangePercent,
        p.last7DFeeChangeUsd,
        p.last7DFeeUsd,
        p.last7DLiquidityUsd,
        p.last7DTxCount,
        p.last7DTxCountChange,
        p.last7DTxCountChangePercent,
        p.last7DVolumeChangePercent,
        p.last7DVolumeChangeUsd,
        p.last7DVolumeUsd,
        p.liquidity,
        p.liquidityUsd,
        p.protocol,
        p.reserve0,
        p.reserve0Usd,
        p.reserve1,
        p.reserve1Usd,
        p.sqrtPriceX96,
        p.tick,
        p.token0Address,
        p.token0Id,
        p.token0Price,
        t0.name AS token0Name,
        t0.symbol AS token0Symbol,
        t0.decimals AS token0Decimals,
        p.token1Address,
        p.token1Id,
        t1.name AS token1Name,
        t1.symbol AS token1Symbol,
        t1.decimals AS token1Decimals,
        p.token1Price,
        p.txCount,
        p.volumeToken0,
        p.volumeToken0Usd,
        p.volumeToken1,
        p.volumeToken1Usd,
        p.volumeUsd
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