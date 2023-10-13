import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

enum TransactionType {
  SWAPS = 'Swap',
  MINTS = 'Mint',
  BURNS = 'Burn',
}

export const transactionInputSchema = z.object({
  id: cz.id(),
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
