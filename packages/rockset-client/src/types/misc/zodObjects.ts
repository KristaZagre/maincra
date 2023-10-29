import { type Address, isAddress } from 'viem'
import { z } from 'zod'
import type { IncentiveType } from '../index.js'

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

const incentiveIdTransform = (id: string) => {
  id = id.toLowerCase()
  id = id.replace('3A', ':')

  const [chainId, poolAddress, rewardTokenAddress] = id.split(':')
  if (
    !chainId ||
    !poolAddress ||
    !isAddress(poolAddress) ||
    !rewardTokenAddress ||
    !isAddress(rewardTokenAddress)
  )
    throw new Error('Invalid pool id or rewardTokenAddress')

  return id as `${string}:${Address}:${Address}:${IncentiveType}`
}

const incentiveId = () => z.string().transform(incentiveIdTransform)

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

// TODO: Add narrowing
const chainId = () => z.number().int()

// ------------------------------------------------------------------------------------------------
export const cz = {
  id,
  ids,
  address,
  chainId,

  incentiveId,

  bigint,

  token,

  commaArray,
}
