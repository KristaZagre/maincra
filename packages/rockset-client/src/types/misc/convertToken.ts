import type { Address } from 'viem'
import type { z } from 'zod'
import type { cz } from './zodObjects.js'

type Token0 = {
  token0Id: z.infer<ReturnType<typeof cz.id>>
  token0Name: string
  token0Symbol: string
  token0Address?: z.infer<ReturnType<typeof cz.address>>
  token0Decimals: number
}

type Token1 = {
  token1Id: z.infer<ReturnType<typeof cz.id>>
  token1Name: string
  token1Symbol: string
  token1Address?: z.infer<ReturnType<typeof cz.address>>
  token1Decimals: number
}

interface ProcessTokenArgs<T extends 0 | 1> {
  no: T
  obj: T extends '0' ? Token0 : Token1
}

type Token = {
  id: z.infer<ReturnType<typeof cz.id>>
  chainId: number
  address: z.infer<ReturnType<typeof cz.address>>
  name: string
  symbol: string
  decimals: number
}

export const convertToken = <T extends 0 | 1>({
  no,
  obj,
}: ProcessTokenArgs<T>): Token => {
  const rObj = obj as Token0 & Token1

  const [chainId, address] = rObj[`token${no}Id`].split(':') as [
    string,
    Address,
  ]

  return {
    id: rObj[`token${no}Id`],
    chainId: Number(chainId),
    address: rObj[`token${no}Address`] || address,
    name: rObj[`token${no}Name`],
    symbol: rObj[`token${no}Symbol`],
    decimals: rObj[`token${no}Decimals`],
  }
}
