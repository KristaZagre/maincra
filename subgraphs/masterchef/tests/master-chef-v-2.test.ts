import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Deposit } from "../generated/schema"
import { Deposit as DepositEvent } from "../generated/MasterChefV2/MasterChefV2"
import { handleDeposit } from "../src/master-chef-v-2"
import { createDepositEvent } from "./master-chef-v-2-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let user = Address.fromString("0x0000000000000000000000000000000000000001")
    let pid = BigInt.fromI32(234)
    let amount = BigInt.fromI32(234)
    let to = Address.fromString("0x0000000000000000000000000000000000000001")
    let newDepositEvent = createDepositEvent(user, pid, amount, to)
    handleDeposit(newDepositEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Deposit created and stored", () => {
    assert.entityCount("Deposit", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Deposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Deposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "pid",
      "234"
    )
    assert.fieldEquals(
      "Deposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "Deposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "to",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
