import { z } from 'zod'
import type { GetApiInputFromOutput } from '../../misc/GetApiInputFromOutput.js'
import { cz } from '../../misc/zodObjects.js'

export enum PoolBucketGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const poolBucketsInputSchema = z.object({
  id: cz.id(),
  granularity: z.nativeEnum(PoolBucketGranularity),
})

export type PoolBucketsArgs = GetApiInputFromOutput<
  typeof poolBucketsInputSchema['_input'],
  typeof poolBucketsInputSchema['_output']
>
