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
 * - `token0Id`
 * - `token0Name`
 * - `token0Symbol`
 * - `token0Address`
 * - `token0Decimals`
 */
const token0 = () =>
  z.object({
    token0Id: cz.id(),
    token0Address: cz.address(),
    token0Name: z.string(),
    token0Symbol: z.string(),
    token0Decimals: z.number().int(),
  })

/**
 *
 * @returns a zod object for a token containing the following fields:
 * - `token1Id`
 * - `token1Name`
 * - `token1Symbol`
 * - `token1Address`
 * - `token1Decimals`
 */
const token1 = () =>
  z.object({
    token1Id: cz.id(),
    token1Address: cz.address(),
    token1Name: z.string(),
    token1Symbol: z.string(),
    token1Decimals: z.number().int(),
  })

// ------------------------------------------------------------------------------------------------

export const cz = {
  id,
  ids,
  address,

  token0,
  token1,

  commaArray,
}
