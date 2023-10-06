import { z } from 'zod'

export const simplePoolSchema = z.object({
  id: z.string(),
  chainId: z.number().int(),
  name: z.string(),
  address: z.string(),
  fee: z.number(),
  last1DFeeApr: z.number().catch(0),
  last1DFeeUsd: z.number().catch(0),
  last1DVolumeUsd: z.number().catch(0),
  last30DVolumeUsd: z.number().catch(0),
  last7DVolumeUsd: z.number().catch(0),
  liquidityUsd: z.number().catch(0),
  protocol: z.string(),
  token0Id: z.string(),
  token0Name: z.string(),
  token0Address: z.string(),
  token0Decimals: z.number().int(),
  token0Symbol: z.string(),
  token1Id: z.string(),
  token1Name: z.string(),
  token1Address: z.string(),
  token1Decimals: z.number().int(),
  token1Symbol: z.string(),
})

const poolSchema = z.object({
  id: z.string(),
  chainId: z.number().int(),
  blockNumber: z.number().int(),
  _name: z.string(),
  address: z.string(),
  fee: z.number(),
  feeUsd: z.number().nullable(),
  isWhitelisted: z.boolean().nullable(),
  last1DFeeApr: z.number().nullable(),
  last1DFeeChangeUsd: z.number().nullable(),
  last1DFeeUsd: z.number().nullable(),
  last1DLiquidityUsd: z.number().nullable(),
  last1DLiquidityChangePercent: z.number().nullable(),
  last1DVolumeChangeUsd: z.number().nullable(),
  last1DVolumeChangePercent: z.number().nullable(),
  last1DTxCountChangePercent: z.number().nullable(),
  last1DTxCount: z.number().nullable(),
  last1DVolumeUsd: z.number().nullable(),
  last1HFeeApr: z.number().nullable(),
  last1HFeeChangeUsd: z.number().nullable(),
  last1HFeeUsd: z.number().nullable(),
  last1HLiquidityUsd: z.number().nullable(),
  last1HTxCount: z.number().nullable(),
  last1HVolumeUsd: z.number().nullable(),
  last30DFeeApr: z.number().nullable(),
  last30DFeeAprChange: z.number().nullable(),
  last30DFeeAprChangePercent: z.number().nullable(),
  last30DFeeChangePercent: z.number().nullable(),
  last30DFeeChangeUsd: z.number().nullable(),
  last30DFeeUsd: z.number().nullable(),
  last30DLiquidityChangePercent: z.number().nullable(),
  last30DLiquidityChangeUsd: z.number().nullable(),
  last30DLiquidityUsd: z.number().nullable(),
  last30DTxCount: z.number().nullable(),
  last30DTxCountChange: z.number().nullable(),
  last30DTxCountChangePercent: z.number().nullable(),
  last30DVolumeChangePercent: z.number().nullable(),
  last30DVolumeChangeUsd: z.number().nullable(),
  last30DVolumeUsd: z.number().nullable(),
  last7DFeeApr: z.number().nullable(),
  last7DFeeChangePercent: z.number().nullable(),
  last7DFeeChangeUsd: z.number().nullable(),
  last7DFeeUsd: z.number().nullable(),
  last7DLiquidityUsd: z.number().nullable(),
  last7DTxCount: z.number().nullable(),
  last7DTxCountChange: z.number().nullable(),
  last7DTxCountChangePercent: z.number().nullable(),
  last7DVolumeChangePercent: z.number().nullable(),
  last7DVolumeChangeUsd: z.number().nullable(),
  last7DVolumeUsd: z.number().nullable(),
  liquidity: z.string().nullable(),
  liquidityUsd: z.number().nullable(),
  protocol: z.string(),
  reserve0: z.number(),
  reserve0Usd: z.number().nullable(),
  reserve1: z.number(),
  reserve1Usd: z.number().nullable(),
  sqrtPriceX96: z.string().nullable(),
  tick: z.nullable(z.number()),
  feeGrowthGlobal0X128: z.string().nullable(),
  feeGrowthGlobal1X128: z.string().nullable(),
  txCount: z.number(),
  volumeToken0: z.string(),
  volumeToken0Usd: z.number().nullable(),
  volumeToken1: z.string(),
  volumeToken1Usd: z.number().nullable(),
  volumeUsd: z.number().nullable(),
  token0Id: z.string(),
  token0Name: z.string(),
  token0Address: z.string(),
  token0Decimals: z.number().int(),
  token0Symbol: z.string(),
  token1Id: z.string(),
  token1Name: z.string(),
  token1Address: z.string(),
  token1Decimals: z.number().int(),
  token1Symbol: z.string(),
  token0Price: z.number(),
  token1Price: z.number(),
})

const poolBucketSchema = z.object({
  feeApr: z.number(),
  feeUsd: z.number(),
  granularity: z.string(),
  id: z.string(),
  liquidityUsd: z.number(),
  timeBucket: z.string(),
  timestamp: z.number(),
  volumeUsd: z.number(),
})

const transactionSchema = z.object({
  chainId: z.number().int(),
  txHash: z.string(),
  amount0: z.string(),
  amount1: z.string(),
  amountUsd: z.number().nullable(),
  maker: z.string(),
  timestamp: z.number(),
})

export type SimplePool = Required<z.infer<typeof simplePoolSchema>>
export type Pool = Required<z.infer<typeof poolSchema>>
export type PoolBucket = Required<z.infer<typeof poolBucketSchema>>
export type Transaction = Required<z.infer<typeof transactionSchema>>

export const validateSimplePool = (inputs: unknown) => {
  return simplePoolSchema.safeParse(inputs)
}

export const validatePool = (inputs: unknown) => {
  return poolSchema.safeParse(inputs)
}

export const validatePoolBucket = (inputs: unknown) => {
  return poolBucketSchema.safeParse(inputs)
}

export const validateTransaction = (inputs: unknown) => {
  return transactionSchema.safeParse(inputs)
}
