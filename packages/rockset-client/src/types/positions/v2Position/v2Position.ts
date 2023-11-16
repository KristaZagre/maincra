import { z } from 'zod'
import { simplePoolOutputSchema, transformSimplePool } from '../../index.js'

export const v2PositionOutputSchema = z.object({
  pool: simplePoolOutputSchema,
  balance: z.string().catch('0'),
  amountWithdrawnUSD: z.number().catch(0),
  amountDepositedUSD: z.number().catch(0),
  token0AmountDeposited: z.string().catch('0'),
  token0AmountWithdrawn: z.string().catch('0'),
  token1AmountDeposited: z.string().catch('0'),
  token1AmountWithdrawn: z.string().catch('0'),
})

export const transformV2Position = (
  input: z.infer<typeof v2PositionOutputSchema>,
) => {
  return {
    ...input,
    pool: transformSimplePool(input.pool),
  }
}

export type V2Position = ReturnType<typeof transformV2Position>

export const processV2Position = (input: unknown) => {
  const parsed = v2PositionOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformV2Position(parsed.data) }
}
