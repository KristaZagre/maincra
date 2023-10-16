import { parseArgs } from '@sushiswap/client'
import { SimplePool, SimplePoolsArgs } from '@sushiswap/rockset-client'

export const getSimplePoolsUrl = (args: SimplePoolsArgs) => {
  return `/pool/api/v1/simplePools${parseArgs(args)}`
}

export const getSimplePools = async (
  args: SimplePoolsArgs,
): Promise<SimplePool[]> => {
  const url = getSimplePoolsUrl(args)
  return fetch(url).then((data) => data.json())
}
