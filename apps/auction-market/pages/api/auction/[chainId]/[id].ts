import { getAuction } from 'graph/graph-client'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, id } = req.query
  const auctions = await getAuction(id as string, chainId as string)
  res.status(200).send(auctions)
}
