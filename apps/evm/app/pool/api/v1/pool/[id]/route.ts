import { poolInputSchema, processPool } from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsedParams = poolInputSchema.safeParse({
    id: params.id,
  })

  if (!parsedParams.success) {
    return NextResponse.json(parsedParams.error, { status: 400 })
  }

  const client = await createClient()
  const data = await client.queries.query({
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
            (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool' AND entityId = :id) AS p
        JOIN
            (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token') AS t0
        ON p.token0Id = t0.entityId
        JOIN
            (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token') AS t1
        ON p.token1Id = t1.entityId;
      `,
      parameters: [
        {
          name: 'id',
          type: 'string',
          value: parsedParams.data.id,
        },
      ],
    },
  })

  if (!data.results[0]) {
    return new Response('no pool found', { status: 404 })
    // TODO: check the lp token name etc.
  }

  const processedPool = processPool(data.results[0])

  if (processedPool.success === true) {
    return NextResponse.json(processedPool.data)
  } else {
    return NextResponse.json(processedPool.error, { status: 500 })
  }
}
