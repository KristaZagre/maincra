import { parseArgs } from '@sushiswap/client'
import { V2Position, V2PositionsArgs } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from '../../common'

export const getV2PositionsUrl = (args: V2PositionsArgs) => {
  return `${FLAIR_API_URL}/positions/v2${parseArgs(args)}`
}

export const getV2Positions = async (
  args: V2PositionsArgs,
  init?: RequestInit,
): Promise<V2Position[]> => {
  const url = getV2PositionsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
