import { z } from 'zod'
import { convertToken } from '../../misc/convertToken.js'
import { cz } from '../../misc/zodObjects.js'
import { type BasePoolArgs, basePoolInputSchema } from '../basePool.js'

export const poolInputSchema = basePoolInputSchema

export type PoolArgs = BasePoolArgs

const poolOutputSchema = z
  .object({
    id: cz.id(),
    chainId: z.number().int(),
    blockNumber: z.number().int(),
    name: z.string(),
    address: cz.address(),
    fee: z.number(),
    feeUsd: z.number(),
    isWhitelisted: z.boolean(),
    last1DFeeApr: z.number(),
    last1DFeeChangeUsd: z.number(),
    last1DFeeUsd: z.number(),
    last1DLiquidityUsd: z.number(),
    last1DLiquidityChangePercent: z.number(),
    last1DVolumeChangeUsd: z.number(),
    last1DVolumeChangePercent: z.number(),
    last1DTxCountChangePercent: z.number(),
    last1DTxCount: z.number(),
    last1DVolumeUsd: z.number(),
    last1HFeeApr: z.number(),
    last1HFeeChangeUsd: z.number(),
    last1HFeeUsd: z.number(),
    last1HLiquidityUsd: z.number(),
    last1HTxCount: z.number(),
    last1HVolumeUsd: z.number(),
    last30DFeeApr: z.number(),
    last30DFeeAprChange: z.number(),
    last30DFeeAprChangePercent: z.number(),
    last30DFeeChangePercent: z.number(),
    last30DFeeChangeUsd: z.number(),
    last30DFeeUsd: z.number(),
    last30DLiquidityChangePercent: z.number(),
    last30DLiquidityChangeUsd: z.number(),
    last30DLiquidityUsd: z.number(),
    last30DTxCount: z.number(),
    last30DTxCountChange: z.number(),
    last30DTxCountChangePercent: z.number(),
    last30DVolumeChangePercent: z.number(),
    last30DVolumeChangeUsd: z.number(),
    last30DVolumeUsd: z.number(),
    last7DFeeApr: z.number(),
    last7DFeeChangePercent: z.number(),
    last7DFeeChangeUsd: z.number(),
    last7DFeeUsd: z.number(),
    last7DLiquidityUsd: z.number(),
    last7DTxCount: z.number(),
    last7DTxCountChange: z.number(),
    last7DTxCountChangePercent: z.number(),
    last7DVolumeChangePercent: z.number(),
    last7DVolumeChangeUsd: z.number(),
    last7DVolumeUsd: z.number(),
    liquidity: z.string().nullable().default('0'),
    liquidityUsd: z.number(),
    protocol: z.string(),
    reserve0: z.number(),
    reserve0Usd: z.number(),
    reserve1: z.number(),
    reserve1Usd: z.number(),
    sqrtPriceX96: z.string().nullable(),
    tick: z.nullable(z.number()),
    feeGrowthGlobal0X128: z.string().nullable(),
    feeGrowthGlobal1X128: z.string().nullable(),
    txCount: z.number(),
    volumeToken0: z.string(),
    volumeToken0Usd: z.number(),
    volumeToken1: z.string(),
    volumeToken1Usd: z.number(),
    volumeUsd: z.number(),
    token0Price: z.number(),
    token1Price: z.number(),
  })
  .merge(cz.token0())
  .merge(cz.token1())

export const transformPool = (input: typeof poolOutputSchema['_output']) => {
  return {
    ...input,
    token0: convertToken({ no: 0, obj: input }),
    token1: convertToken({ no: 1, obj: input }),
  }
}

export type Pool = ReturnType<typeof transformPool>

export const processPool = (input: unknown) => {
  const parsed = poolOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformPool(parsed.data) }
}
