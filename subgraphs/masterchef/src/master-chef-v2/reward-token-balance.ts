import { BigInt } from '@graphprotocol/graph-ts'

import { MasterChefV2Rewarder, MasterChefV2RewardTokenBalance } from '../../generated/schema'
import { Transfer as TransferEvent } from '../../generated/templates/MasterChefV2SushiTokenBalance/ERC20'

export function transfer(event: TransferEvent): void {
  const toRewarder = !MasterChefV2Rewarder.load(event.params.to.toHex())
  const fromRewarder = !MasterChefV2Rewarder.load(event.params.from.toHex())
  if (!toRewarder && fromRewarder) return

  let rewardTokenBalance = MasterChefV2RewardTokenBalance.load(event.address.toHex())

  if (rewardTokenBalance === null) {
    rewardTokenBalance = new MasterChefV2RewardTokenBalance(event.address.toHex())
    rewardTokenBalance.amount = BigInt.fromU32(0)
  }

  if (toRewarder) {
    rewardTokenBalance.amount = rewardTokenBalance.amount.plus(event.params.value)
  } else if (fromRewarder) {
    rewardTokenBalance.amount = rewardTokenBalance.amount.minus(event.params.value)
  }
  rewardTokenBalance.save()
}
