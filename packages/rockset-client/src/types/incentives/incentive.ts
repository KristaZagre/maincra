import { z } from 'zod'
import { cz } from '../misc/zodObjects.js'

export enum IncentiveType {
  MERKL = 'merkl',
}

export const incentiveOutputSchema = z.object({
  id: cz.incentiveId(),
  chainId: cz.chainId(),
  poolId: cz.id(),
  apr: z.number(),
  amount: z.number(),
  rewardPerDay: z.number(),
  rewardToken: cz.token(),
  type: z.string().transform((type) => type as IncentiveType),
})

export const transformIncentive = (input: typeof incentiveOutputSchema['_output']) => {
  return input
}

export type Incentive = ReturnType<typeof transformIncentive>

export const processIncentive = (input: unknown) => {
  const parsed = incentiveOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformIncentive(parsed.data) }
}
