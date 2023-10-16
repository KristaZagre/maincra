import { z } from 'zod'
import { convertToken } from '../../misc/convertToken.js'
import { cz } from '../../misc/zodObjects.js'

export const simplePoolOutputSchema = z
  .object({
    id: cz.id(),
    chainId: z.number().int(),
    name: z.string(),
    address: cz.address(),
    fee: z.number(),
    last1DFeeApr: z.number().catch(0),
    last1DFeeUsd: z.number().catch(0),
    last1DVolumeUsd: z.number().catch(0),
    last30DVolumeUsd: z.number().catch(0),
    last7DVolumeUsd: z.number().catch(0),
    liquidity: z.string().nullable().default('0'),
    liquidityUsd: z.number().catch(0),
    protocol: z.string(),
  })
  .merge(cz.token0())
  .merge(cz.token1())

export const transformSimplePool = (
  input: z.infer<typeof simplePoolOutputSchema>,
) => {
  return {
    ...input,
    token0: convertToken({ no: 0, obj: input }),
    token1: convertToken({ no: 1, obj: input }),
  }
}

export type SimplePool = ReturnType<typeof transformSimplePool>

export const processSimplePool = (input: unknown) => {
  const parsed = simplePoolOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformSimplePool(parsed.data) }
}
