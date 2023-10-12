import { z } from 'zod'

const transactionSchema = z.object({
  chainId: z.number().int(),
  txHash: z.string(),
  amount0: z.string(),
  amount1: z.string(),
  amountUsd: z.number().nullable(),
  maker: z.string(),
  timestamp: z.number(),
})

export type Transaction = z.infer<typeof transactionSchema>

export const transformTransaction = (input: Transaction) => {
  return input
}

export const processTransaction = (input: unknown) => {
  const parsed = transactionSchema.safeParse(input)

  if (parsed.success === false) {
    throw new Error(parsed.error.message)
  }

  return transformTransaction(parsed.data)
}
