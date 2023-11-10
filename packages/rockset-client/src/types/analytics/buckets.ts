import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

export enum AnalyticsBucketGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const analyticBucketsInputSchema = z.object({
  granularity: z.nativeEnum(AnalyticsBucketGranularity),
  chainIds: cz
    .commaArray()
    .transform((chainIds) => chainIds.map((v) => parseInt(v)))
    .optional(),
})

export type AnalyticBucketsArgs = GetApiInputFromOutput<
  typeof analyticBucketsInputSchema['_input'],
  typeof analyticBucketsInputSchema['_output']
>
