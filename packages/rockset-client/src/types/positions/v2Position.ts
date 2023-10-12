import { z } from 'zod'

const v2PositionOutputSchema = z.object({
  chainId: z.number().int(),
  amountDepositedUsd: z.number(),
  amountWithdrawnUsd: z.number(),
  balance: z.string(),
  name: z.string(),
  poolId: z.string(),
  protocol: z.string(),
  token0AmountDeposited: z.number().or(z.string()),
  token0AmountWithdrawn: z.number().or(z.string()),
  token1AmountDeposited: z.number().or(z.string()),
  token1AmountWithdrawn: z.number().or(z.string()),
})

export type V2Position = z.infer<typeof v2PositionOutputSchema>

export const transformV2Position = (input: V2Position) => {
  return input
}

export const processV2Position = (input: unknown) => {
  const parsed = v2PositionOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformV2Position(parsed.data) }
}
