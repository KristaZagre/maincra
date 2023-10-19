import {
  processArray,
  processV2Position,
  v2PositionsInputSchema,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const parsedParams = v2PositionsInputSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const chainIds = parsedParams.data.chainIds

  console.log(parsedParams.data)

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
        t1.decimals AS token1Decimals,
        lp.amountDepositedUsd,
        lp.amountWithdrawnUsd,
        lp.token0AmountDeposited,
        lp.token0AmountWithdrawn,
        lp.token1AmountDeposited,
        lp.token1AmountWithdrawn,
        lp.balance,
      FROM (
          SELECT 
            chainId, poolId, protocol, amountDepositedUsd, amountWithdrawnUsd, token0AmountDeposited, token0AmountWithdrawn, token1AmountDeposited, token1AmountWithdrawn, balance
          FROM
            entities
          WHERE
            namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'LiquidityPosition'
            AND user = :user
            AND protocol = 'SUSHISWAP_V2'
        ) AS lp
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool') AS p
      ON lp.poolId = p.entityId
      JOIN
          (
            SELECT entityId, address, name, symbol, decimals 
            FROM entities 
            WHERE namespace = 'sushiswap-staging' AND entityType = 'Token'
          ) AS t0
      ON p.token0Id = t0.entityId
      JOIN
          (
            SELECT entityId, address, name, symbol, decimals
            FROM entities 
            WHERE namespace = 'sushiswap-staging' AND entityType = 'Token'
          ) AS t1
      ON p.token1Id = t1.entityId
      WHERE true = true
      ${chainIds ? `AND p.chainId IN (${chainIds.join(', ')})` : ''}
      `,
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

  return NextResponse.json(processedV2Positions)
}
