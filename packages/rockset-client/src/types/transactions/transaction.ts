import { z } from 'zod'
import type { GetApiInputFromOutput } from '../types.js'

enum TransactionType {
  SWAPS = 'Swap',
  MINTS = 'Mint',
  BURNS = 'Burn',
}

export const transactionInputSchema = z.object({
  chainId: z.string(),
  address: z.string().toLowerCase(),
  type: z.nativeEnum(TransactionType),
})

export type TransactionArgs = GetApiInputFromOutput<
  typeof transactionInputSchema['_input'],
  typeof transactionInputSchema['_output']
>

const transactionOutputSchema = z.object({
  chainId: z.number().int(),
  txHash: z.string(),
  amount0: z.string(),
  amount1: z.string(),
  amountUsd: z.number().nullable(),
  maker: z.string(),
  timestamp: z.number(),
})

export type Transaction = z.infer<typeof transactionOutputSchema>

export const transformTransaction = (input: Transaction) => {
  return input
}

export const processTransaction = (input: unknown) => {
  const parsed = transactionOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformTransaction(parsed.data) }
}
