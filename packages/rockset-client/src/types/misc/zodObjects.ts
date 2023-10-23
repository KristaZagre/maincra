import { type Address, isAddress } from 'viem'
import { z } from 'zod'

const commaArray = <T = string>() =>
  z.string().transform((val) => val.split(',') as T[])

// ------------------------------------------------------------------------------------------------

const idTransform = (id: string) => {
  id = id.toLowerCase()
  id = id.replace('3A', ':')

  const [chainId, address] = id.split(':')
  if (!chainId || !address || !isAddress(address))
    throw new Error('Invalid pool id')

  return id as `${string}:${Address}`
}

const id = () => z.string().transform(idTransform)
const ids = () => commaArray().transform((ids) => ids.map(idTransform))

// ------------------------------------------------------------------------------------------------

const addressTransform = (address: string) => {
  if (!isAddress(address)) throw new Error('Invalid address')

  return address.toLowerCase() as Address
}

const address = () => z.string().transform(addressTransform)

// ------------------------------------------------------------------------------------------------

/**
 *
 * @returns a zod object for a token containing the following fields:
 * - `id`
 * - `address`
 * - `chainId
 * - `name`
 * - `symbol`
 * - `decimals`
 */
const token = () =>
  z.object({
    id: cz.id(),
    chainId: z.number().int(),
    address: cz.address(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int(),
  })

// ------------------------------------------------------------------------------------------------

const bigint = () => z.string().transform((val) => BigInt(val))

// ------------------------------------------------------------------------------------------------

export const cz = {
  id,
  ids,
  address,

  bigint,

  token,

  commaArray,
}
