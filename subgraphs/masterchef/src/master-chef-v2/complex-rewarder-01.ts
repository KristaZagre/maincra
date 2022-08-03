import { BigInt, log } from '@graphprotocol/graph-ts'

import { MasterChefV2Rewarder } from '../../generated/schema'
import {
  OnReward,
  PoolAdded,
  PoolSet,
  PoolUpdated,
  RewardRateUpdated,
} from '../../generated/templates/ComplexRewarder01/ComplexRewarder01'

export function rewardRateUpdated(event: RewardRateUpdated): void {
  log.info('Complex Rewarder 01: oldRate: {} newRate: {}', [
    event.params.oldRate.toString(),
    event.params.newRate.toString(),
  ])
  const rewarder = MasterChefV2Rewarder.load(event.address.toHex()) as MasterChefV2Rewarder
  rewarder.rewardPerSecond = event.params.newRate.div(BigInt.fromU32(13))
  rewarder.rewardPerBlock = event.params.newRate
  rewarder.rewardPerDay = rewarder.rewardPerSecond.times(BigInt.fromU32(86400))
  rewarder.save()
}

export function poolAdded(event: PoolAdded): void {
  //
}

export function poolSet(event: PoolSet): void {
  //
}

export function poolUpdated(event: PoolUpdated): void {
  //
}

export function onReward(event: OnReward): void {
  //
}
