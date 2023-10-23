import { z } from 'zod'
import { simplePoolOutputSchema, transformSimplePool } from '../../index.js'

export const v2PositionOutputSchema = z.object({
  pool: simplePoolOutputSchema,
  balance: z.string(),
  amountWithdrawnUSD: z.number(),
  amountDepositedUSD: z.number(),
  token0AmountDeposited: z.number().or(z.string()),
  token0AmountWithdrawn: z.number().or(z.string()),
  token1AmountDeposited: z.number().or(z.string()),
  token1AmountWithdrawn: z.number().or(z.string()),
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
