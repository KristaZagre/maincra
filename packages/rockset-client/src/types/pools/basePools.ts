import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'
import { PoolProtocol, PoolsOrderBy } from './common.js'

const basePoolsOrderDirs = ['DESC', 'ASC'] as const

export const basePoolsInputSchema = z.object({
  pageSize: z.coerce.number().int().optional().default(20),
  pageIndex: z.coerce.number().int().optional().default(0),
  ids: cz.ids().optional(),
  chainIds: cz
    .commaArray()
    .transform((chainIds) => chainIds.map((v) => parseInt(v)))
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
  tokenSymbols: cz
    .commaArray()
    .refine((tokenSymbols) => tokenSymbols.length <= 3, {
      message: 'Can only use up to 3 tokenSymbols.',
    })
    .optional(),
  protocols: cz.commaArray<PoolProtocol>().optional(),
  orderDir: z
    .string()
    .optional()
    .default('DESC')
    .transform((v) => {
      const val = v.toUpperCase()

      if (basePoolsOrderDirs.includes(val as 'DESC' | 'ASC')) {
        return val as typeof basePoolsOrderDirs[number]
      } else {
        throw new Error(
          `Invalid orderDirs, valid options are: ${basePoolsOrderDirs.join(
            ', ',
          )}`,
        )
      }
    }),
  orderBy: z
    .string()
    .optional()
    .default(PoolsOrderBy.LIQUIDITY_USD)
    .transform((val) => {
      if (Object.values(PoolsOrderBy).includes(val as PoolsOrderBy)) {
        return val as PoolsOrderBy
      } else {
        throw new Error(
          `Invalid orderBy, valid options are: ${Object.keys(PoolsOrderBy).join(
            ', ',
          )}`,
        )
      }
    }),
})

export type BasePoolsArgs = GetApiInputFromOutput<
  typeof basePoolsInputSchema['_input'],
  typeof basePoolsInputSchema['_output']
>
