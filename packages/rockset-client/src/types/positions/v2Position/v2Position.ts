import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'

export const v2PositionOutputSchema = z.object({
  poolId: cz.id(),
  chainId: z.number().int(),
  amountDepositedUsd: z.number(),
  amountWithdrawnUsd: z.number(),
  balance: z.string(),
  name: z.string(),
  protocol: z.string(),
  token0AmountDeposited: z.number().or(z.string()),
  token0AmountWithdrawn: z.number().or(z.string()),
  token1AmountDeposited: z.number().or(z.string()),
  token1AmountWithdrawn: z.number().or(z.string()),
})

export const transformV2Position = (
  input: z.infer<typeof v2PositionOutputSchema>,
) => {
  return input
}

export type V2Position = ReturnType<typeof transformV2Position>

export const processV2Position = (input: unknown) => {
  const parsed = v2PositionOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformV2Position(parsed.data) }
}
