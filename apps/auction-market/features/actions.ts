import { Amount, Token } from '@sushiswap/currency'
import { Contract } from 'ethers'

interface Batch {
  contract: Contract
  actions: (string | undefined)[]
}

/**
 * Make sure provided contract has a batch function.
 * Calls action directly if provided array is of length 1, encode batch otherwise
 * @param contract should contain batch function
 * @param actions array of encoded function data
 */
export const batchAction = <T = any>({ contract, actions = [] }: Batch): string | undefined => {
  const validated = actions.filter(Boolean)
  if (validated.length === 0) throw new Error('No valid actions')

  // Call action directly to save gas
  if (validated.length === 1) {
    return validated[0]
  }

  // Call batch function with valid actions
  if (validated.length > 1) {
    return contract.interface.encodeFunctionData('batch', [validated, true])
  }
}


export interface UnwindTokenProps {
  contract: Contract
  token0: string
  token1: string
}

export const unwindTokenAction = ({
  contract,
  token0,
  token1
}: UnwindTokenProps): string => {
  return contract.interface.encodeFunctionData('unwindLP', [
    token0,
    token1
  ])
}


export interface StartBidActionProps {
  contract: Contract
  rewardTokenAddress: string
  amount: Amount<Token>
  to: string
}

export const startBidAction = ({
  contract,
  rewardTokenAddress,
  amount,
  to,
}: StartBidActionProps): string => {
  return contract.interface.encodeFunctionData('start', [
    rewardTokenAddress.toLowerCase(),
    amount.quotient.toString(),
    to.toLowerCase()
  ])
}



export interface EndAuctionProps {
  contract: Contract
  rewardTokenAddress: string
}

export const endAuctionAction = ({
  contract,
  rewardTokenAddress
}: EndAuctionProps): string => {
  return contract.interface.encodeFunctionData('end', [
    rewardTokenAddress.toLowerCase()
  ])
}
