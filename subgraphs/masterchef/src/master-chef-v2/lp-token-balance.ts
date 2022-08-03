import { Address, BigInt } from '@graphprotocol/graph-ts'

import { MasterChefV2LpTokenBalance } from '../../generated/schema'
import { Transfer as TransferEvent } from '../../generated/templates/MasterChefV2LpTokenBalance/ERC20'

const MASTER_CHEF_ADDRESS = Address.fromString('0xef0881ec094552b2e128cf945ef17a6752b4ec5d')

export function transfer(event: TransferEvent): void {
  if (event.params.to != MASTER_CHEF_ADDRESS && event.params.from != MASTER_CHEF_ADDRESS) return

  let lpToken = MasterChefV2LpTokenBalance.load(event.address.toHex())

  if (lpToken === null) {
    lpToken = new MasterChefV2LpTokenBalance(event.address.toHex())
    lpToken.amount = BigInt.fromU32(0)
    lpToken.lastAmount = BigInt.fromU32(0)
    lpToken.block = event.block.number
    lpToken.lastBlock = event.block.number
  }

  if (event.params.to == MASTER_CHEF_ADDRESS) {
    if (lpToken.block != event.block.number) {
      lpToken.lastAmount = lpToken.amount
      lpToken.lastBlock = lpToken.block
    }
    lpToken.amount = lpToken.amount.plus(event.params.value)
    lpToken.block = event.block.number
  } else if (event.params.from == MASTER_CHEF_ADDRESS) {
    if (lpToken.block != event.block.number) {
      lpToken.lastAmount = lpToken.amount
      lpToken.lastBlock = lpToken.block
    }
    lpToken.amount = lpToken.amount.minus(event.params.value)
    lpToken.block = event.block.number
  }
  lpToken.save()
}
