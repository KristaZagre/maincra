import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { ERC20 as ERC20Contract } from '../../generated/MasterChef/ERC20'
import {
  AddCall,
  Deposit,
  EmergencyWithdraw,
  MassUpdatePoolsCall,
  MasterChef as MasterChefContract,
  MigrateCall,
  SetCall,
  SetMigratorCall,
  UpdatePoolCall,
  Withdraw,
} from '../../generated/MasterChef/MasterChef'
import {
  MasterChefV1,
  MasterChefV1LpTokenBalance,
  MasterChefV1Migration,
  MasterChefV1Migrator,
  MasterChefV1PoolInfo,
  MasterChefV1UserInfo,
} from '../../generated/schema'
import { MasterChefV1LpTokenBalance as MasterChefV1LpTokenBalanceTemplate } from '../../generated/templates'
const MASTER_CHEF_ADDRESS = Address.fromString('0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd')

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
    masterChef.sushiPerDay = masterChef.sushiPerSecond.times(BigInt.fromU32(84600))
    masterChef.bonusMultiplier = contract.BONUS_MULTIPLIER()
    masterChef.migrator = contract.migrator()
    masterChef.owner = contract.owner()
    // userInfo ...
    // poolInfo ...
    masterChef.totalAllocPoint = BigInt.fromU32(0)
    masterChef.startBlock = contract.startBlock()
    masterChef.poolLength = BigInt.fromU32(0)
    masterChef.migrationCount = BigInt.fromU32(0)
    masterChef.userCount = BigInt.fromU32(0)
    masterChef.save()
  }

  return masterChef as MasterChefV1
}

function getLpTokenBalance(address: Address, blockNumber: BigInt): MasterChefV1LpTokenBalance {
  let balance = MasterChefV1LpTokenBalance.load(address.toHex())
  if (balance === null) {
    balance = new MasterChefV1LpTokenBalance(address.toHex())
    balance.amount = BigInt.fromU32(0)
    balance.lastAmount = BigInt.fromU32(0)
    balance.block = blockNumber
    balance.lastBlock = blockNumber
    balance.save()
    MasterChefV1LpTokenBalanceTemplate.create(address)
  }
  return balance as MasterChefV1LpTokenBalance
}

function getPoolInfo(pid: BigInt): MasterChefV1PoolInfo {
  // let poolInfo = MasterChefV1PoolInfo.load(pid.toString())
  // if (poolInfo === null) {
  //   const masterChefContract = MasterChefContract.bind(dataSource.address())
  //   const poolInfoResult = masterChefContract.poolInfo(pid)
  //   poolInfo = new MasterChefV1PoolInfo(pid.toString())

  //   const lpToken = poolInfoResult.getLpToken()
  //   poolInfo.lpToken = lpToken

  //   const lpTokenBalance = getLpTokenBalance(lpToken)
  //   poolInfo.lpTokenBalance = lpTokenBalance.id

  //   const accSushiPerShare = poolInfoResult.getAccSushiPerShare()
  //   const lastRewardBlock = poolInfoResult.getLastRewardBlock()
  //   const allocPoint = poolInfoResult.getAllocPoint()
  //   poolInfo.accSushiPerShare = accSushiPerShare
  //   poolInfo.lastRewardBlock = lastRewardBlock
  //   poolInfo.allocPoint = allocPoint
  //   poolInfo.userLength = BigInt.fromU32(0)
  //   poolInfo.save()
  // }

  return MasterChefV1PoolInfo.load(pid.toString()) as MasterChefV1PoolInfo
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

    const poolInfo = getPoolInfo(pid)
    poolInfo.userLength = poolInfo.userLength.plus(BigInt.fromU32(1))
    poolInfo.save()
  }

  return userInfo as MasterChefV1UserInfo
}

// function getUser(address: Address): MasterChefV1UserInfo {
//   let userInfo = MasterChefV1UserInfo.load(address.toHex())

//   if (userInfo === null) {
//     userInfo = new MasterChefV1UserInfo(address.toHex())
//     userInfo.save()

//     const masterChef = getMasterChef()
//     masterChef.userCount = masterChef.userCount.plus(BigInt.fromU32(1))
//     masterChef.save()
//   }

//   return userInfo as MasterChefV1UserInfo
// }

// Return reward multiplier over the given _from to _to block.
function _getMultiplier(_from: BigInt, _to: BigInt): BigInt {
  const masterChef = getMasterChef()
  if (_to <= masterChef.bonusEndBlock) {
    return _to.minus(_from).times(masterChef.bonusMultiplier)
  } else if (_from >= masterChef.bonusEndBlock) {
    return _to.minus(_from)
  } else {
    return masterChef.bonusEndBlock
      .minus(_from)
      .times(masterChef.bonusMultiplier)
      .plus(_to.minus(masterChef.bonusEndBlock))
  }
}

function _updatePool(pid: BigInt, blockNumber: BigInt, txIndex: BigInt): MasterChefV1PoolInfo {
  const masterChef = getMasterChef()
  const poolInfo = getPoolInfo(pid)

  if (blockNumber <= poolInfo.lastRewardBlock) {
    return poolInfo
  }

  const lpTokenBalance = getLpTokenBalance(Address.fromBytes(poolInfo.lpToken), blockNumber)
  // const erc20 = ERC20Contract.bind(Address.fromBytes(poolInfo.lpToken))
  // const balance = erc20.try_balanceOf(MASTER_CHEF_ADDRESS)
  // const lpSupply = !balance.reverted ? balance.value : BigInt.fromU32(0)

  if (lpTokenBalance.lastAmount.isZero()) {
    poolInfo.lastRewardBlock = blockNumber
    poolInfo.save()
    return poolInfo
  }

  const multiplier = _getMultiplier(poolInfo.lastRewardBlock, blockNumber)

  const sushiReward = multiplier
    .times(masterChef.sushiPerBlock)
    .times(poolInfo.allocPoint)
    .div(masterChef.totalAllocPoint)

  // const masterChefContract = MasterChefContract.bind(MASTER_CHEF_ADDRESS)

  // 20n * 100000000000000000000n * 1000n / 14000n
  // 142857142857142857142n * 1000000000000n / 448506071830218951n

  // sushiReward 142857142857142857142

  // const poolInfoResult = masterChefContract.poolInfo(pid)

  // if (blockNumber >= BigInt.fromU32(10750000) && blockNumber <= BigInt.fromU32(10750006))
  //   log.info(
  //     '_updatePool pid {} block {} index {} allocPoint {}/{} lastRewardBlock {}/{} multiplier {}/{} lp blance {}/{} accSushiPerShare {}/{}',
  //     [
  //       pid.toString(),
  //       blockNumber.toString(),
  //       txIndex.toString(),
  //       poolInfoResult.getAllocPoint().toString(),
  //       poolInfo.allocPoint.toString(),
  //       poolInfoResult.getLastRewardBlock().toString(),
  //       poolInfo.lastRewardBlock.toString(),
  //       masterChefContract.getMultiplier(poolInfo.lastRewardBlock, blockNumber).toString(),
  //       multiplier.toString(),
  //       // lpSupply.toString(),
  //       lpTokenBalance.lastAmount.toString(),
  //       lpTokenBalance.lastAmount.toString(),
  //       poolInfoResult.getAccSushiPerShare().toString(),
  //       poolInfo.accSushiPerShare
  //         .plus(sushiReward.times(BigInt.fromU32(10).pow(12)).div(lpTokenBalance.lastAmount))
  //         .toString(),
  //     ]
  //   )

  poolInfo.accSushiPerShare = poolInfo.accSushiPerShare.plus(
    sushiReward.times(BigInt.fromU32(10).pow(12)).div(lpTokenBalance.lastAmount)
  )

  poolInfo.lastRewardBlock = blockNumber

  // Probably never need this check but to be safe...
  if (!masterChef.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.times(masterChef.sushiPerDay).div(masterChef.totalAllocPoint)
  } else {
    poolInfo.sushiPerDay = BigInt.fromU32(0)
  }

  poolInfo.save()

  return poolInfo
}

function _massUpdatePools(blockNumber: BigInt, txIndex: BigInt): void {
  const masterChef = getMasterChef()
  for (let i = BigInt.fromU32(0), j = masterChef.poolLength; i < j; i = i.plus(BigInt.fromU32(1))) {
    _updatePool(i, blockNumber, txIndex)
  }
}

export function add(call: AddCall): void {
  const masterChef = getMasterChef()

  log.info('Add pool #{} allocPoint: {} lpToken {} withUpdate {} block {} index {}', [
    masterChef.poolLength.toString(),
    call.inputs._allocPoint.toString(),
    call.inputs._lpToken.toHex(),
    call.inputs._withUpdate.toString(),
    call.block.number.toString(),
    call.transaction.index.toString(),
  ])

  if (call.inputs._withUpdate) {
    _massUpdatePools(call.block.number, call.transaction.index)
  }

  const poolInfo = new MasterChefV1PoolInfo(masterChef.poolLength.toString())
  poolInfo.allocPoint = call.inputs._allocPoint
  poolInfo.lpToken = call.inputs._lpToken
  const lpTokenBalance = getLpTokenBalance(call.inputs._lpToken, call.block.number)
  poolInfo.lpTokenBalance = lpTokenBalance.id
  poolInfo.lastRewardBlock = call.block.number > masterChef.startBlock ? call.block.number : masterChef.startBlock
  poolInfo.accSushiPerShare = BigInt.fromU32(0)
  poolInfo.userLength = BigInt.fromU32(0)

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(call.inputs._allocPoint)
  masterChef.poolLength = masterChef.poolLength.plus(BigInt.fromU32(1))
  masterChef.save()

  if (!masterChef.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.times(masterChef.sushiPerDay).div(masterChef.totalAllocPoint)
  } else {
    poolInfo.sushiPerDay = BigInt.fromU32(0)
  }
  poolInfo.save()
}

export function set(call: SetCall): void {
  log.info('Set pool #{} allocPoint {} withUpdate {} block {} index {}', [
    call.inputs._pid.toString(),
    call.inputs._allocPoint.toString(),
    call.inputs._withUpdate.toString(),
    call.block.number.toString(),
    call.transaction.index.toString(),
  ])

  if (call.inputs._withUpdate) {
    _massUpdatePools(call.block.number, call.transaction.index)
  }

  const poolInfo = getPoolInfo(call.inputs._pid)
  const masterChef = getMasterChef()
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.minus(poolInfo.allocPoint).plus(call.inputs._allocPoint)
  masterChef.save()

  if (!masterChef.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.times(masterChef.sushiPerDay).div(masterChef.totalAllocPoint)
  } else {
    poolInfo.sushiPerDay = BigInt.fromU32(0)
  }
  poolInfo.save()
}

export function setMigrator(call: SetMigratorCall): void {
  const migrator = new MasterChefV1Migrator(call.inputs._migrator.toHex())
  migrator.block = call.block.number
  migrator.timestamp = call.block.timestamp
  migrator.save()

  const masterChef = getMasterChef()
  // log.info('Set migrator from {} to {}', [masterChef.migrator.toHex(), call.inputs._migrator.toHex()])
  masterChef.migrator = call.inputs._migrator
  masterChef.save()
}

export function migrate(call: MigrateCall): void {
  const masterChef = getMasterChef()
  const masterChefContract = MasterChefContract.bind(MASTER_CHEF_ADDRESS)

  const poolInfo = getPoolInfo(call.inputs._pid)
  const lpTokenBalance = getLpTokenBalance(Address.fromBytes(poolInfo.lpToken), call.block.number)

  const migration = new MasterChefV1Migration(masterChef.migrationCount.toString())
  migration.previousLpToken = poolInfo.lpToken
  migration.previousBalance = lpTokenBalance.amount
  const newLpToken = masterChefContract.poolInfo(call.inputs._pid).getLpToken()
  const lpTokenContract = ERC20Contract.bind(newLpToken)
  const newBalance = lpTokenContract.balanceOf(MASTER_CHEF_ADDRESS)

  const newLpTokenBalance = getLpTokenBalance(newLpToken, call.block.number)
  newLpTokenBalance.amount = newBalance
  newLpTokenBalance.save()

  migration.newLpToken = newLpToken
  migration.newBalance = newBalance
  migration.save()

  poolInfo.lpToken = newLpToken
  poolInfo.lpTokenBalance = newLpTokenBalance.id
  poolInfo.save()

  masterChef.migrationCount = masterChef.migrationCount.plus(BigInt.fromU32(1))
  masterChef.save()
}

export function massUpdatePools(call: MassUpdatePoolsCall): void {
  // log.info('massUpdatePools block {} index {}', [call.block.number.toString(), call.transaction.index.toString()])
  _massUpdatePools(call.block.number, call.transaction.index)
}

export function updatePool(call: UpdatePoolCall): void {
  // log.info('updatePool #{} block {} index {}', [
  //   call.inputs._pid.toString(),
  //   call.block.number.toString(),
  //   call.transaction.index.toString(),
  // ])
  _updatePool(call.inputs._pid, call.block.number, call.transaction.index)
}

// export function dev(call: DevCall): void {
//   const masterChef = getMasterChef()
//   log.info('Dev address changed from {} to {}', [masterChef.devaddr.toHex(), call.inputs._devaddr.toHex()])
//   masterChef.devaddr = call.inputs._devaddr
//   masterChef.save()
// }

// export function handleDepositCall(call: DepositCall): void {
//   log.info('hanlde DepositCall', [])
//   _updatePool(call.inputs._pid, call.block.number, call.transaction.index)
// }

// export function handleWithdrawCall(call: WithdrawCall): void {
//   log.info('hanlde WithdrawCall', [])
//   _updatePool(call.inputs._pid, call.block.number, call.transaction.index)
// }

export function deposit(event: Deposit): void {
  log.info('User {} deposited {} to pool #{} block: {} txIndex {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.block.number.toString(),
    event.transaction.index.toString(),
  ])

  const poolInfo = _updatePool(event.params.pid, event.block.number, event.transaction.index)
  // const poolInfo = getPoolInfo(event.params.pid)
  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = userInfo.amount.plus(event.params.amount)
  userInfo.rewardDebt = userInfo.amount.times(poolInfo.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  userInfo.save()
}

export function withdraw(event: Withdraw): void {
  log.info('User {} withdrew {} from pool #{} block {} txIndex {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.block.number.toString(),
    event.transaction.index.toString(),
  ])
  const poolInfo = _updatePool(event.params.pid, event.block.number, event.transaction.index)
  // const poolInfo = getPoolInfo(event.params.pid)

  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = userInfo.amount.minus(event.params.amount)
  userInfo.rewardDebt = userInfo.amount.times(poolInfo.accSushiPerShare).div(BigInt.fromU32(10).pow(12))
  userInfo.save()
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info('User {} emergancy withdrew {} from pool #{} block {} txIndex {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.block.number.toString(),
    event.transaction.index.toString(),
  ])
  const userInfo = getUserInfo(event.params.pid, event.params.user)
  userInfo.amount = BigInt.fromU32(0)
  userInfo.rewardDebt = BigInt.fromU32(0)
  userInfo.save()
}

// export function ownershipTransferred(event: OwnershipTransferred): void {
//   log.info('Ownership transfered from {} to {}', [event.params.previousOwner.toHex(), event.params.newOwner.toHex()])
//   const owner = new MasterChefV1Owner(event.params.newOwner.toHex())
//   owner.block = event.block.number
//   owner.timestamp = event.block.timestamp
//   owner.save()

//   const masterChef = getMasterChef()
//   masterChef.owner = event.params.newOwner
//   masterChef.save()
// }
