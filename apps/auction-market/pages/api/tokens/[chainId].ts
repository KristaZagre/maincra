import type { NextApiRequest, NextApiResponse } from 'next'

import { getExchangeTokens } from '../../../graph/graph-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId } = req.query
  const tokens = (await getExchangeTokens(chainId as string))
  res.status(200).send(tokens)
}
