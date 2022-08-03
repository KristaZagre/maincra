import { Address, BigInt, dataSource, log } from '@graphprotocol/graph-ts'

import { ERC20 as ERC20Contract } from '../generated/MasterChef/ERC20'
import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  HarvestFromMasterChefCall,
  LogInit,
  LogPoolAddition,
  LogSetPool,
  LogUpdatePool,
  MassUpdatePoolsCall,
  MasterChefV2 as MasterChefV2Contract,
  MigrateCall,
  OwnershipTransferred,
  SetMigratorCall,
  Withdraw,
} from '../generated/MasterChefV2/MasterChefV2'
import { SushiToken as SushiTokenContract } from '../generated/MasterChefV2/SushiToken'
import { MasterChefV2, MasterChefV2PoolInfo, MasterChefV2Rewarder, MasterChefV2UserInfo } from '../generated/schema'
function getMasterChefV2(): MasterChefV2 {
  let masterChefV2 = MasterChefV2.load(dataSource.address().toHex())

  if (masterChefV2 === null) {
    const contract = MasterChefV2Contract.bind(dataSource.address())
    masterChefV2 = new MasterChefV2(dataSource.address().toHex())
    masterChefV2.masterChef = contract.MASTER_CHEF().toHex()
    masterChefV2.sushi = contract.SUSHI()
    masterChefV2.masterPid = contract.MASTER_PID()
    masterChefV2.migrator = contract.migrator()
    masterChefV2.owner = contract.owner()
    masterChefV2.sushiPerBlock = BigInt.fromU32(10).pow(20)
    masterChefV2.sushiPerSecond = masterChefV2.sushiPerBlock.div(BigInt.fromU32(13))
    // userInfo ...
    // poolInfo ...
    masterChefV2.totalAllocPoint = contract.totalAllocPoint()
    masterChefV2.poolCount = BigInt.fromU32(0)
    masterChefV2.rewarderCount = BigInt.fromU32(0)
    masterChefV2.migrationCount = BigInt.fromU32(0)
    masterChefV2.balance = BigInt.fromU32(0)
    masterChefV2.save()
  }

  return masterChefV2 as MasterChefV2
}

function getPoolInfo(pid: BigInt): MasterChefV2PoolInfo {
  let poolInfo = MasterChefV2PoolInfo.load(pid.toString())

  if (poolInfo === null) {
    const masterChefV2Contract = MasterChefV2Contract.bind(dataSource.address())
    const poolInfoResult = masterChefV2Contract.poolInfo(pid)
    poolInfo = new MasterChefV2PoolInfo(pid.toString())
    const lpToken = masterChefV2Contract.lpToken(pid)
    poolInfo.lpToken = lpToken
    const erc20 = ERC20Contract.bind(lpToken)
    if (
      !erc20.try_name().reverted &&
      (erc20.try_name().value == 'SushiSwap LP Token' || erc20.try_name().value == 'Uniswap V2')
    ) {
      poolInfo.type = 'SUSHISWAP'
    } else if (!erc20.try_name().reverted && erc20.try_name().value == 'Sushi Constant Product LP Token') {
      poolInfo.type = 'TRIDENT'
    } else if (!erc20.try_name().reverted && erc20.try_name().value.startsWith('Kashi Medium Risk')) {
      poolInfo.type = 'KASHI'
    } else {
      poolInfo.type = 'UNKNOWN'
    }
    poolInfo.accSushiPerShare = poolInfoResult.getAccSushiPerShare()
    poolInfo.lastRewardBlock = poolInfoResult.getLastRewardBlock()
    poolInfo.allocPoint = poolInfoResult.getAllocPoint()
    poolInfo.save()
  }

  return poolInfo as MasterChefV2PoolInfo
}

function getUserInfo(pid: BigInt, user: Address): MasterChefV2UserInfo {
  let userInfo = MasterChefV2UserInfo.load(pid.toString().concat(user.toHex()))

  if (userInfo === null) {
    userInfo = new MasterChefV2UserInfo(pid.toString().concat(user.toHex()))
    userInfo.amount = BigInt.fromU32(0)
    userInfo.rewardDebt = BigInt.fromU32(0)
    userInfo.pid = pid
    userInfo.user = user
    userInfo.save()
  }

  return userInfo as MasterChefV2UserInfo
}

function getRewarder(address: Address): MasterChefV2Rewarder {
  let rewarder = MasterChefV2Rewarder.load(address.toHex())
  if (rewarder === null) {
    rewarder = new MasterChefV2Rewarder(address.toHex())
    rewarder.save()
  }
  return rewarder as MasterChefV2Rewarder
}

function _updatePool(pid: BigInt): MasterChefV2PoolInfo {
  log.info('_updatePool pid: {}', [pid.toString()])

  const masterChefContract = MasterChefV2Contract.bind(dataSource.address())
  const poolInfoResult = masterChefContract.poolInfo(pid)
  const poolInfo = getPoolInfo(pid)
  poolInfo.accSushiPerShare = poolInfoResult.getAccSushiPerShare()
  poolInfo.lastRewardBlock = poolInfoResult.getLastRewardBlock()
  poolInfo.save()

  return poolInfo
}

export function init(event: LogInit): void {
  log.info('Init MasterChefV2', [])
  const masterChefV2 = getMasterChefV2()
  const sushiTokenContract = SushiTokenContract.bind(Address.fromBytes(masterChefV2.sushi))
  masterChefV2.balance = sushiTokenContract.balanceOf(dataSource.address())
  masterChefV2.save()
}

export function add(event: LogPoolAddition): void {
  log.info('Add pool #{} allocPoint: {} lpToken: {} rewarder: {} ', [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.lpToken.toHex(),
    event.params.rewarder.toHex(),
  ])
  const masterChefV2 = getMasterChefV2()
  masterChefV2.totalAllocPoint = masterChefV2.totalAllocPoint.plus(event.params.allocPoint)
  masterChefV2.poolCount = masterChefV2.poolCount.plus(BigInt.fromU32(1))
  if (event.params.rewarder !== Address.fromString('0x0000000000000000000000000000000000000000')) {
    masterChefV2.rewarderCount = masterChefV2.rewarderCount.plus(BigInt.fromU32(1))
  }
  masterChefV2.save()

  const rewarder = new MasterChefV2Rewarder(event.params.rewarder.toHex())
  rewarder.save()

  const poolInfo = new MasterChefV2PoolInfo(event.params.pid.toString())
  poolInfo.lpToken = event.params.lpToken
  const erc20 = ERC20Contract.bind(event.params.lpToken)
  if (
    !erc20.try_name().reverted &&
    (erc20.try_name().value == 'SushiSwap LP Token' || erc20.try_name().value == 'Uniswap V2')
  ) {
    poolInfo.type = 'SUSHISWAP'
  } else if (!erc20.try_name().reverted && erc20.try_name().value == 'Sushi Constant Product LP Token') {
    poolInfo.type = 'TRIDENT'
  } else if (!erc20.try_name().reverted && erc20.try_name().value.startsWith('Kashi Medium Risk')) {
    poolInfo.type = 'KASHI'
  } else {
    poolInfo.type = 'UNKNOWN'
  }
  poolInfo.lastRewardBlock = event.block.number
  poolInfo.allocPoint = event.params.allocPoint
  poolInfo.accSushiPerShare = BigInt.fromU32(0)
  poolInfo.rewarder = rewarder.id
  poolInfo.balance = erc20.balanceOf(dataSource.address())
  poolInfo.save()
}

export function set(event: LogSetPool): void {
  log.info('Set pool #{} allocPoint: {} rewarder: {} overrite: {}', [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.rewarder.toHex(),
    event.params.overwrite.toString(),
  ])
  const masterChefV2 = getMasterChefV2()

  const poolInfo = getPoolInfo(event.params.pid)
  masterChefV2.totalAllocPoint = masterChefV2.totalAllocPoint.minus(poolInfo.allocPoint).plus(event.params.allocPoint)
  masterChefV2.save()

  if (event.params.overwrite) {
    const rewarder = getRewarder(event.params.rewarder)
    poolInfo.rewarder = rewarder.id
  }

  poolInfo.allocPoint = event.params.allocPoint
  poolInfo.save()
}

export function setMigrator(call: SetMigratorCall): void {
  const masterChef = getMasterChefV2()
  log.info('Set migrator from {} to {}', [masterChef.migrator.toHex(), call.inputs._migrator.toHex()])
  // const migrator = new MasterChefV2Migrator(call.inputs._migrator)
  // migrator.block = event.block.number
  // migrator.timestamp = event.block.timestamp
  // migrator.save()
  masterChef.migrator = call.inputs._migrator
  masterChef.save()
}

export function migrate(call: MigrateCall): void {
  //
}

export function massUpdatePools(call: MassUpdatePoolsCall): void {
  log.info('Mass update pools', [])
  for (let i = BigInt.fromU32(0), j = BigInt.fromU32(call.inputs.pids.length); i < j; i = i.plus(BigInt.fromU32(1))) {
    _updatePool(i)
  }
}

export function updatePool(event: LogUpdatePool): void {
  log.info('Update pool #{}', [event.params.pid.toString()])
  const pool = getPoolInfo(event.params.pid)
  pool.lastRewardBlock = event.params.lastRewardBlock
  pool.accSushiPerShare = event.params.accSushiPerShare
  pool.balance = event.params.lpSupply
  pool.save()
}

export function deposit(event: Deposit): void {
  log.info('User {} deposited {} to pool #{} for {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.params.to.toHex(),
  ])
  const pool = _updatePool(event.params.pid)

  const userInfo = getUserInfo(event.params.pid, event.params.to)
  userInfo.amount = userInfo.amount.plus(event.params.amount)
  userInfo.rewardDebt = userInfo.rewardDebt.plus(
    event.params.amount.times(pool.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  )
  userInfo.save()
}

export function withdraw(event: Withdraw): void {
  log.info('User {} withdrew {} from pool #{} to {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.params.to.toHex(),
  ])
  const pool = _updatePool(event.params.pid)

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = userInfo.amount.minus(event.params.amount)
  userInfo.rewardDebt = userInfo.rewardDebt.minus(
    event.params.amount.times(pool.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  )
  userInfo.save()
}

export function harvest(event: Harvest): void {
  log.info('User {} harvested {} from pool #{}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
  ])
  const pool = _updatePool(event.params.pid)

  const userInfo = getUserInfo(event.params.pid, event.params.user)

  userInfo.rewardDebt = event.params.amount
    .times(pool.accSushiPerShare)
    .div(BigInt.fromU32(10).pow(12))
    .minus(userInfo.rewardDebt)
  userInfo.save()
}

export function harvestFromMasterChef(call: HarvestFromMasterChefCall): void {
  log.info('Harvest from MasterChef', [])
  const masterChefV2 = getMasterChefV2()
  const sushiTokenContract = SushiTokenContract.bind(Address.fromBytes(masterChefV2.sushi))
  masterChefV2.balance = sushiTokenContract.balanceOf(dataSource.address())
  masterChefV2.save()
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info('User {} emergancy withdrew {} from pool #{} to {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.params.to.toHex(),
  ])

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = BigInt.fromU32(0)
  userInfo.rewardDebt = BigInt.fromU32(0)
  userInfo.save()

  const poolInfo = getPoolInfo(event.params.pid)
  poolInfo.balance = poolInfo.balance.minus(event.params.amount)
  poolInfo.save()
}

export function ownershipTransferred(event: OwnershipTransferred): void {
  log.info('Ownership transfered from {} to {}', [event.params.previousOwner.toHex(), event.params.newOwner.toHex()])
  // const owner = new MasterChefV2Owner(event.params.newOwner.toHex())
  // owner.block = event.block.number
  // owner.timestamp = event.block.timestamp
  // owner.save()

  const masterChefV2 = getMasterChefV2()
  masterChefV2.owner = event.params.newOwner
  masterChefV2.save()
}
