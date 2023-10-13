export enum PoolProtocol {
  SUSHISWAP_V2 = 'SUSHISWAP_V2',
  BENTOBOX_CLASSIC = 'BENTOBOX_CLASSIC',
  BENTOBOX_STABLE = 'BENTOBOX_STABLE',
  SUSHISWAP_V3 = 'SUSHISWAP_V3',
}

export enum PoolsOrderBy {
  LIQUIDITY = 'liquidityUsd',
  VOLUME_1D = 'vol1d',
  VOLUME_1W = 'vol1w',
  VOLUME_1M = 'vol1m',
  FEE_1D = 'fee1d',
  APR = 'apr',
}

export const poolOrderByToField: Record<PoolsOrderBy, string> = {
  [PoolsOrderBy.LIQUIDITY]: 'p.liquidityUsd',
  [PoolsOrderBy.VOLUME_1D]: 'p.last1DVolumeUsd',
  [PoolsOrderBy.VOLUME_1W]: 'p.last7DVolumeUsd',
  [PoolsOrderBy.VOLUME_1M]: 'p.last30DVolumeUsd',
  [PoolsOrderBy.FEE_1D]: 'p.last1DFeeUsd',
  [PoolsOrderBy.APR]: 'p.last1DFeeApr',
}
