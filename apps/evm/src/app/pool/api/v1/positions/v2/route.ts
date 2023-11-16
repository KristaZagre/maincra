import {
  processArray,
  processV2Position,
  v2PositionsInputSchema,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { CORS } from '../../../cors'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const parsedParams = v2PositionsInputSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const chainIds = parsedParams.data.chainIds
  const query = `
  SELECT 
    {
      'id': p.entityId,
      'chainId': p.chainId,
      'name': CONCAT(t0.symbol, '-', t1.symbol),
      'address': p.address,
      'swapFee': p.swapFee,
      'feeApr1d': p.feeApr1d,
      'feeUSD1d': p.feeUSD1d,
      'volumeUSD1d': p.volumeUSD1d,
      'volumeUSD1w': p.volumeUSD1w,
      'volumeUSD1m': p.volumeUSD1m,
      'liquidity': p.liquidity,
      'liquidityUSD': p.liquidityUSD,
      'protocol': p.protocol,
      'isIncentivized': (
        CASE
          WHEN i.poolId IS NOT NULL THEN true
          ELSE false
        END
      ),
      'token0': {
        'id': p.token0Id,
        'address': t0.address,
        'chainId': t0.chainId,
        'name': t0.name,
        'symbol': t0.symbol,
        'decimals': t0.decimals,
      },
      'token1': {
        'id': p.token1Id,
        'address': t1.address,
        'chainId': t1.chainId,
        'name': t1.name,
        'symbol': t1.symbol,
        'decimals': t1.decimals,
      },
    } as pool,
    lp.amountDepositedUSD,
    lp.amountWithdrawnUSD,
    lp.token0AmountDeposited,
    lp.token0AmountWithdrawn,
    lp.token1AmountDeposited,
    lp.token1AmountWithdrawn,
    lp.balance
  FROM (
      SELECT 
        poolId, amountDepositedUSD, amountWithdrawnUSD, token0AmountDeposited, token0AmountWithdrawn, token1AmountDeposited, token1AmountWithdrawn, balance, chainId
      FROM
        entities
      WHERE
        namespace = '${process.env.ROCKSET_ENV}'
        AND entityType = 'LiquidityPosition'
        AND user = :user
        AND protocol = 'SUSHISWAP_V2'
        AND balance IS NOT NULL
        ${chainIds ? `AND chainId IN (${chainIds.join(', ')})` : ''}
    ) AS lp
  JOIN
      (
        SELECT
          *
        FROM
          entities
        WHERE
          namespace = '${process.env.ROCKSET_ENV}'
          AND entityType = 'Pool'
      ) AS p
    ON lp.poolId = p.entityId
  LEFT JOIN
        (
          SELECT poolId FROM entities WHERE namespace = '${
            process.env.ROCKSET_ENV
          }' AND entityType = 'Incentive'
        ) AS i
    ON p.entityId = i.poolId
  JOIN
      (
        SELECT entityId, address, chainId, name, symbol, decimals 
        FROM entities 
        WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token'
      ) AS t0
    ON p.token0Id = t0.entityId
  JOIN
      (
        SELECT entityId, address, chainId, name, symbol, decimals
        FROM entities 
        WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token'
      ) AS t1
    ON p.token1Id = t1.entityId
  `
  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query,
      parameters: [
        {
          name: 'user',
          type: 'string',
          value: parsedParams.data.user,
        },
      ],
    },
  })

  const results = (result.results || []) as unknown[]

  const processedV2Positions = processArray.filterErrors(
    results,
    processV2Position,
  )

  return NextResponse.json(processedV2Positions, { 
    headers: {
      ...CORS,
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    }
  })
}
