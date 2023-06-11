export const PoolChartType = {
  Volume: 'Volume',
  TVL: 'TVL',
  Fees: 'Fees',
  APR: 'APR',
  Depth: 'Depth',
}

export type PoolChartType = (typeof PoolChartType)[keyof typeof PoolChartType]

export const PoolChartPeriod = {
  Day: '1D',
  Week: '1W',
  Month: '1M',
  Year: '1Y',
  All: 'All',
}

export type PoolChartPeriod = (typeof PoolChartPeriod)[keyof typeof PoolChartPeriod]
