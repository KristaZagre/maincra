import { z } from 'zod'
import type { GetApiInputFromOutput } from '../types.js'

export enum PoolProtocol {
  SUSHISWAP_V2 = 'SUSHISWAP_V2',
  BENTOBOX_CLASSIC = 'BENTOBOX_CLASSIC',
  BENTOBOX_STABLE = 'BENTOBOX_STABLE',
  SUSHISWAP_V3 = 'SUSHISWAP_V3',
}

export enum BasePoolOrderBy {
  LIQUIDITY = 'liquidityUsd',
  VOLUME_1D = 'vol1d',
  VOLUME_1W = 'vol1w',
  VOLUME_1M = 'vol1m',
  FEE_1D = 'fee1d',
  APR = 'apr',
}

const basePoolOrderDirs = ['DESC', 'ASC'] as const

export const basePoolInputSchema = z.object({
  pageSize: z.number().int().optional().default(20),
  pageIndex: z.number().int().optional().default(0),
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
    .refine((tokenSymbols) => tokenSymbols.length <= 3, {
      message: 'Can only use up to 3 tokenSymbols.',
    })
    .optional(),
  protocols: z
    .string()
    .transform((protocols) => protocols?.split(',') as PoolProtocol[])
    .optional(),
  orderDir: z
    .string()
    .optional()
    .default('DESC')
    .transform((val) => {
      val = val.toUpperCase()

      if (basePoolOrderDirs.includes(val as any)) {
        return val as typeof basePoolOrderDirs[number]
      } else {
        throw new Error(
          `Invalid orderDirs, valid options are: ${basePoolOrderDirs.join(
            ', ',
          )}`,
        )
      }
    }),
  orderBy: z
    .string()
    .optional()
    .default(BasePoolOrderBy.LIQUIDITY)
    .transform((val) => {
      if (Object.values(BasePoolOrderBy).includes(val as BasePoolOrderBy)) {
        return val as BasePoolOrderBy
      } else {
        throw new Error(
          `Invalid orderBy, valid options are: ${Object.keys(
            BasePoolOrderBy,
          ).join(', ')}`,
        )
      }
    }),
})

export type BasePoolArgs = GetApiInputFromOutput<
  typeof basePoolInputSchema['_input'],
  typeof basePoolInputSchema['_output']
>
