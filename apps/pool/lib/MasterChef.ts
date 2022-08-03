import { JSBI } from '@sushiswap/math'

interface PoolInfo {
  lpToken: string
  allocPoint: JSBI
  lastRewardBlock: JSBI
  accSushiPerShare: JSBI
  balance: JSBI
}

interface UserInfo {
  amount: JSBI
  rewardDebt: JSBI
}

const BONUS_MULTIPLIER: JSBI = JSBI.BigInt(10)

export class MasterChef {
  sushiPerBlock: JSBI
  bonusEndBlock: JSBI
  totalAllocPoint: JSBI = JSBI.BigInt(0)
  poolInfo: PoolInfo[]
  userInfo: Map<number, Map<string, UserInfo>>
  constructor() {
    //
  }
  getMultiplier(_from: JSBI, _to: JSBI): JSBI {
    if (_to <= this.bonusEndBlock) {
      return JSBI.multiply(JSBI.subtract(_to, _from), BONUS_MULTIPLIER)
    } else if (_from >= this.bonusEndBlock) {
      return JSBI.subtract(_to, _from)
    } else {
      return JSBI.add(
        JSBI.multiply(JSBI.subtract(this.bonusEndBlock, _from), BONUS_MULTIPLIER),
        JSBI.subtract(_to, this.bonusEndBlock)
      )
    }
  }
  pendingSushi(_pid: number, _user: string) {
    const pool = this.poolInfo[_pid]
    const user = this.userInfo[_pid][_user]
  }
}
