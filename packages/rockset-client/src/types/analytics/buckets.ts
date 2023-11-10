import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

export enum AnalyticsBucketGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const bucketsInputSchema = z.object({
  granularity: z.nativeEnum(AnalyticsBucketGranularity),
  chainIds: cz
    .commaArray()
    .transform((chainIds) => chainIds.map((v) => parseInt(v)))
    .optional(),
})

export type BucketsArgs = GetApiInputFromOutput<
  typeof bucketsInputSchema['_input'],
  typeof bucketsInputSchema['_output']
>
