import { BigInt, log } from '@graphprotocol/graph-ts'

import { MasterChefV2Rewarder } from '../../generated/schema'
import { ConstructorCall, RewardRateUpdated } from '../../generated/templates/AlcxRewarder/AlcxRewarder'

export function constructor(call: ConstructorCall): void {
  log.info('AlcxRewarder constructor call _MASTERCHEF_V2: {}', [call.inputs._MASTERCHEF_V2.toString()])
}

export function rewardRateUpdated(event: RewardRateUpdated): void {
  log.info('AlcxRewarder: rewardRateUpdated oldRewardRate: {} newRewardRate: {}', [
    event.params.oldRate.toString(),
    event.params.newRate.toString(),
  ])
  const rewarder = MasterChefV2Rewarder.load(event.address.toHex()) as MasterChefV2Rewarder
  rewarder.rewardPerSecond = event.params.newRate
  rewarder.rewardPerBlock = event.params.newRate.times(BigInt.fromU32(13))
  rewarder.rewardPerDay = rewarder.rewardPerSecond.times(BigInt.fromU32(86400))
  rewarder.save()
}
