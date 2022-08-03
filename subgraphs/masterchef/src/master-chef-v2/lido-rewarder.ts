import { BigInt, log } from '@graphprotocol/graph-ts'

import { MasterChefV2Rewarder } from '../../generated/schema'
import { LidoRewarder as LidoRewarderContract, RewardAdded } from '../../generated/templates/LidoRewarder/LidoRewarder'

export function rewardAdded(event: RewardAdded): void {
  log.info('LidoRewarder: rewardAdded {}', [event.params.reward.toHex()])
  const lidoRewarderContract = LidoRewarderContract.bind(event.address)
  const rewarder = MasterChefV2Rewarder.load(event.address.toHex()) as MasterChefV2Rewarder
  rewarder.rewardPerSecond = lidoRewarderContract.rewardPerSecond()
  rewarder.rewardPerBlock = rewarder.rewardPerSecond.times(BigInt.fromU32(13))
  rewarder.rewardPerDay = rewarder.rewardPerSecond.times(BigInt.fromU32(86400))
  rewarder.save()
}
