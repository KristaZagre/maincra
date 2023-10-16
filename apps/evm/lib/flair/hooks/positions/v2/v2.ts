import { parseArgs } from '@sushiswap/client'
import { V2Position, V2PositionsArgs } from '@sushiswap/rockset-client'

export const getV2PositionsUrl = (args: V2PositionsArgs) => {
  return `/pool/api/v1/positions/v2${parseArgs(args)}`
}

export const getV2Positions = async (
  args: V2PositionsArgs,
): Promise<V2Position[]> => {
  const url = getV2PositionsUrl(args)
  return fetch(url).then((data) => data.json())
}
