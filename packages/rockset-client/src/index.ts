import rockset from '@rockset/client'

export async function createClient() {
  await import('dotenv/config')
  if (!process.env['ROCKSET_API_KEY']) throw new Error('ROCKSET_API_KEY is required')
  if (!process.env['ROCKSET_HOST']) throw new Error('ROCKSET_HOST is required')
  if (!process.env['ROCKSET_ENV']) throw new Error('ROCKSET_ENV is required')
  return rockset.default(process.env.ROCKSET_API_KEY, process.env.ROCKSET_HOST)
}

export * from './types/index.js'
