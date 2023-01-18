//// @ts-nocheck
import { ChainId } from '@sushiswap/chain'
import { DAI, FRAX, Native, SUSHI, Type, UNI, USDC, USDT, WETH9 } from '@sushiswap/currency'
import { getBigNumber, MultiRoute } from '@sushiswap/tines'
import { BigNumber, ethers } from 'ethers'
import https from 'https'

import { DataFetcher } from '../DataFetcher'
import { LiquidityProviders } from '../liquidity-providers/LiquidityProviderMC'
import { Router } from '../Router'

const delay = async (ms: number) => new Promise((res) => setTimeout(res, ms))

async function getAPIObject(url: string, data: Record<string, string | number | undefined>): Promise<object> {
  const params = Object.keys(data)
    .map((k) => (data[k] !== undefined ? `${k}=${data[k]}` : undefined))
    .filter((k) => k !== undefined)
    .join('&')
  const urlWithParams = url + '?' + params
  //console.log(urlWithParams)

  return new Promise((result, reject) => {
    https
      .get(urlWithParams, (res) => {
        let out = ''
        res.on('data', (chunk) => {
          out += chunk
        })
        res.on('end', () => {
          const r = JSON.parse(out)
          if (r.statusCode !== undefined && r.statusCode !== 200) reject(r)
          else result(r)
        })
      })
      .on('error', (err) => {
        reject(JSON.parse(err.message))
      })
  })
}

async function quote(
  chainId: ChainId,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
): Promise<string> {
  const protocols = providers ? getProtocols(providers, chainId) : undefined
  const resp = (await getAPIObject(`https://api.1inch.io/v5.0/${chainId}/quote`, {
    fromTokenAddress,
    toTokenAddress,
    amount,
    gasPrice,
    protocols,
  })) as { toTokenAmount: string }
  return resp.toTokenAmount
}

const sender: Record<string, string> = {
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly weth 52
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly usdc 53300
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly wbtc 1.44
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly usdt 2497
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': '0xdbA30284AD317F6c7D08fae69338E442c51F8BcE', // Poly wmatic 40500 - $41000
}

async function swap(
  chainId: ChainId,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
): Promise<string> {
  const protocols = providers ? getProtocols(providers, chainId) : undefined
  const fromAddress = sender[fromTokenAddress.toLowerCase()]
  const resp = (await getAPIObject(`https://api.1inch.io/v5.0/${chainId}/swap`, {
    fromTokenAddress,
    toTokenAddress,
    amount,
    gasPrice,
    protocols,
    fromAddress,
    slippage: 0.5,
  })) as { toTokenAmount: string }
  return resp.toTokenAmount
}

async function quote2(
  chainId: ChainId,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
): Promise<string> {
  const protocolWhiteList = providers ? getProtocols(providers, chainId) : undefined
  const resp = (await getAPIObject(`https://pathfinder.1inch.io/v1.4/chain/${chainId}/router/v5/quotes`, {
    fromTokenAddress,
    toTokenAddress,
    amount,
    gasPrice,
    protocolWhiteList,
    preset: 'maxReturnResult',
  })) as { bestResult: { toTokenAmount: string } }
  return resp.bestResult.toTokenAmount
}

interface Environment {
  chainId: ChainId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any
  dataFetcher: DataFetcher
}

function getEnvironment(chainId: ChainId): Environment {
  let network
  switch (chainId) {
    case ChainId.ETHEREUM:
      network = 'mainnet'
      break
    case ChainId.POLYGON:
      network = 'matic'
      break
    default:
  }
  const provider = new ethers.providers.AlchemyProvider(network, process.env.ALCHEMY_API_KEY)
  const dataFetcher = new DataFetcher(provider, chainId)
  dataFetcher.startDataFetching()

  return {
    chainId,
    provider,
    dataFetcher,
  }
}

async function route(
  env: Environment,
  from: Type,
  to: Type,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
): Promise<MultiRoute> {
  env.dataFetcher.fetchPoolsForToken(from, to)
  const router = new Router(env.dataFetcher, from, BigNumber.from(amount), to, gasPrice, providers)
  return new Promise((res) => {
    router.startRouting((r) => {
      router.stopRouting()
      //console.log(router.getCurrentRouteHumanString())
      res(r)
    })
    router.stopRouting()
  })
}

function getProtocol(lp: LiquidityProviders, chainId: ChainId) {
  let prefix
  switch (chainId) {
    case ChainId.ETHEREUM:
      prefix = ''
      break
    case ChainId.POLYGON:
      prefix = 'POLYGON_'
      break
    default:
      throw new Error('Unsupported network: ' + chainId)
  }
  switch (lp) {
    case LiquidityProviders.Sushiswap:
      return prefix + 'SUSHISWAP'
    case LiquidityProviders.Quickswap:
      return prefix + 'QUICKSWAP'
    case LiquidityProviders.Trident:
      return prefix + 'TRIDENT'
    case LiquidityProviders.UniswapV2:
      return prefix + 'UNISWAP_V2'
  }
}

function getProtocols(lp: LiquidityProviders[], chainId: ChainId): string {
  return lp.map((l) => getProtocol(l, chainId)).join(',')
}

function makeProcents(value: number, precision = 3) {
  const mult = Math.pow(10, precision)
  return Math.round(value * mult * 100) / mult
}

async function test(
  env: Environment,
  from: Type,
  to: Type,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
) {
  const fromAddress = from.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : from.address
  const toAddress = to.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : to.address
  const divisor = Math.pow(10, to.decimals)
  const res1 = await quote(env.chainId, fromAddress, toAddress, amount, gasPrice, providers)
  //const res1_5 = await swap(env.chainId, fromAddress, toAddress, amount, gasPrice, providers)
  //const res2 = await quote2(env.chainId, fromAddress, toAddress, amount, gasPrice, providers)
  const res3 = await route(env, from, to, amount, gasPrice, providers)
  const v1 = parseInt(res1) / divisor
  const v2 = res3.amountOut / divisor
  const diff = makeProcents((v2 - v1) / v1)
  const pi = makeProcents(res3.priceImpact as number)
  return [v1, /*parseInt(res1_5), parseInt(res2),*/ v2, diff, pi]
}

async function testTrident() {
  try {
    const chainId = ChainId.POLYGON
    const from = WETH9[chainId]
    const divisor = Math.pow(10, from.decimals)
    const to = USDC[chainId]
    const gasPrice = 100e9
    const providers = [LiquidityProviders.Trident]
    const env = getEnvironment(chainId)
    env.dataFetcher.fetchPoolsForToken(from, to)
    await delay(3000)
    for (let i = 15; i < 22; ++i) {
      const amount = getBigNumber(4 * Math.pow(10, i)).toString()
      const res = await test(env, from, to, amount, gasPrice, providers)
      console.log((4 * Math.pow(10, i)) / divisor, res)
    }
  } catch (e) {
    console.log('Error', e)
  }
}

async function testPolygon(fromR: Record<ChainId, Type>, amountMax: number) {
  const chainId = ChainId.POLYGON
  const from = fromR[chainId]
  const divisor = Math.pow(10, from.decimals)
  const toArray: Type[] = [
    Native.onChain(chainId),
    USDT[chainId],
    USDC[chainId],
    WETH9[chainId],
    SUSHI[chainId],
    UNI[chainId],
    DAI[chainId],
    FRAX[chainId],
  ]
  const gasPrice = 100e9
  const providers = [LiquidityProviders.Quickswap, LiquidityProviders.Sushiswap, LiquidityProviders.Trident]
  const env = getEnvironment(chainId)
  toArray.forEach((to) => env.dataFetcher.fetchPoolsForToken(from, to))
  await delay(3000)
  for (let i = 0; i < toArray.length; ++i) {
    const to = toArray[i]
    if (to.symbol == from.symbol) continue
    for (let amount = divisor; amount < amountMax * divisor; amount *= 10) {
      const line = `${from.symbol} ${amount / divisor} => ${to.symbol}`
      try {
        const res = await test(env, from, to, BigNumber.from(amount).toString(), gasPrice, providers)
        console.log(line, res)
      } catch (e) {
        console.log(line, 'Error')
      }
    }
  }
}

//testTrident()
testPolygon(USDC as Record<ChainId, Type>, 110000)
