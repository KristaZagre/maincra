import { z } from 'zod'
import { cz } from '../misc/zodObjects.js'

const transactionOutputSchema = z.object({
  chainId: z.number().int(),
  txHash: z.string(),
  amount0: z.string(),
  amount1: z.string(),
  amountUsd: z.number().nullable(),
  maker: cz.address(),
  timestamp: z.number(),
})

export const transformTransaction = (
  input: z.infer<typeof transactionOutputSchema>,
) => {
  return input
}

export type Transaction = ReturnType<typeof transformTransaction>

export const processTransaction = (input: unknown) => {
  const parsed = transactionOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformTransaction(parsed.data) }
}
