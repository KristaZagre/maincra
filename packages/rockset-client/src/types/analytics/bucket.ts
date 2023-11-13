import { z } from 'zod'

export const bucketOutputSchema = z.object({
  granularity: z.string(),
  liquidityUSD: z.number().nullable(),
  timeBucket: z.string(),
  timestamp: z.number(),
  volumeUSD: z.number().nullable(),
})

export const transformBucket = (input: z.infer<typeof bucketOutputSchema>) => {
  return input
}

export type AnalyticBucket = ReturnType<typeof transformBucket>

export const processBucket = (input: unknown) => {
  const parsed = bucketOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformBucket(parsed.data) }
}
