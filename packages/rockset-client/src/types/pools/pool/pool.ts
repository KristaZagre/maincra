import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'
import { type BasePoolArgs, basePoolInputSchema } from '../basePool.js'
import type { IncentiveType, PoolProtocol } from '../common.js'

export const poolInputSchema = basePoolInputSchema

export type PoolArgs = BasePoolArgs

const poolOutputSchema = z.object({
  id: cz.id(),
  chainId: cz.chainId(),
  name: z.string(),
  address: cz.address(),
  protocol: z.string().transform((p) => p as PoolProtocol),
  swapFee: z.number(),

  incentiveApr: z.number().catch(0),
  incentives: z
    .array(
      z.object({
        id: cz.incentiveId(),
        chainId: cz.chainId(),
        poolId: cz.id(),
        apr: z.number(),
        amount: z.number(),
        rewardPerDay: z.number(),
        rewardToken: cz.token(),
        type: z.string().transform((type) => type as IncentiveType),
      }),
    )
    .default([]),
  wasIncentivized: z.boolean().nullable().default(false), // Might not be needed
  isIncentivized: z.boolean(),

  isWhitelisted: z.boolean().catch(false),

  token0: cz.token(),
  token1: cz.token(),

  totalApr1d: z.number().nullable().catch(0),

  feeUSD: z.number().catch(0),

  feeApr1h: z.number().catch(0),
  feeAprChangePercent1h: z.number().catch(0),
  feeUSD1h: z.number().catch(0),
  feeUSDChange1h: z.number().catch(0),
  feesUSDChangePercent1h: z.number().catch(0),

  feeApr1d: z.number().catch(0),
  feeAprChangePercent1d: z.number().catch(0),
  feeUSD1d: z.number().catch(0),
  feeUSDChange1d: z.number().catch(0),
  feeUSDChangePercent1d: z.number().catch(0),

  feeApr1w: z.number().catch(0),
  feeAprChangePercent1w: z.number().catch(0),
  feeUSD1w: z.number().catch(0),
  feeUSDChange1w: z.number().catch(0),
  feeUSDChangePercent1w: z.number().catch(0),

  feeApr1m: z.number().catch(0),
  feeAprChangePercent1m: z.number().catch(0),
  feeUSD1m: z.number().catch(0),
  feeUSDChange1m: z.number().catch(0),
  feeUSDChangePercent1m: z.number().catch(0),

  liquidity: z.string().nullable().default('0'),

  liquidityUSD: z.number().catch(0),

  liquidityUSD1h: z.number().catch(0),
  liquidityUSDChange1h: z.number().catch(0),
  liquidityUSDChangePercent1h: z.number().catch(0),

  liquidityUSD1d: z.number().catch(0),
  liquidityUSDChange1d: z.number().catch(0),
  liquidityUSDChangePercent1d: z.number().catch(0),

  liquidityUSD1m: z.number().catch(0),
  liquidityUSDChange1m: z.number().catch(0),
  liquidityUSDChangePercent1m: z.number().catch(0),

  volumeUSD: z.number().catch(0),

  volumeUSD1h: z.number().catch(0),

  volumeUSD1d: z.number().catch(0),
  volumeUSDChange1d: z.number().catch(0),
  volumeUSDChangePercent1d: z.number().catch(0),

  volumeUSD1w: z.number().catch(0),
  volumeUSDChange1w: z.number().catch(0),
  volumeUSDChangePercent1w: z.number().catch(0),

  volumeUSD1m: z.number().catch(0),
  volumeUSDChange1m: z.number().catch(0),
  volumeUSDChangePercent1m: z.number().catch(0),

  txCount: z.number().catch(0),

  txCount1h: z.number().catch(0),

  txCount1d: z.number().catch(0),
  txCountChange1d: z.number().catch(0),
  txCountChangePercent1d: z.number().catch(0),

  txCount1w: z.number().catch(0),
  txCountChange1w: z.number().catch(0),
  txCountChangePercent1w: z.number().catch(0),

  txCount1m: z.number().catch(0),
  txCountChange1m: z.number().catch(0),
  txCountChangePercent1m: z.number().catch(0),

  reserve0: z.number().catch(0),
  reserve0USD: z.number().catch(0),
  reserve0BI: z.string().catch('0'),

  reserve1: z.number().catch(0),
  reserve1USD: z.number().catch(0),
  reserve1BI: z.string().catch('0'),

  sqrtPriceX96: z.string().nullable(),
  tick: z.nullable(z.number()),
  feeGrowthGlobal0X128: z.string().nullable(),
  feeGrowthGlobal1X128: z.string().nullable(),

  volumeToken0: z.string().nullable(),
  volumeToken0USD: z.number().catch(0),
  volumeToken1: z.string().nullable(),
  volumeToken1USD: z.number().catch(0),

  token0Price: z.number().catch(0),
  token1Price: z.number().catch(0),
})

export const transformPool = (input: typeof poolOutputSchema['_output']) => {
  return input
}

export type Pool = ReturnType<typeof transformPool>

export const processPool = (input: unknown) => {
  const parsed = poolOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformPool(parsed.data) }
}
