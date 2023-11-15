export enum PoolProtocol {
  SUSHISWAP_V2 = 'SUSHISWAP_V2',
  SUSHISWAP_V3 = 'SUSHISWAP_V3',
}

export enum PoolsOrderBy {
  LIQUIDITY_USD = 'liquidityUSD',
  VOLUME_1D = 'volumeUSD1d',
  VOLUME_1W = 'volumeUSD1w',
  VOLUME_1M = 'volumeUSD1m',
  FEE_1D = 'feeUSD1d',
  FEE_APR = 'feeApr1d',
}


export const poolOrderByToField: Record<PoolsOrderBy, string> = {
  [PoolsOrderBy.LIQUIDITY_USD]: 'p.liquidityUSD',
  [PoolsOrderBy.VOLUME_1D]: 'p.volumeUSD1d',
  [PoolsOrderBy.VOLUME_1W]: 'p.volumeUSD1w',
  [PoolsOrderBy.VOLUME_1M]: 'p.volumeUSD1m',
  [PoolsOrderBy.FEE_1D]: 'p.feeUSD1d',
  [PoolsOrderBy.FEE_APR]: 'p.feeApr1d',
}
