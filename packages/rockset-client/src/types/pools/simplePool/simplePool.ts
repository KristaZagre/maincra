import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'
import type { IncentiveType, PoolProtocol } from '../common.js'

export const simplePoolOutputSchema = z.object({
  id: cz.id(),
  chainId: z.number().int(),
  name: z.string(),
  address: cz.address(),
  swapFee: z.number(),

  token0: cz.token(),
  token1: cz.token(),

  incentiveApr: z.number().default(0),
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
    ).catch([]),

  totalApr1d: z.number().nullable().default(0),

  feeApr1d: z.number().catch(0),
  feeUSD1d: z.number().catch(0),

  volumeUSD1d: z.number().catch(0),
  volumeUSD1w: z.number().catch(0),
  volumeUSD1m: z.number().catch(0),

  liquidity: z.string().nullable().default('0'),
  liquidityUSD: z.number().catch(0),

  protocol: z.string().transform((p) => p as PoolProtocol),
  isIncentivized: z.boolean(),
  hasEnabledSteerVault: z.boolean().catch(false),
})

export const transformSimplePool = (
  input: z.infer<typeof simplePoolOutputSchema>,
) => {
  return input
}

export type SimplePool = ReturnType<typeof transformSimplePool>

export const processSimplePool = (input: unknown) => {
  const parsed = simplePoolOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformSimplePool(parsed.data) }
}
