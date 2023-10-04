import { SimplePool } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

/**
 * API is called with strings as arguments, need to convert those into their respective types.
 * ALso need to consider zod.defaults, which is why we can't use the output type directly.
 */
export type GetApiInputFromOutput<I extends object, O extends Partial<Record<keyof I, unknown>>> = {
  [K in keyof I]: (I[K] extends undefined ? undefined : unknown) & O[K]
}
enum Protocol {
  SUSHISWAP_V2 = 'SUSHISWAP_V2',
  BENTOBOX_CLASSIC = 'BENTOBOX_CLASSIC',
  BENTOBOX_STABLE = 'BENTOBOX_STABLE',
  SUSHISWAP_V3 = 'SUSHISWAP_V3',
}

export const PoolsApiSchema = z.object({
  take: z.coerce.number().int().lte(1000).default(20),
  index: z.coerce.number().int().default(0),
  ids: z
    .string()
    .transform((ids) => ids?.split(',').map((id) => id.toLowerCase()))
    .optional(),
  chainIds: z
    .string()
    .transform((val) => val.split(',').map((v) => parseInt(v)))
    .optional(),
  isIncentivized: z.coerce
    .string()
    .transform((val) => {
      if (val === 'true') {
        return true
      } else if (val === 'false') {
        return false
      } else {
        throw new Error('isIncentivized must true or false')
      }
    })
    .optional(),
  isWhitelisted: z.coerce
    .string()
    .transform((val) => {
      if (val === 'true') {
        return true
      } else if (val === 'false') {
        return false
      } else {
        throw new Error('isWhitelisted must true or false')
      }
    })
    .optional(),
  hasEnabledSteerVault: z.coerce
    .string()
    .transform((val) => {
      if (val === 'true') {
        return true
      } else if (val === 'false') {
        return false
      } else {
        throw new Error('hasEnabledSteerVault must true or false')
      }
    })
    .optional(),
  tokenSymbols: z
    .string()
    .transform((tokenSymbols) => tokenSymbols?.split(','))
    .refine((tokenSymbols) => tokenSymbols.length <= 3, { message: 'Can only use up to 3 tokenSymbols.' })
    .optional(),
  protocols: z
    .string()
    .transform((protocols) => protocols?.split(',') as Protocol[])
    .optional(),
  orderBy: z.string().default('liquidityUSD'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
})

export function parseArgs<T>(args?: Partial<T>) {
  if (!args) return ''
  return Object.entries(args)
    .sort(([key1], [key2]) => key1.localeCompare(key2))
    .reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc
      if (Array.isArray(value) && value.length === 0) return acc
      const param = `${key}=${Array.isArray(value) ? value.join(',') : value}`
      if (acc === '?') {
        return `${acc}${param}`
      } else {
        return `${acc}&${param}`
      }
    }, '?')
}

export type GetPoolsArgs =
  | GetApiInputFromOutput<(typeof PoolsApiSchema)['_input'], (typeof PoolsApiSchema)['_output']>
  | undefined

export const getPoolsUrl = (args: GetPoolsArgs) => {
  console.log({ args })
  return `/pool/api/v1/pools${parseArgs(args)}`
}

export const getPoolCountUrl = (args: GetPoolsArgs) => {
  console.log({ args })
  return `/pool/api/v1/pools/count${parseArgs(args)}`
}

export const usePools = ({ args }: { args: GetPoolsArgs }) =>
  useQuery(['data', args], () => fetch(getPoolsUrl(args)).then((data) => data.json()) as Promise<SimplePool[]>, {
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 86400000, // 24hs
    enabled: true,
  })

export const usePoolCount = ({ args }: { args: GetPoolsArgs }) =>
  useQuery(
    ['count', args],
    () => fetch(getPoolCountUrl(args)).then((data) => data.json()) as Promise<{ count: number }>,
    {
      initialData: { count: 0 },
      keepPreviousData: true,
      staleTime: 0,
      cacheTime: 86400000, // 24hs
      enabled: true,
    }
  )
