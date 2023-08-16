export const POOL_API =
  process.env['POOLS_API_V0_BASE_URL'] || process.env['NEXT_PUBLIC_POOLS_API_V0_BASE_URL'] || 'https://pools.sushi.com'

export const TOKENS_API =
  process.env['TOKENS_API_V0_BASE_URL'] ||
  process.env['NEXT_PUBLIC_TOKENS_API_V0_BASE_URL'] ||
  'https://tokens.sushi.com'
