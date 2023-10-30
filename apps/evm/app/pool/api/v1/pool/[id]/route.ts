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
          p.swapFee,
          
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

          p.feeUSD,          

          p.feeApr1h,
          p.feeAprChangePercent1h,
          p.feeUSD1h,
          p.feeUSDChange1h,
          p.feeUSDChangePercent1h,

          p.feeApr1d,
          p.feeAprChangePercent1d,
          p.feeUSD1d,
          p.feeUSDChange1d,
          p.feeUSDChangePercent1d,

          p.feeApr1w,
          p.feeAprChangePercent1w,
          p.feeUSD1w,
          p.feeUSDChange1w,
          p.feeUSDChangePercent1w,

          p.feeApr1m,
          p.feeAprChangePercent1m,
          p.feeUSD1m,
          p.feeUSDChange1m,
          p.feeUSDChangePercent1m,

          p.liquidity,

          p.liquidityUSD,

          p.liquidityUSD1h,
          p.liquidityUSDChange1h,
          p.liquidityUSDChangePercent1h,

          p.liquidityUSD1d,
          p.liquidityUSDChange1d,
          p.liquidityUSDChangePercent1d,

          p.liquidityUSD1w,
          p.liquidityUSDChange1w,
          p.liquidityUSDChangePercent1w,

          p.liquidityUSD1m,
          p.liquidityUSDChange1m,
          p.liquidityUSDChangePercent1m,

          p.volumeUSD,

          p.volumeUSD1h,

          p.volumeUSD1d,
          p.volumeUSDChange1d,
          p.volumeUSDChangePercent1d,

          p.volumeUSD1w,
          p.volumeUSDChange1w,
          p.volumeUSDChangePercent1w,

          p.volumeUSD1m,
          p.volumeUSDChange1m,
          p.volumeUSDChangePercent1m,

          p.txCount,

          p.txCount1h,

          p.txCount1d,
          p.txCountChange1d,
          p.txCountChangePercent1d,

          p.txCount1w,
          p.txCountChange1w,
          p.txCountChangePercent1w,

          p.txCount1m,
          p.txCountChange1m,
          p.txCountChangePercent1m,

          p.reserve0,
          p.reserve0USD,
          p.reserve0BI,

          p.reserve1,
          p.reserve1USD,
          p.reserve1BI,

          p.sqrtPriceX96,
          p.tick,
          p.feeGrowthGlobal0X128,
          p.feeGrowthGlobal1X128,

          p.volumeToken0,
          p.volumeToken0USD,
          p.volumeToken1,
          p.volumeToken1USD,

          p.token0Price,
          p.token1Price
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
