import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'
import { type BasePoolArgs, basePoolInputSchema } from '../basePool.js'
import type { IncentiveType, PoolProtocol } from '../common.js'

export const poolInputSchema = basePoolInputSchema

export type PoolArgs = BasePoolArgs

const poolOutputSchema = z.object({
  id: cz.id(),
  chainId: cz.chainId(),
  blockNumber: z.number().int(),
  name: z.string(),
  address: cz.address(),
  protocol: z.string().transform((p) => p as PoolProtocol),
  swapFee: z.number(),

  incentiveApr: z.number().default(0),
  incentives: z.array(
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
  ),
  wasIncentivized: z.boolean().nullable().default(false), // Might not be needed
  isIncentivized: z.boolean(),

  isWhitelisted: z.boolean(),

  token0: cz.token(),
  token1: cz.token(),

  totalApr1d: z.number().nullable().default(0),

  feeUSD: z.number(),

  feeApr1h: z.number(),
  //feeAprChangePercent1h: z.number(),
  feeUSD1h: z.number(),
  feeUSDChange1h: z.number(),
  //feesUSDChangePercent1h: z.number(),

  feeApr1d: z.number(),
  feeAprChangePercent1d: z.number(),
  feeUSD1d: z.number(),
  feeUSDChange1d: z.number(),
  feeUSDChangePercent1d: z.number(),

  feeApr1w: z.number(),
  feeAprChangePercent1w: z.number(),
  feeUSD1w: z.number(),
  feeUSDChange1w: z.number(),
  feeUSDChangePercent1w: z.number(),

  feeApr1m: z.number(),
  feeAprChangePercent1m: z.number(),
  feeUSD1m: z.number(),
  feeUSDChange1m: z.number(),
  feeUSDChangePercent1m: z.number(),

  liquidity: z.string().nullable().default('0'),

  liquidityUSD: z.number(),

  liquidityUSD1h: z.number(),
  //liquidityUSDChange1h: z.number(),
  //liquidityUSDChangePercent1h: z.number(),

  liquidityUSD1d: z.number(),
  liquidityUSDChange1d: z.number(),
  liquidityUSDChangePercent1d: z.number(),

  liquidityUSD1m: z.number(),
  liquidityUSDChange1m: z.number(),
  liquidityUSDChangePercent1m: z.number(),

  volumeUSD: z.number(),

  volumeUSD1h: z.number(),

  volumeUSD1d: z.number(),
  volumeUSDChange1d: z.number(),
  volumeUSDChangePercent1d: z.number(),

  volumeUSD1w: z.number(),
  volumeUSDChange1w: z.number(),
  volumeUSDChangePercent1w: z.number(),

  volumeUSD1m: z.number(),
  volumeUSDChange1m: z.number(),
  volumeUSDChangePercent1m: z.number(),

  txCount: z.number(),

  txCount1h: z.number(),

  txCount1d: z.number(),
  txCountChange1d: z.number(),
  txCountChangePercent1d: z.number(),

  txCount1w: z.number(),
  txCountChange1w: z.number(),
  txCountChangePercent1w: z.number(),

  txCount1m: z.number(),
  txCountChange1m: z.number(),
  txCountChangePercent1m: z.number(),

  reserve0: z.number(),
  reserve0USD: z.number(),
  reserve0BI: z.string(),

  reserve1: z.number(),
  reserve1USD: z.number(),
  reserve1BI: z.string(),

  sqrtPriceX96: z.string().nullable(),
  tick: z.nullable(z.number()),
  feeGrowthGlobal0X128: z.string().nullable(),
  feeGrowthGlobal1X128: z.string().nullable(),

  volumeToken0: z.string(),
  volumeToken0USD: z.number(),
  volumeToken1: z.string(),
  volumeToken1USD: z.number(),

  token0Price: z.number(),
  token1Price: z.number(),
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
