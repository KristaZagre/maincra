import { Address, BigInt, dataSource, log, ethereum } from '@graphprotocol/graph-ts'

import { ERC20 as ERC20Contract } from '../generated/MasterChef/ERC20'
import {
  AddCall,
  Deposit,
  DevCall,
  EmergencyWithdraw,
  MassUpdatePoolsCall,
  MasterChef,
  MasterChef as MasterChefContract,
  MigrateCall,
  OwnershipTransferred,
  SetCall,
  SetMigratorCall,
  UpdatePoolCall,
  Withdraw,
} from '../generated/MasterChef/MasterChef'
import {
  MasterChefV1,
  MasterChefV1Migration,
  MasterChefV1Migrator,
  MasterChefV1Owner,
  MasterChefV1PoolInfo,
  MasterChefV1UserInfo,
} from '../generated/schema'

const MASTER_CHEF_ADDRESS = Address.fromString('0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd')

const MULTICALL_ADDRESS = Address.fromString('0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441')

const AVERAGE_BLOCK_TIME = BigInt.fromU32(13)

function getMasterChef(): MasterChefV1 {
  let masterChef = MasterChefV1.load(MASTER_CHEF_ADDRESS.toHex())

  if (masterChef === null) {
    const contract = MasterChefContract.bind(MASTER_CHEF_ADDRESS)
    masterChef = new MasterChefV1(MASTER_CHEF_ADDRESS.toHex())
    masterChef.sushi = contract.sushi()
    masterChef.devaddr = contract.devaddr()
    masterChef.bonusEndBlock = contract.bonusEndBlock()
    masterChef.sushiPerBlock = contract.sushiPerBlock()
    masterChef.sushiPerSecond = masterChef.sushiPerBlock.div(AVERAGE_BLOCK_TIME)
    masterChef.bonusMultiplier = contract.BONUS_MULTIPLIER()
    masterChef.migrator = contract.migrator()
    masterChef.owner = contract.owner()
    // userInfo ...
    // poolInfo ...
    masterChef.totalAllocPoint = contract.totalAllocPoint()
    masterChef.startBlock = contract.startBlock()
    masterChef.poolCount = BigInt.fromU32(0)
    masterChef.migrationCount = BigInt.fromU32(0)
    masterChef.save()
  }

  return masterChef as MasterChefV1
}

function getPoolInfo(pid: BigInt): MasterChefV1PoolInfo {
  let poolInfo = MasterChefV1PoolInfo.load(pid.toString())

  if (poolInfo === null) {
    const masterChefContract = MasterChefContract.bind(dataSource.address())
    const poolInfoResult = masterChefContract.poolInfo(pid)
    poolInfo = new MasterChefV1PoolInfo(pid.toString())
    const lpToken = poolInfoResult.getLpToken()
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
    let tryBalance = erc20.try_balanceOf(MASTER_CHEF_ADDRESS)
    poolInfo.balance = !tryBalance.reverted ? tryBalance.value : BigInt.fromU32(0)
    poolInfo.save()
  }

  return poolInfo as MasterChefV1PoolInfo
}

function getUserInfo(pid: BigInt, user: Address): MasterChefV1UserInfo {
  let userInfo = MasterChefV1UserInfo.load(pid.toString().concat(user.toHex()))

  if (userInfo === null) {
    userInfo = new MasterChefV1UserInfo(pid.toString().concat(user.toHex()))
    userInfo.amount = BigInt.fromU32(0)
    userInfo.rewardDebt = BigInt.fromU32(0)
    userInfo.pid = pid
    userInfo.user = user
    userInfo.save()
  }

  return userInfo as MasterChefV1UserInfo
}

function _updatePool(pid: BigInt, blockNumber: BigInt): void {
  const poolInfo = getPoolInfo(pid)

  const masterChef = getMasterChef()
  const erc20 = ERC20Contract.bind(Address.fromBytes(poolInfo.lpToken))
  let tryLpSupply = erc20.try_balanceOf(MASTER_CHEF_ADDRESS)
  const lpSupply = !tryLpSupply.reverted ? tryLpSupply.value : BigInt.fromU32(0)

  if (blockNumber.le(poolInfo.lastRewardBlock)) {
    return
  }

  if (poolInfo.balance.isZero()) {
    poolInfo.lastRewardBlock = blockNumber
    poolInfo.save()
    return
  }


  const multiplier = getMultiplier(masterChef, poolInfo.lastRewardBlock, blockNumber)
  const sushiReward = multiplier
    .times(masterChef.sushiPerBlock)
    .times(poolInfo.allocPoint)
    .div(masterChef.totalAllocPoint)
  poolInfo.accSushiPerShare = poolInfo.accSushiPerShare.plus(
    sushiReward.times(BigInt.fromU32(10).pow(12)).div(lpSupply)
  )
  
  poolInfo.lastRewardBlock = blockNumber
  poolInfo.save()
}

function _massUpdatePools(blockNumber: BigInt): void {
  const masterChef = getMasterChef()
  log.debug('massUpdatePools {}', [masterChef.poolCount.toString()])
  for (let i = BigInt.fromU32(0), j = masterChef.poolCount; i < j; i = i.plus(BigInt.fromU32(1))) {
    _updatePool(i, blockNumber)
  }
}

function getMultiplier(masterChef: MasterChefV1, from: BigInt, to: BigInt): BigInt {
  if (to.le(masterChef.bonusEndBlock)) {
    return to.minus(from).times(masterChef.bonusMultiplier)
  } else if (from.gt(masterChef.bonusEndBlock)) {
    return to.minus(from)
  } else {
    return masterChef.bonusEndBlock
      .minus(from)
      .times(masterChef.bonusMultiplier)
      .plus(to.minus(masterChef.bonusEndBlock))
  }
}

export function add(call: AddCall): void {
  const masterChef = getMasterChef()

  log.info('Add pool #{} allocPoint: {} lpToken: {} withUpdate: {}', [
    masterChef.poolCount.toString(),
    call.inputs._allocPoint.toString(),
    call.inputs._lpToken.toHex(),
    call.inputs._withUpdate.toString(),
  ])

  if (call.inputs._withUpdate) {
    _massUpdatePools(call.block.number)
  }

  const poolInfo = getPoolInfo(masterChef.poolCount)

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(call.inputs._allocPoint)
  masterChef.poolCount = masterChef.poolCount.plus(BigInt.fromU32(1))
  masterChef.save()
}

export function set(call: SetCall): void {
  const masterChef = getMasterChef()
  log.info('Set pool #{} allocPoint: {} withUpdate: {}', [
    call.inputs._pid.toString(),
    call.inputs._allocPoint.toString(),
    call.inputs._withUpdate.toString(),
  ])

  if (call.inputs._withUpdate) {
    _massUpdatePools(call.block.number)
  }

  const poolInfo = getPoolInfo(call.inputs._pid)
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.minus(poolInfo.allocPoint).plus(call.inputs._allocPoint)
  masterChef.save()

  poolInfo.allocPoint = call.inputs._allocPoint
  poolInfo.save()
}

export function setMigrator(call: SetMigratorCall): void {
  const migrator = new MasterChefV1Migrator(call.inputs._migrator.toHex())
  migrator.block = call.block.number
  migrator.timestamp = call.block.timestamp
  migrator.save()

  const masterChef = getMasterChef()
  log.info('Set migrator from {} to {}', [masterChef.migrator.toHex(), call.inputs._migrator.toHex()])
  masterChef.migrator = call.inputs._migrator
  masterChef.save()
}

export function migrate(call: MigrateCall): void {
  const masterChef = getMasterChef()
  const masterChefContract = MasterChefContract.bind(MASTER_CHEF_ADDRESS)

  const poolInfo = getPoolInfo(call.inputs._pid)

  const migration = new MasterChefV1Migration(masterChef.migrationCount.toString())
  migration.previousLpToken = poolInfo.lpToken
  migration.previousBalance = poolInfo.balance
  const newLpToken = masterChefContract.poolInfo(call.inputs._pid).getLpToken()
  const lpTokenContract = ERC20Contract.bind(newLpToken)
  const newBalance = lpTokenContract.balanceOf(MASTER_CHEF_ADDRESS)
  migration.newLpToken = newLpToken
  migration.newBalance = newBalance
  migration.save()

  poolInfo.lpToken = newLpToken
  poolInfo.balance = newBalance
  poolInfo.save()

  masterChef.migrationCount = masterChef.migrationCount.plus(BigInt.fromU32(1))
  masterChef.save()
}

export function massUpdatePools(call: MassUpdatePoolsCall): void {
  log.info('Mass update pools block: {}', [call.block.number.toString()])
  _massUpdatePools(call.block.number)
}

export function updatePool(call: UpdatePoolCall): void {
  log.info('Update pool #{} block: {}', [call.inputs._pid.toString(), call.block.number.toString()])
  _updatePool(call.inputs._pid, call.block.number)
}

export function dev(call: DevCall): void {
  const masterChef = getMasterChef()
  log.info('Dev address changed from {} to {}', [masterChef.devaddr.toHex(), call.inputs._devaddr.toHex()])
  masterChef.devaddr = call.inputs._devaddr
  masterChef.save()
}

export function deposit(event: Deposit): void {
  log.info('User {} deposited {} to pool #{}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
  ])

  const poolInfo = getPoolInfo(event.params.pid)
  poolInfo.balance = poolInfo.balance.plus(event.params.amount)
  poolInfo.save()

  _updatePool(event.params.pid, event.block.number)

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = userInfo.amount.plus(event.params.amount)
  userInfo.rewardDebt = userInfo.amount.times(poolInfo.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  userInfo.save()
}

export function withdraw(event: Withdraw): void {
  log.info('User {} withdrew {} from pool #{}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
  ])

  const poolInfo = getPoolInfo(event.params.pid)
  poolInfo.balance = poolInfo.balance.minus(event.params.amount)
  poolInfo.save()

  _updatePool(event.params.pid, event.block.number)

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = userInfo.amount.minus(event.params.amount)
  userInfo.rewardDebt = userInfo.amount.times(poolInfo.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  userInfo.save()
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info('User {} emergancy withdrew {} from pool #{}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
  ])

  const poolInfo = getPoolInfo(event.params.pid)
  poolInfo.balance = poolInfo.balance.minus(event.params.amount)
  poolInfo.save()

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = BigInt.fromU32(0)
  userInfo.rewardDebt = BigInt.fromU32(0)
  userInfo.save()
}

export function ownershipTransferred(event: OwnershipTransferred): void {
  log.info('Ownership transfered from {} to {}', [event.params.previousOwner.toHex(), event.params.newOwner.toHex()])
  const masterChef = getMasterChef()
  masterChef.owner = event.params.newOwner
  masterChef.save()

  const owner = new MasterChefV1Owner(event.params.newOwner.toHex())
  owner.block = event.block.number
  owner.timestamp = event.block.timestamp
  owner.save()
}
