import { erc20Abi } from '@sushiswap/abi'
import { ChainId } from '@sushiswap/chain'
import { DAI, FRAX, Native, SUSHI, Type, UNI, USDC, USDT, WETH9 } from '@sushiswap/currency'
import { DataFetcher, Router } from '@sushiswap/router'
import { LiquidityProviders } from '@sushiswap/router/dist/liquidity-providers/LiquidityProviderMC'
import { getBigNumber, MultiRoute } from '@sushiswap/tines'
import { BigNumber, Contract } from 'ethers'
import { ethers, network } from 'hardhat'
import https from 'https'

const delay = async (ms: number) => new Promise((res) => setTimeout(res, ms))

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

const sender: Record<string, string> = {
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly weth 52
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly usdc 53300
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly wbtc 1.44
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B', // Poly usdt 2497
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': '0xdbA30284AD317F6c7D08fae69338E442c51F8BcE', // Poly wmatic 40500 - $41000
}

function addProtocolsInSet(set: Set<string>, inp: { name: string }[] | { name: string }) {
  if (inp instanceof Array) {
    inp.forEach((r) => addProtocolsInSet(set, r))
  } else set.add(inp.name)
}

function collectProtocols(inp: { name: string }[] | { name: string }): string[] {
  const set = new Set<string>()
  addProtocolsInSet(set, inp)
  return Array.from(set.keys())
}

function makeProcents(value: number, precision = 3) {
  const mult = Math.pow(10, precision)
  return Math.round(value * mult * 100) / mult
}

function route(
  env: Environment,
  from: Type,
  to: Type,
  amount: string,
  gasPrice: number,
  providers?: LiquidityProviders[]
): number {
  env.dataFetcher.fetchPoolsForToken(from, to)
  const route = Router.findBestRoute(env.dataFetcher, from, BigNumber.from(amount), to, gasPrice, providers)
  return route.amountOut
}

async function getBalance(token: Type, addr: string): Promise<BigNumber> {
  if (token.isNative) return ethers.provider.getBalance(addr)
  const contract = new Contract(token.address, erc20Abi, ethers.provider)
  return contract.balanceOf(addr)
}

async function swapEmulate(
  chainId: ChainId,
  from: Type,
  to: Type,
  amount: number,
  gasPrice: number,
  fromAddress: string,
  providers?: LiquidityProviders[]
): Promise<any> {
  const fromTokenAddress = from.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : from.address
  const toTokenAddress = to.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : to.address
  const protocols = providers ? getProtocols(providers, chainId) : undefined
  const exp = (await getAPIObject(`https://api.1inch.io/v5.0/${chainId}/swap`, {
    fromTokenAddress,
    toTokenAddress,
    amount: getBigNumber(amount).toString(),
    gasPrice,
    protocols,
    fromAddress,
    slippage: 0.5,
  })) as { toTokenAmount: string; protocols: { name: string }; tx: { from: string; to: string; data: string } }

  const divisor = Math.pow(10, to.decimals)
  const expected = parseInt(exp.toTokenAmount as string) / divisor
  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: ProviderURL[chainId as keyof typeof ProviderURL],
        },
      },
    ],
  })
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [fromAddress],
  })
  const signer = await ethers.getSigner(fromAddress)
  const balanceBefore = await getBalance(to, fromAddress)
  const trResult = await signer.sendTransaction({
    from: fromAddress,
    to: exp?.tx.to,
    data: exp?.tx.data,
  })
  await trResult.wait()
  const balanceAfter = await getBalance(to, fromAddress)
  const realOutput = balanceAfter.sub(balanceBefore)
  const real = parseInt(realOutput.toString()) / divisor
  //const reported = parseInt(trResult.substring(2, 66), 16) / divisor
  //const spent = parseInt(trResult.substring(66), 16)
  return {
    expected,
    //reported,
    real,
    diff: makeProcents((real - expected) / expected),
    //spent,
    reportedProviders: collectProtocols(exp.protocols),
  }
}

const ProviderURL = {
  [ChainId.ETHEREUM]: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
  [ChainId.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
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

async function testPolygon(fromR: Record<ChainId, Type>, fromAddr: string) {
  const chainId = ChainId.POLYGON
  const from = fromR[chainId]

  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: ProviderURL[chainId as keyof typeof ProviderURL],
        },
      },
    ],
  })
  const amountMax = parseInt((await getBalance(from, fromAddr)).toString())

  const divisor = Math.pow(10, from.decimals)
  const toArray: Type[] = [
    USDT[chainId],
    Native.onChain(chainId),
    USDC[chainId],
    WETH9[chainId],
    SUSHI[chainId],
    UNI[chainId],
    DAI[chainId],
    FRAX[chainId],
  ]
  const gasPrice = 100e9
  const env = getEnvironment(chainId)
  toArray.forEach((to) => env.dataFetcher.fetchPoolsForToken(from, to))
  await delay(3000)
  const providers = [LiquidityProviders.Quickswap, LiquidityProviders.Sushiswap, LiquidityProviders.Trident]
  for (let i = 0; i < toArray.length; ++i) {
    const to = toArray[i]
    if (from.symbol === to.symbol) continue
    for (let amount = divisor; amount < amountMax; amount *= 10) {
      const line = `${amount / divisor} ${from.symbol} => ${to.symbol}`
      try {
        const res = await swapEmulate(chainId, from, to, amount, gasPrice, fromAddr, providers)
        const route = Router.findBestRoute(env.dataFetcher, from, BigNumber.from(amount), to, gasPrice, providers)
        const tines = route.amountOut / Math.pow(10, to.decimals)
        console.log(line, res, {
          tines,
          diff: makeProcents((tines - res.expected) / res.expected),
          priceImact: makeProcents(route.priceImpact as number),
        })
      } catch (e) {
        console.log(line, 'Error', e)
      }
    }
  }
}

it.only('SwapEmulation', async () => {
  await testPolygon(USDC as Record<ChainId, Type>, '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B')
})
