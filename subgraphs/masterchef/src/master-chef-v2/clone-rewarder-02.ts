import { BigInt, log } from '@graphprotocol/graph-ts'

import { MasterChefV2Rewarder } from '../../generated/schema'
import { LogRewardPerSecond } from '../../generated/templates/CloneRewarder02/CloneRewarder02'

export function rewardPerSecond(event: LogRewardPerSecond): void {
  log.info('Clone Rewarder 02: rewardPerSecond {}', [event.params.rewardPerSecond.toString()])
  const rewarder = MasterChefV2Rewarder.load(event.address.toHex()) as MasterChefV2Rewarder
  rewarder.rewardPerSecond = event.params.rewardPerSecond
  rewarder.rewardPerBlock = event.params.rewardPerSecond.times(BigInt.fromU32(13))
  rewarder.rewardPerDay = rewarder.rewardPerSecond.times(BigInt.fromU32(86400))
  rewarder.save()
}
