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
  const result = await client.queries.query({
    sql: {
      query: `
        SELECT 
          p.entityId as id,
          p.chainId,
          p.blockNumber,
          p._name as name,
          p.address,
          p.protocol,
          p.fee as swapFee,
          
          p.isWhitelisted,
          CASE
            WHEN i.poolId IS NOT NULL THEN true
            ELSE false
          END AS isIncentivized,
           
          {
            'id': p.token0Id,
            'address': t0.address,
            'chainId': t0.chainId,
            'name': t0.name,
            'symbol': t0.symbol,
            'decimals': t0.decimals,
          } as token0,
          {
            'id': p.token1Id,
            'address': t1.address,
            'chainId': t1.chainId,
            'name': t1.name,
            'symbol': t1.symbol,
            'decimals': t1.decimals,
          } as token1,

          p.feeUsd as feeUSD,          

          p.last1HFeeApr as feeApr1h,
          p.last1HFeeAprChangePercent as feeAprChangePercent1h,
          p.last1HFeeUsd as feeUSD1h,
          p.last1HFeeChangeUsd as feeUSDChange1h,
          p.last1HFeeChangePercent as feeUSDChangePercent1h,

          p.last1DFeeApr as feeApr1d,
          p.last1DFeeAprChangePercent as feeAprChangePercent1d,
          p.last1DFeeUsd as feeUSD1d,
          p.last1DFeeChangeUsd as feeUSDChange1d,
          p.last1DFeeChangePercent as feeUSDChangePercent1d,

          p.last7DFeeApr as feeApr1w,
          p.last7DFeeAprChangePercent as feeAprChangePercent1w,
          p.last7DFeeUsd as feeUSD1w,
          p.last7DFeeChangeUsd as feeUSDChange1w,
          p.last7DFeeChangePercent as feeUSDChangePercent1w,

          p.last30DFeeApr as feeApr1m,
          p.last30DFeeAprChangePercent as feeAprChangePercent1m,
          p.last30DFeeUsd as feeUSD1m,
          p.last30DFeeChangeUsd as feeUSDChange1m,
          p.last30DFeeChangePercent as feeUSDChangePercent1m,

          p.liquidity,

          p.liquidityUsd as liquidityUSD,

          p.last1HLiquidityUsd as liquidityUSD1h,
          p.last1HLiquidityChangeUsd as liquidityUSDChange1h,
          p.last1HLiquidityChangePercent as liquidityUSDChangePercent1h,

          p.last1DLiquidityUsd as liquidityUSD1d,
          p.last1DLiquidityChangeUsd as liquidityUSDChange1d,
          p.last1DLiquidityChangePercent as liquidityUSDChangePercent1d,

          p.last7DLiquidityUsd as liquidityUSD1w,
          p.last7DLiquidityChangeUsd as liquidityUSDChange1w,
          p.last7DLiquidityChangePercent as liquidityUSDChangePercent1w,

          p.last30DLiquidityUsd as liquidityUSD1m,
          p.last30DLiquidityChangeUsd as liquidityUSDChange1m,
          p.last30DLiquidityChangePercent as liquidityUSDChangePercent1m,

          p.volumeUsd as volumeUSD,

          p.last1HVolumeUsd as volumeUSD1h,

          p.last1DVolumeUsd as volumeUSD1d,
          p.last1DVolumeChangeUsd as volumeUSDChange1d,
          p.last1DVolumeChangePercent as volumeUSDChangePercent1d,

          p.last7DVolumeUsd as volumeUSD1w,
          p.last7DVolumeChangeUsd as volumeUSDChange1w,
          p.last7DVolumeChangePercent as volumeUSDChangePercent1w,

          p.last30DVolumeUsd as volumeUSD1m,
          p.last30DVolumeChangeUsd as volumeUSDChange1m,
          p.last30DVolumeChangePercent as volumeUSDChangePercent1m,

          p.txCount,

          p.last1HTxCount as txCount1h,

          p.last1DTxCount as txCount1d,
          p.last1DTxCountChange as txCountChange1d,
          p.last1DTxCountChangePercent as txCountChangePercent1d,

          p.last7DTxCount as txCount1w,
          p.last7DTxCountChange as txCountChange1w,
          p.last7DTxCountChangePercent as txCountChangePercent1w,

          p.last30DTxCount as txCount1m,
          p.last30DTxCountChange as txCountChange1m,
          p.last30DTxCountChangePercent as txCountChangePercent1m,

          p.reserve0,
          p.reserve0Usd as reserve0USD,
          p.reserve0BN as reserve0BI,

          p.reserve1,
          p.reserve1Usd as reserve1USD,
          p.reserve1BN as reserve1BI,

          p.sqrtPriceX96,
          p.tick,
          p.feeGrowthGlobal0X128,
          p.feeGrowthGlobal1X128,

          p.volumeToken0,
          p.volumeToken0Usd as volumeToken0USD,
          p.volumeToken1,
          p.volumeToken1Usd as volumeToken1USD,

          p.token0Price,
          p.token1Price,
        FROM 
          (
            SELECT
              *
            FROM
              entities
            WHERE
              namespace = '${process.env.ROCKSET_ENV}'
              AND entityType = 'Pool'
              AND entityId = :id
          ) AS p
        LEFT JOIN
          (
            SELECT
              poolId
            FROM
              entities
            WHERE
              namespace = '${process.env.ROCKSET_ENV}'
              AND entityType = 'Incentive'
          ) AS i
        ON p.entityId = i.poolId
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

  const results = (result.results || []) as unknown[]

  if (!results[0]) {
    return NextResponse.json({ error: 'no pool found' }, { status: 404 })
    // TODO: check the lp token name etc.
  }

  const processedPool = processPool(results[0])

  if (processedPool.success === true) {
    return NextResponse.json(processedPool.data)
  } else {
    return NextResponse.json(processedPool.error.errors, { status: 500 })
  }
}
