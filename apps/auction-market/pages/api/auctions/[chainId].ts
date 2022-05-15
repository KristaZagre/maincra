import type { NextApiRequest, NextApiResponse } from 'next'

import { getAuctions } from '../../../graph/graph-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId } = req.query
  const auctions = (await getAuctions(chainId as string))
  res.status(200).send(auctions)
}
