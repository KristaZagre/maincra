import { z } from 'zod'
import { cz } from '../misc/zodObjects.js'

export enum SteerStrategy {
  DeltaNeutralStables = 'DeltaNeutralStables',
  ElasticExpansion = 'ElasticExpansion',
  MovingVolatilityChannel = 'MovingVolatilityChannel',
  MovingVolatilityChannelMedium = 'MovingVolatilityChannelMedium',
  HighLowChannel = 'HighLowChannel',
  StaticStable = 'StaticStable',
  ClassicRebalance = 'ClassicRebalance',
  ChannelMultiplier = 'ChannelMultiplier',
  PriceMultiplier = 'PriceMultiplier',
  FixedPercentage = 'FixedPercentage',
  KeltnerAlgo = 'KeltnerAlgo',
  BollingerAlgo = 'BollingerAlgo',
}

export enum VaultState {
  PendingApproval = 'PendingApproval',
  PendingThreshold = 'PendingThreshold',
  Paused = 'Paused',
  Active = 'Active',
  Retired = 'Retired',
}

export const vaultOutputSchema = z.object({
  id: cz.id(),
  address: z.string().default(''),
  chainId: z.number().int().default(69),

  pool: cz.id(),
  poolId: z.string(),
  feeTier: z.number(),

  apr: z.number(),
  apr1w: z.number(),
  apr1d: z.number(),
  apr1m: z.number(),
  apr1y: z.number(),

  token0: cz.token(),
  token0Id: z.string(),
  reserve0: z.string(),
  reserve0USD: z.number().default(0),
  fees0: z.string(),
  fees0USD: z.number().default(0),

  token1: cz.token(),
  token1Id: z.string(),
  reserve1: z.string(),
  reserve1USD: z.number().default(0),
  fees1: z.string(),
  fees1USD: z.number().default(0),

  reserveUSD: z.number().default(0),
  feesUSD: z.number().default(0),

  strategy: z.string().transform((type) => type as SteerStrategy),
  payloadHash: z.string(),
  description: z.string(),
  state: z.string().transform((state) => state as VaultState),

  performanceFee: z.number(),

  lowerTick: z.number().int(),
  upperTick: z.number().int(),

  adjustmentFrequency: z.number().int(),
  lastAdjustmentTimestamp: z.number().int(),

  isEnabled: z.boolean().default(false),
  wasEnabled: z.boolean().default(false),

  creator: z.string(),
  admin: z.string(),
  manager: z.string(),

  generatedAt: z.date(),
  updatedAt: z.date().refine((date) => !isNaN(date.getTime()), {
    message: 'Invalid date',
  }),
});


export const transformVault = (input: typeof vaultOutputSchema['_output']) => {
  return input
}

export type Vault = ReturnType<typeof transformVault>

export const processVault = (input: unknown) => {
  const parsed = vaultOutputSchema.safeParse(input)

  if (parsed.success === false) {
    return parsed
  }

  return { success: true as const, data: transformVault(parsed.data) }
}
