import { SimplePool, createClient, validatePool, validateSimplePool } from '@sushiswap/rockset-client'
// import { z } from 'zod'

enum OrderBy {
  LIQUIDITY = 'liquidityUsd',
  VOLUME_1D = 'vol1d',
  VOLUME_1W = 'vol1w',
  VOLUME_1M = 'vol1m',
  FEE_1D = 'fee1d',
  APR = 'apr',
}

const orderByToField = {
  [OrderBy.LIQUIDITY]: 'p.liquidityUsd',
  [OrderBy.VOLUME_1D]: 'p.last1DVolumeUsd',
  [OrderBy.VOLUME_1W]: 'p.last7DVolumeUsd',
  [OrderBy.VOLUME_1M]: 'p.last30DVolumeUsd',
  [OrderBy.FEE_1D]: 'p.last1DFeeUsd',
  [OrderBy.APR]: 'p.last1DFeeApr',
}

// const schema = z.object({
//   orderBy: z.string().optional().default('DESC'),
//   orderField: z.nativeEnum(OrderBy).optional().default(OrderBy.LIQUIDITY),
// })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const index = searchParams.get('index')
  // export async function GET(request: Request) {
  // const { orderBy, orderField } = schema.parse(params)
  const size = 20 // add to param later
  const offset = (Number(index) ?? 0) * size

  const orderDirection: 'DESC' | 'ASC' = 'DESC'

  // const _orderBy = orderByToField[orderField]
  const _orderBy = 'p.liquidityUsd'

  const client = await createClient()
  const result = await client.queries
    .query({
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
      t1.decimals AS token1Decimals
      FROM 
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool' AND isWhitelisted = true) AS p
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t0
      ON p.token0Id = t0.entityId
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t1
      ON p.token1Id = t1.entityId
			WHERE ${_orderBy} IS NOT NULL
			ORDER BY ${_orderBy} ${orderDirection}
      OFFSET ${offset} ROWS 
      FETCH NEXT ${size} ROWS ONLY;
      `,
        parameters: [
          {
            name: 'orderBy',
            type: 'string',
            value: _orderBy,
          },
          {
            name: 'orderDirection',
            type: 'string',
            value: orderDirection,
          },
        ],
      },
    })
    .then((value: { results: [] }) => {
      return value.results ? (value.results.filter((p) => validateSimplePool(p).success) as SimplePool[]) : []
    })

  return Response.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  });
}
