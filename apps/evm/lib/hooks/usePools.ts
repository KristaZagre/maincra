import { SimplePool } from '@sushiswap/rockset-client'
import useSWRInfinite, { SWRInfiniteConfiguration } from 'swr/infinite'
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
    cursor: z.string().optional(),
    orderBy: z.string().default('liquidityUSD'),
    orderDir: z.enum(['asc', 'desc']).default('desc'),
  })

export type GetPoolsArgs =
  | GetApiInputFromOutput<(typeof PoolsApiSchema)['_input'], (typeof PoolsApiSchema)['_output']>
  | undefined

export const getPoolsUrl = (args: GetPoolsArgs) => {
  return '/pool/api/v1/pools'
}

export const usePoolsInfinite = ({
  args,
  shouldFetch,
}: {
  args: GetPoolsArgs
  swrConfig?: SWRInfiniteConfiguration
  shouldFetch?: boolean
}) => {
  return useSWRInfinite<SimplePool[]>(
    (pageIndex, previousData) => {
      if (shouldFetch === false) return null

      // first page, we don't have `previousPageData`
      if (pageIndex === 0) return getPoolsUrl(args)

      // add the cursor to the API endpoint
      return getPoolsUrl({ ...args, cursor: previousData?.[previousData.length - 1]?.id })
    },
    (url) => fetch(url).then((data) => data.json())
  )
}
