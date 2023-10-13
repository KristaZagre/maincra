import { z } from 'zod'
import { type BasePoolsArgs, basePoolsInputSchema } from '../basePools.js'

export const poolsCountInputSchema = basePoolsInputSchema

export type PoolsCountArgs = BasePoolsArgs

export const poolsCountOutputSchema = z.object({
  count: z.number().int(),
})

export type PoolsCount = z.infer<typeof poolsCountOutputSchema>

export const tranformPoolsCount = (input: PoolsCount) => {
  return input
}

export const processPoolsCount = (input: unknown) => {
  const parsed = poolsCountOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: tranformPoolsCount(parsed.data) }
}
