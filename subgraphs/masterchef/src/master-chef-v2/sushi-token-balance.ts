import { Address, BigInt } from '@graphprotocol/graph-ts'

import { MasterChefV2SushiTokenBalance } from '../../generated/schema'
import { Transfer as TransferEvent } from '../../generated/templates/MasterChefV2SushiTokenBalance/ERC20'

const MASTER_CHEF_ADDRESS = Address.fromString('0xef0881ec094552b2e128cf945ef17a6752b4ec5d')

export function transfer(event: TransferEvent): void {
  if (event.params.to != MASTER_CHEF_ADDRESS && event.params.from != MASTER_CHEF_ADDRESS) return

  let sushiTokenBalance = MasterChefV2SushiTokenBalance.load(event.address.toHex())

  if (sushiTokenBalance === null) {
    sushiTokenBalance = new MasterChefV2SushiTokenBalance(event.address.toHex())
    sushiTokenBalance.amount = BigInt.fromU32(0)
  }

  if (event.params.to == MASTER_CHEF_ADDRESS) {
    sushiTokenBalance.amount = sushiTokenBalance.amount.plus(event.params.value)
  } else if (event.params.from == MASTER_CHEF_ADDRESS) {
    sushiTokenBalance.amount = sushiTokenBalance.amount.minus(event.params.value)
  }
  sushiTokenBalance.save()
}
