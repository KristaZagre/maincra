import { BigInt, log } from '@graphprotocol/graph-ts'

import { ConvexRewarder, RewardAdded } from '../../generated/MasterChefV2/ConvexRewarder'
import { MasterChefV2Rewarder } from '../../generated/schema'

export function rewardAdded(event: RewardAdded): void {
  log.info('ConvexRewarder harvestFromMasterChef', [])
  const rewarder = MasterChefV2Rewarder.load(event.address.toHex()) as MasterChefV2Rewarder
  const convexRewarderContract = ConvexRewarder.bind(event.address)
  const rewardRate = convexRewarderContract.rewardRate()
  rewarder.rewardPerSecond = rewardRate
  rewarder.rewardPerBlock = rewardRate.times(BigInt.fromU32(13))
  rewarder.rewardPerDay = rewarder.rewardPerSecond.times(BigInt.fromU32(86400))
  rewarder.save()
}
