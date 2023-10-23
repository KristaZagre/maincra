import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'
import type { PoolProtocol } from '../common.js'

export const simplePoolOutputSchema = z.object({
  id: cz.id(),
  chainId: z.number().int(),
  name: z.string(),
  address: cz.address(),
  swapFee: z.number(),

  token0: cz.token(),
  token1: cz.token(),

  feeApr1d: z.number().catch(0),
  feeUSD1d: z.number().catch(0),

  volumeUSD1d: z.number(),
  volumeUSD1w: z.number(),
  volumeUSD1m: z.number(),

  liquidity: z.string().nullable().default('0'),
  liquidityUSD: z.number().catch(0),

  protocol: z.string().transform((p) => p as PoolProtocol),
  isIncentivized: z.boolean(),
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
