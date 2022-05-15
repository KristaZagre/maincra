import type { NextApiRequest, NextApiResponse } from 'next'

import { getLiquidityPositions } from '../../../graph/graph-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId } = req.query
  const lps = await getLiquidityPositions(chainId as string)
  res.status(200).send(lps)
}
