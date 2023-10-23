import { parseArgs } from '@sushiswap/client'
import { SimplePool, SimplePoolsArgs } from '@sushiswap/rockset-client'
import { FLAIR_API_URL } from '../common'

export const getSimplePoolsUrl = (args: SimplePoolsArgs) => {
  return `${FLAIR_API_URL}/simplePools${parseArgs(args)}`
}

export const getSimplePools = async (
  args: SimplePoolsArgs,
  init?: RequestInit,
): Promise<SimplePool[]> => {
  const url = getSimplePoolsUrl(args)
  return fetch(url, init).then((data) => data.json())
}
