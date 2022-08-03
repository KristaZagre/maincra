import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogInit,
  LogPoolAddition,
  LogSetPool,
  LogUpdatePool,
  OwnershipTransferred,
  Withdraw
} from "../generated/MasterChefV2/MasterChefV2"

export function createDepositEvent(
  user: Address,
  pid: BigInt,
  amount: BigInt,
  to: Address
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return depositEvent
}

export function createEmergencyWithdrawEvent(
  user: Address,
  pid: BigInt,
  amount: BigInt,
  to: Address
): EmergencyWithdraw {
  let emergencyWithdrawEvent = changetype<EmergencyWithdraw>(newMockEvent())

  emergencyWithdrawEvent.parameters = new Array()

  emergencyWithdrawEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  emergencyWithdrawEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  emergencyWithdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  emergencyWithdrawEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return emergencyWithdrawEvent
}

export function createHarvestEvent(
  user: Address,
  pid: BigInt,
  amount: BigInt
): Harvest {
  let harvestEvent = changetype<Harvest>(newMockEvent())

  harvestEvent.parameters = new Array()

  harvestEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  harvestEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  harvestEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return harvestEvent
}

export function createLogInitEvent(): LogInit {
  let logInitEvent = changetype<LogInit>(newMockEvent())

  logInitEvent.parameters = new Array()

  return logInitEvent
}

export function createLogPoolAdditionEvent(
  pid: BigInt,
  allocPoint: BigInt,
  lpToken: Address,
  rewarder: Address
): LogPoolAddition {
  let logPoolAdditionEvent = changetype<LogPoolAddition>(newMockEvent())

  logPoolAdditionEvent.parameters = new Array()

  logPoolAdditionEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  logPoolAdditionEvent.parameters.push(
    new ethereum.EventParam(
      "allocPoint",
      ethereum.Value.fromUnsignedBigInt(allocPoint)
    )
  )
  logPoolAdditionEvent.parameters.push(
    new ethereum.EventParam("lpToken", ethereum.Value.fromAddress(lpToken))
  )
  logPoolAdditionEvent.parameters.push(
    new ethereum.EventParam("rewarder", ethereum.Value.fromAddress(rewarder))
  )

  return logPoolAdditionEvent
}

export function createLogSetPoolEvent(
  pid: BigInt,
  allocPoint: BigInt,
  rewarder: Address,
  overwrite: boolean
): LogSetPool {
  let logSetPoolEvent = changetype<LogSetPool>(newMockEvent())

  logSetPoolEvent.parameters = new Array()

  logSetPoolEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  logSetPoolEvent.parameters.push(
    new ethereum.EventParam(
      "allocPoint",
      ethereum.Value.fromUnsignedBigInt(allocPoint)
    )
  )
  logSetPoolEvent.parameters.push(
    new ethereum.EventParam("rewarder", ethereum.Value.fromAddress(rewarder))
  )
  logSetPoolEvent.parameters.push(
    new ethereum.EventParam("overwrite", ethereum.Value.fromBoolean(overwrite))
  )

  return logSetPoolEvent
}

export function createLogUpdatePoolEvent(
  pid: BigInt,
  lastRewardBlock: BigInt,
  lpSupply: BigInt,
  accSushiPerShare: BigInt
): LogUpdatePool {
  let logUpdatePoolEvent = changetype<LogUpdatePool>(newMockEvent())

  logUpdatePoolEvent.parameters = new Array()

  logUpdatePoolEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  logUpdatePoolEvent.parameters.push(
    new ethereum.EventParam(
      "lastRewardBlock",
      ethereum.Value.fromUnsignedBigInt(lastRewardBlock)
    )
  )
  logUpdatePoolEvent.parameters.push(
    new ethereum.EventParam(
      "lpSupply",
      ethereum.Value.fromUnsignedBigInt(lpSupply)
    )
  )
  logUpdatePoolEvent.parameters.push(
    new ethereum.EventParam(
      "accSushiPerShare",
      ethereum.Value.fromUnsignedBigInt(accSushiPerShare)
    )
  )

  return logUpdatePoolEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createWithdrawEvent(
  user: Address,
  pid: BigInt,
  amount: BigInt,
  to: Address
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = new Array()

  withdrawEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("pid", ethereum.Value.fromUnsignedBigInt(pid))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return withdrawEvent
}
