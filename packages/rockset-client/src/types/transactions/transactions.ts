import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

export enum TransactionType {
  SWAPS = 'Swap',
  MINTS = 'Mint',
  BURNS = 'Burn',
}

export const transactionsInputSchema = z.object({
  id: cz.id(),
  type: z.nativeEnum(TransactionType),
})

export type TransactionsArgs = GetApiInputFromOutput<
  typeof transactionsInputSchema['_input'],
  typeof transactionsInputSchema['_output']
>
