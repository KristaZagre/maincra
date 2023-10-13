import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'

export enum PoolBucketGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const poolBucketInputSchema = z.object({
  id: cz.id(),
  granularity: z.nativeEnum(PoolBucketGranularity),
})

export const poolBucketOutputSchema = z.object({
  id: cz.id(),
  feeApr: z.number(),
  feeUsd: z.number(),
  granularity: z.string(),
  liquidityUsd: z.number(),
  timeBucket: z.string(),
  timestamp: z.number(),
  volumeUsd: z.number(),
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
