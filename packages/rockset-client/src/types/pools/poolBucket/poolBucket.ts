import { z } from 'zod'

const poolBucketOutputSchema = z.object({
  feeApr: z.number(),
  feeUsd: z.number(),
  granularity: z.string(),
  id: z.string(),
  liquidityUsd: z.number(),
  timeBucket: z.string(),
  timestamp: z.number(),
  volumeUsd: z.number(),
})

export type PoolBucket = z.infer<typeof poolBucketOutputSchema>

export const transformPoolBucket = (input: PoolBucket) => {
  return input
}

export const processPoolBucket = (input: unknown) => {
  const parsed = poolBucketOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformPoolBucket(parsed.data) }
}
