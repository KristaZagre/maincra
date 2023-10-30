import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'

export const poolBucketOutputSchema = z.object({
  id: cz.id(),
  feeApr: z.number().nullable(),
  feeUSD: z.number().nullable(),
  granularity: z.string(),
  liquidityUSD: z.number().nullable(),
  timeBucket: z.string(),
  timestamp: z.number(),
  volumeUSD: z.number().nullable(),
})

export const transformPoolBucket = (
  input: z.infer<typeof poolBucketOutputSchema>,
) => {
  return input
}

export type PoolBucket = ReturnType<typeof transformPoolBucket>

export const processPoolBucket = (input: unknown) => {
  const parsed = poolBucketOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformPoolBucket(parsed.data) }
}
