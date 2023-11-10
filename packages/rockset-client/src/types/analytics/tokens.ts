import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

export const analyticTokensInputSchema = z.object({
  chainIds: cz
    .commaArray()
    .transform((chainIds) => chainIds.map((v) => parseInt(v)))
    .optional(),
})

export type AnalyticTokensArgs = GetApiInputFromOutput<
  typeof analyticTokensInputSchema['_input'],
  typeof analyticTokensInputSchema['_output']
>
