import {
  processArray,
  processTransaction,
  transactionsInputSchema,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsedParams = transactionsInputSchema.safeParse({
    ...Object.fromEntries(request.nextUrl.searchParams),
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
        chainId,
        txHash,
        txFrom as maker,
        amount0,
        amount1,
        amountUsd,
        blockTimestamp as timestamp
      FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}'
			AND entityType = '${parsedParams.data.type}'
			AND poolId = :id
      ORDER BY blockTimestamp DESC
      LIMIT 10
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

  const results = result.results as unknown[]

  const processedTransactions = processArray.filterErrors(
    results,
    processTransaction,
  )

  return NextResponse.json(processedTransactions)
}
