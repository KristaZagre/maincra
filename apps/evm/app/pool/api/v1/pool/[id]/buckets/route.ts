import {
  poolBucketsInputSchema,
  processArray,
  processPoolBucket,
} from '@sushiswap/rockset-client'
import { createClient } from '@sushiswap/rockset-client/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsedParams = poolBucketsInputSchema.safeParse({
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
        entityId as id,
        timeBucket,
        timestamp,
        granularity,
        volumeUSD,
        liquidityUSD,
        feeUSD,
        feeApr
			FROM
        entities
      WHERE namespace = '${process.env.ROCKSET_ENV}'
        AND entityType = 'PoolStat'
        AND granularity = :granularity
        AND poolId = :id
			ORDER BY timestamp DESC
      LIMIT 100
      `,
      parameters: [
        {
          name: 'id',
          type: 'string',
          value: parsedParams.data.id,
        },
        {
          name: 'granularity',
          type: 'string',
          value: parsedParams.data.granularity,
        },
      ],
    },
  })

  const results = result.results as unknown[]

  const processedBuckets = processArray.filterErrors(results, processPoolBucket)

  return NextResponse.json(processedBuckets)
}
