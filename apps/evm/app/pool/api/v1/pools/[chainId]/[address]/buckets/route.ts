import { PoolBucket, createClient, validatePoolBucket } from '@sushiswap/rockset-client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export enum BucketGranularity {
  HOUR= 'hour',
  DAY= 'day',
  WEEK= 'week',
  MONTH= 'month',
};

const schema = z.object({
  chainId: z.string(),
  address: z.string(),
  granularity: z.nativeEnum(BucketGranularity).optional().default(BucketGranularity.DAY),
})


// uses thegraph, not the pools api
export async function GET(request: Request, params: { params: { chainId: string; address: string, granularity: BucketGranularity} }) {
  const parsedParams = schema.safeParse(params.params)

  if (!parsedParams.success) {
    return new Response(parsedParams.error.message, { status: 400 })
  }
  const id = `${parsedParams.data.chainId}:${parsedParams.data.address}`.toLowerCase()

  const client = await createClient()
  const data = await client.queries.query({
    sql: {
      query: `
      SELECT 
			entityId as id,
			timeBucket,
			timestamp,
			granularity,
			volumeUsd,
			liquidityUsd,
			feeUsd,
			feeApr
			FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}'
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
        value: id,
      },
      {
        name: 'granularity',
        type: 'string',
        value: parsedParams.data.granularity,
      },
      ],
    },
  })

  if (!data.results.length) {
    return new Response(`no buckets found for pool ${id}`, { status: 404 })
  }
  
  const validatedBuckets = data.results ? data.results.filter((b: unknown) => validatePoolBucket(b).success) as PoolBucket[] : []
  return NextResponse.json(validatedBuckets)

}
