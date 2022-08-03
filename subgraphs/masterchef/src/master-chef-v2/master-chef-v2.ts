import { Address, BigInt, dataSource, log } from '@graphprotocol/graph-ts'

import { ERC20 as ERC20Contract } from '../../generated/MasterChef/ERC20'
import { CloneRewarder01 as CloneRewarder01Contract } from '../../generated/MasterChefV2/CloneRewarder01'
import { CloneRewarder02 as CloneRewarder02Contract } from '../../generated/MasterChefV2/CloneRewarder02'
import { ComplexRewarder01 as ComplexRewarder01Contract } from '../../generated/MasterChefV2/ComplexRewarder01'
import { ComplexRewarder02 as ComplexRewarder02Contract } from '../../generated/MasterChefV2/ComplexRewarder02'
import { ConvexRewarder as ConvexRewarderContract } from '../../generated/MasterChefV2/ConvexRewarder'
import { LidoRewarder as LidoRewarderContract } from '../../generated/MasterChefV2/LidoRewarder'
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
} from '../../generated/MasterChefV2/MasterChefV2'
import { SushiToken as SushiTokenContract } from '../../generated/MasterChefV2/SushiToken'
import {
  MasterChefV2,
  MasterChefV2LpTokenBalance,
  MasterChefV2PoolInfo,
  MasterChefV2Rewarder,
  MasterChefV2SushiTokenBalance,
  MasterChefV2UserInfo,
} from '../../generated/schema'
import {
  CloneRewarder01,
  CloneRewarder02,
  ComplexRewarder01,
  ConvexRewarder,
  LidoRewarder,
} from '../../generated/templates'
import {
  MasterChefV2LpTokenBalance as MasterChefV2LpTokenBalanceTemplate,
  MasterChefV2RewardTokenBalance as MasterChefV2RewardTokenBalanceTemplate,
} from '../../generated/templates'

const SUSHI_TOKEN_ADDRESS = Address.fromString('0x6b3595068778dd592e39a122f4f5a5cf09c90fe2')

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
    masterChefV2.sushiPerDay = masterChefV2.sushiPerSecond.times(BigInt.fromU32(86400))
    // userInfo ...
    // poolInfo ...
    masterChefV2.totalAllocPoint = contract.totalAllocPoint()
    masterChefV2.poolCount = BigInt.fromU32(0)
    masterChefV2.rewarderCount = BigInt.fromU32(0)
    masterChefV2.migrationCount = BigInt.fromU32(0)
    const sushiTokenBalance = getSushiTokenBalance(SUSHI_TOKEN_ADDRESS)
    masterChefV2.sushiTokenBalance = sushiTokenBalance.id
    masterChefV2.balance = BigInt.fromU32(0)
    masterChefV2.save()
  }

  return masterChefV2 as MasterChefV2
}

function getSushiTokenBalance(address: Address = SUSHI_TOKEN_ADDRESS): MasterChefV2SushiTokenBalance {
  let balance = MasterChefV2SushiTokenBalance.load(address.toHex())
  if (balance === null) {
    balance = new MasterChefV2SushiTokenBalance(address.toHex())
    balance.amount = BigInt.fromU32(0)
    balance.save()
    // MasterChefV2SushiTokenBalanceTemplate.create(address)
  }
  return balance as MasterChefV2SushiTokenBalance
}

function getLpTokenBalance(address: Address, blockNumber: BigInt): MasterChefV2LpTokenBalance {
  let balance = MasterChefV2LpTokenBalance.load(address.toHex())
  if (balance === null) {
    balance = new MasterChefV2LpTokenBalance(address.toHex())
    balance.amount = BigInt.fromU32(0)
    balance.lastAmount = BigInt.fromU32(0)
    balance.block = blockNumber
    balance.lastBlock = blockNumber
    balance.save()

    MasterChefV2LpTokenBalanceTemplate.create(address)
  }
  return balance as MasterChefV2LpTokenBalance
}

function getPoolInfo(pid: BigInt, blockNumber: BigInt): MasterChefV2PoolInfo {
  let poolInfo = MasterChefV2PoolInfo.load(pid.toString())

  if (poolInfo === null) {
    const masterChef = getMasterChefV2()
    const masterChefV2Contract = MasterChefV2Contract.bind(dataSource.address())
    const poolInfoResult = masterChefV2Contract.poolInfo(pid)
    poolInfo = new MasterChefV2PoolInfo(pid.toString())
    const lpToken = masterChefV2Contract.lpToken(pid)
    poolInfo.lpToken = lpToken
    const erc20 = ERC20Contract.bind(lpToken)
    const lpTokenBalance = getLpTokenBalance(lpToken, blockNumber)
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
    poolInfo.lpTokenBalance = lpTokenBalance.id

    if (!masterChef.totalAllocPoint.isZero()) {
      poolInfo.sushiPerDay = poolInfo.allocPoint.div(masterChef.totalAllocPoint).times(masterChef.sushiPerDay)
    } else {
      poolInfo.sushiPerDay = BigInt.fromU32(0)
    }

    poolInfo.save()
  }

  return poolInfo as MasterChefV2PoolInfo
}

function getUserInfo(pid: BigInt, user: Address): MasterChefV2UserInfo {
  let userInfo = MasterChefV2UserInfo.load(pid.toString().concat('-').concat(user.toHex()))

  if (userInfo === null) {
    userInfo = new MasterChefV2UserInfo(pid.toString().concat('-').concat(user.toHex()))
    userInfo.amount = BigInt.fromU32(0)
    userInfo.rewardDebt = BigInt.fromU32(0)
    userInfo.pid = pid
    userInfo.user = user
    userInfo.save()
  }

  return userInfo as MasterChefV2UserInfo
}

// function getReward(address: Address): Reward {
//   let reward = Reward.load(address.toHex())

//   if (reward === null) {
//     reward = new Reward(address.toHex())
//     reward.name =
//     reward.symbol =
//     reward.decimals =
//     reward.save()
//   }

//   return reward as Reward
// }

function getRewarder(address: Address): MasterChefV2Rewarder {
  const id = address.toHex()
  let rewarder = MasterChefV2Rewarder.load(id)
  if (rewarder === null) {
    rewarder = new MasterChefV2Rewarder(id)

    if (id == '0x0000000000000000000000000000000000000000') {
      // Null rewarder
      rewarder.rewardToken = Address.fromString('0x0000000000000000000000000000000000000000')
      rewarder.rewardPerSecond = BigInt.fromU32(0)
      rewarder.rewardPerBlock = BigInt.fromU32(0)
      rewarder.name = 'NullRewarder'
      rewarder.type = 'NULL'
    } else if (
      id == '0xd101479ce045b903ae14ec6afa7a11171afb5dfa' ||
      id == '0x7519c93fc5073e15d89131fd38118d73a72370f8'
    ) {
      // Alcx rewarders
      const complexRewarder01Contract = ComplexRewarder01Contract.bind(address)
      const rewardToken = Address.fromString('0xdbdb4d16eda451d0503b854cf79d55697f90c8df')
      rewarder.rewardToken = rewardToken
      const rewardPerBlock = complexRewarder01Contract.tokenPerBlock()
      rewarder.rewardPerSecond = rewardPerBlock.div(BigInt.fromU32(13))
      rewarder.rewardPerBlock = rewardPerBlock
      rewarder.type = 'COMPLEX_REWARDER_01'
      rewarder.name = complexRewarder01Contract._name
      MasterChefV2RewardTokenBalanceTemplate.create(rewardToken)
      ComplexRewarder01.create(address)
    } else if (
      id == '0x9e01aac4b3e8781a85b21d9d9f848e72af77b362' ||
      id == '0x1fd97b5e5a257b0b9b9a42a96bb8870cbdd1eb79'
    ) {
      // Convex rewarders
      const convexRewarderContract = ConvexRewarderContract.bind(address)
      const rewardToken = convexRewarderContract.rewardToken()
      rewarder.rewardToken = rewardToken
      const rewardPerSecond = convexRewarderContract.rewardRate()
      rewarder.rewardPerSecond = rewardPerSecond
      rewarder.rewardPerBlock = rewardPerSecond.times(BigInt.fromU32(13))
      rewarder.type = 'CONVEX'
      rewarder.name = convexRewarderContract._name
      MasterChefV2RewardTokenBalanceTemplate.create(rewardToken)
      ConvexRewarder.create(address)
    } else if (id == '0x75ff3dd673ef9fc459a52e1054db5df2a1101212') {
      const lidoRewarderContract = LidoRewarderContract.bind(address)
      const rewardToken = lidoRewarderContract.rewardToken()
      rewarder.rewardToken = rewardToken
      const rewardPerSecond = lidoRewarderContract.rewardPerSecond()
      rewarder.rewardPerSecond = rewarder.rewardPerBlock = rewardPerSecond.times(BigInt.fromU32(13))
      rewarder.type = 'LIDO'
      rewarder.name = lidoRewarderContract._name
      MasterChefV2RewardTokenBalanceTemplate.create(rewardToken)
      LidoRewarder.create(address)
    } else {
      // We might need to handle these if they were used in the past
      // unsure right now
      const complexRewarder01Contract = ComplexRewarder01Contract.bind(address)
      const complexRewarder02Contract = ComplexRewarder02Contract.bind(address)

      const cloneRewarder01Contract = CloneRewarder01Contract.bind(address)
      const cloneRewarder02Contract = CloneRewarder02Contract.bind(address)

      if (
        !cloneRewarder01Contract.try_rewardToken().reverted &&
        !cloneRewarder01Contract.try_rewardPerSecond().reverted
      ) {
        const rewardToken = cloneRewarder01Contract.rewardToken()
        rewarder.rewardToken = rewardToken
        const rewardPerSecond = cloneRewarder01Contract.rewardPerSecond()
        rewarder.rewardPerSecond = rewardPerSecond
        rewarder.rewardPerBlock = rewardPerSecond.times(BigInt.fromU32(13))

        MasterChefV2RewardTokenBalanceTemplate.create(rewardToken)

        // check if it's 01 or 02

        // if it's 02, we could fetch a null user info and check for unpaid property

        const is01 = cloneRewarder02Contract.try_userInfo(
          BigInt.fromU32(0),
          Address.fromString('0x0000000000000000000000000000000000000000')
        ).reverted

        if (is01) {
          rewarder.type = 'CLONE_REWARDER_01'
          rewarder.name = cloneRewarder01Contract._name
          CloneRewarder01.create(address)
        } else {
          rewarder.type = 'CLONE_REWARDER_02'
          rewarder.name = cloneRewarder02Contract._name
          CloneRewarder02.create(address)
        }
      } else {
        // We couldn't identify this rewarder...
        rewarder.rewardToken = Address.fromString('0x0000000000000000000000000000000000000000')
        rewarder.rewardPerSecond = BigInt.fromU32(0)
        rewarder.rewardPerBlock = BigInt.fromU32(0)
        rewarder.name = 'UnknownRewarder'
        rewarder.type = 'UNKNOWN'
      }
    }

    rewarder.save()
  }
  return rewarder as MasterChefV2Rewarder
}

function _updatePool(pid: BigInt, blockNumber: BigInt): MasterChefV2PoolInfo {
  log.info('_updatePool pid: {}', [pid.toString()])

  const masterChefV2 = getMasterChefV2()
  const poolInfo = getPoolInfo(pid, blockNumber)

  if (blockNumber > poolInfo.lastRewardBlock) {
    const lpSupply = getLpTokenBalance(Address.fromBytes(poolInfo.lpToken), blockNumber)
    if (!lpSupply.lastAmount.isZero()) {
      const blocks = blockNumber.minus(poolInfo.lastRewardBlock)
      const sushiReward = blocks
        .times(masterChefV2.sushiPerBlock)
        .times(poolInfo.allocPoint)
        .div(masterChefV2.totalAllocPoint)
      poolInfo.accSushiPerShare = poolInfo.accSushiPerShare.plus(
        sushiReward.times(BigInt.fromU32(10).pow(12).div(lpSupply.lastAmount))
      )
      if (!masterChefV2.totalAllocPoint.isZero()) {
        poolInfo.sushiPerDay = poolInfo.allocPoint.div(masterChefV2.totalAllocPoint).times(masterChefV2.sushiPerDay)
      }
      poolInfo.save()
    }
  }

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

  const nullRewarder = event.params.rewarder == Address.fromString('0x0000000000000000000000000000000000000000')

  if (nullRewarder) {
    masterChefV2.rewarderCount = masterChefV2.rewarderCount.plus(BigInt.fromU32(1))
  }
  masterChefV2.save()

  const rewarder = getRewarder(event.params.rewarder)

  const poolInfo = new MasterChefV2PoolInfo(event.params.pid.toString())
  poolInfo.lpToken = event.params.lpToken
  const erc20 = ERC20Contract.bind(event.params.lpToken)
  const lpTokenBalance = getLpTokenBalance(event.params.lpToken, event.block.number)
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
  poolInfo.lpTokenBalance = lpTokenBalance.id
  if (!masterChefV2.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.div(masterChefV2.totalAllocPoint).times(masterChefV2.sushiPerDay)
  } else {
    poolInfo.sushiPerDay = BigInt.fromU32(0)
  }
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

  const poolInfo = getPoolInfo(event.params.pid, event.block.number)
  masterChefV2.totalAllocPoint = masterChefV2.totalAllocPoint.minus(poolInfo.allocPoint).plus(event.params.allocPoint)
  masterChefV2.save()

  if (event.params.overwrite) {
    const rewarder = getRewarder(event.params.rewarder)
    poolInfo.rewarder = rewarder.id
  }

  poolInfo.allocPoint = event.params.allocPoint
  if (!masterChefV2.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.div(masterChefV2.totalAllocPoint).times(masterChefV2.sushiPerDay)
  } else {
    poolInfo.sushiPerDay = BigInt.fromU32(0)
  }
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
    _updatePool(i, call.block.number)
  }
}

export function updatePool(event: LogUpdatePool): void {
  log.info('Update pool #{}', [event.params.pid.toString()])
  const masterChefV2 = getMasterChefV2()
  const poolInfo = getPoolInfo(event.params.pid, event.block.number)
  poolInfo.lastRewardBlock = event.params.lastRewardBlock
  poolInfo.accSushiPerShare = event.params.accSushiPerShare
  poolInfo.balance = event.params.lpSupply
  if (!masterChefV2.totalAllocPoint.isZero()) {
    poolInfo.sushiPerDay = poolInfo.allocPoint.div(masterChefV2.totalAllocPoint).times(masterChefV2.sushiPerDay)
  }
  poolInfo.save()
}

export function deposit(event: Deposit): void {
  log.info('User {} deposited {} to pool #{} for {}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
    event.params.to.toHex(),
  ])
  const pool = _updatePool(event.params.pid, event.block.number)

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
  const pool = _updatePool(event.params.pid, event.block.number)

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

  const masterChefV2 = getMasterChefV2()

  const pool = _updatePool(event.params.pid, event.block.number)

  const userInfo = getUserInfo(event.params.pid, event.params.user)

  const accumulatedSushi = userInfo.amount.times(pool.accSushiPerShare).div(BigInt.fromU32(10).pow(12))

  userInfo.rewardDebt = accumulatedSushi
  userInfo.save()

  masterChefV2.balance.minus(event.params.amount)
  masterChefV2.save()
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

  const poolInfo = getPoolInfo(event.params.pid, event.block.number)
  poolInfo.balance = poolInfo.balance.minus(event.params.amount)
  poolInfo.save()
}

export function ownershipTransferred(event: OwnershipTransferred): void {
  log.info('Ownership transfered from {} to {}', [event.params.previousOwner.toHex(), event.params.newOwner.toHex()])
  // const owner = new MasterChefV2Owner(event.params.newOwner.toHex().concat('-').concat(event.block.number.toString()))
  // owner.block = event.block.number
  // owner.timestamp = event.block.timestamp
  // owner.save()

  const masterChefV2 = getMasterChefV2()
  masterChefV2.owner = event.params.newOwner
  masterChefV2.save()
}
