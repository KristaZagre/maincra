import { z } from 'zod'
  
export const PoolSchema = z.object({
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
  });

export type Pool = z.infer<typeof PoolSchema>;
  
export const validatePool = (inputs: unknown) => {
    const isValidData = PoolSchema.parse(inputs);
    return isValidData;
  };