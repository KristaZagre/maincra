import { createClient } from '@sushiswap/rockset-client'

export async function GET() {
  const client = await createClient()
  const result = await client.queries
    .query({
      sql: {
        query: `
      SELECT COUNT(p.entityId)
      FROM 
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Pool' AND isWhitelisted = true) AS p
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t0
      ON p.token0Id = t0.entityId
      JOIN
          (SELECT * FROM entities WHERE namespace = '${process.env.ROCKSET_ENV}' AND entityType = 'Token' AND isWhitelisted = true) AS t1
      ON p.token1Id = t1.entityId
      `,
      },
    })
    .then((value: { results: [] }) => {
      return Object.values(value.results)[0] ? { count: Object.values(value.results)[0]['?COUNT'] } : { count: 0 }
    })

  return Response.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  })
}
