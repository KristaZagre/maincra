import { createClient, processTransaction } from '@sushiswap/rockset-client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

enum TransactionType {
  SWAPS = 'swaps',
  MINTS = 'mints',
  BURNS = 'burns',
}

const schema = z.object({
  chainId: z.string(),
  address: z.string(),
  type: z.nativeEnum(TransactionType),
})

export async function GET(
  request: Request,
  params: {
    params: { chainId: string; address: string; type: TransactionType }
  },
) {
  const parsedParams = schema.safeParse(params.params)

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const id =
    `${parsedParams.data.chainId}:${parsedParams.data.address}`.toLowerCase()

  const entityName =
    parsedParams.data.type === TransactionType.SWAPS
      ? 'Swap'
      : parsedParams.data.type === TransactionType.MINTS
      ? 'Mint'
      : 'Burn'

  const client = await createClient()
  const data = await client.queries.query({
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
			AND entityType = '${entityName}'
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

  if (!data.results.length) {
    return new Response(`no txs found for pool with id: ${id}`, { status: 404 })
  }

  const processedTransactions = data.results
    ? (data.results as unknown[]).filter(
        (b: unknown) => processTransaction(b).success,
      )
    : []
  return NextResponse.json(processedTransactions)
}
