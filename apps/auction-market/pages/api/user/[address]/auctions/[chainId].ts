import { getUserAuctions } from 'graph/graph-client'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query
  const auctions = await getUserAuctions(address as string, chainId as string)
  res.status(200).send(auctions)
}
