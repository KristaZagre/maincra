import { createClient, processV2Position } from '@sushiswap/rockset-client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  user: z.string(),
})

// uses thegraph, not the pools api
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsedParams = schema.safeParse({ user: searchParams.get('user') })

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const user = parsedParams.data.user.toLowerCase()

  const client = await createClient()
  const result = await client.queries.query({
    sql: {
      query: `
      SELECT 
        CONCAT(t0.symbol, '-', t1.symbol) AS name, 
        lp.chainId,
        lp.poolId,
        lp.protocol,
        lp.amountDepositedUsd,
        lp.amountWithdrawnUsd,
        lp.token0AmountDeposited,
        lp.token0AmountWithdrawn,
        lp.token1AmountDeposited,
        lp.token1AmountWithdrawn,
        lp.balance,
        t0.entityId AS token0Id,
        t0.address AS token0Address,
        t0.name AS token0Name,
        t0.symbol AS token0Symbol,
        t0.decimals AS token0Decimals,
        t1.entityId AS token1Id,
        t1.address AS token1Address,
        t1.name AS token1Name,
        t1.symbol AS token1Symbol,
        t1.decimals AS token1Decimals,
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
          (SELECT entityId, token0Id, token1Id FROM entities WHERE namespace = 'sushiswap-staging' AND entityType = 'Pool') AS p
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
      ON p.token1Id = t1.entityId;
      `,
      parameters: [
        {
          name: 'user',
          type: 'string',
          value: user,
        },
      ],
    },
  })

  const results = result.results as unknown[]

  const processedV2Positions = results
    ? results.filter((p) => processV2Position(p).success)
    : []

  return NextResponse.json(processedV2Positions)
}
