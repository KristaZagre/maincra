import {
  processTransaction,
  transactionInputSchema,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'

export async function GET(request: NextApiRequest) {
  const parsedParams = transactionInputSchema.safeParse(request.body)

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const id = `${parsedParams.data.chainId}:${parsedParams.data.address}`

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
          value: id,
        },
      ],
    },
  })

  const results = result.results as unknown[]

  if (!results.length) {
    return new Response(`no txs found for pool with id: ${id}`, { status: 404 })
  }

  const processedTransactions = results
    ? results.filter((b) => processTransaction(b).success)
    : []
  return NextResponse.json(processedTransactions)
}
