import { z } from 'zod'
import { cz } from '../misc/zodObjects.js'

export const analyticTokenOutputSchema = z.object({
  token: cz.token(),
  price: z.number().nullable(),
  totalLiquidityUSD: z.number().catch(0),
  // totalVolumeUSD: z.number().catch(0),
  volumeUSD24h: z.number().catch(0),
})

export const transformAnalyticToken = (
  input: z.infer<typeof analyticTokenOutputSchema>,
) => {
  return input
}

export type AnalyticToken = ReturnType<typeof transformAnalyticToken>

export const processAnalyticToken = (input: unknown) => {
  const parsed = analyticTokenOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformAnalyticToken(parsed.data) }
}
