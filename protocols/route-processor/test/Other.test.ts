import { ChainId } from '@sushiswap/chain'
import { DAI, FRAX, Native, SUSHI, Type, UNI, USDC, USDT, WETH9 } from '@sushiswap/currency'
import { LiquidityProviders } from '@sushiswap/router/dist/liquidity-providers/LiquidityProviderMC'
import { getBigNumber } from '@sushiswap/tines'
import { Contract } from 'ethers'
import { ethers, network } from 'hardhat'
import https from 'https'

import { RouterABI } from './routerAbi'

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

async function swapEmulate(
  chainId: ChainId,
  jsonRpcUrl: string,
  from: Type,
  to: Type,
  amount: number,
  gasPrice: number,
  fromAddress: string,
  providers?: LiquidityProviders[]
): Promise<object> {
  const fromTokenAddress = from.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : from.address
  const toTokenAddress = to.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : to.address
  const protocolWhiteList = providers ? getProtocols(providers, chainId) : undefined
  const exp = (await getAPIObject(`https://api.1inch.io/v5.0/${chainId}/swap`, {
    fromTokenAddress,
    toTokenAddress,
    amount: getBigNumber(amount).toString(),
    gasPrice,
    protocolWhiteList,
    fromAddress,
    slippage: 0.5,
  })) as { toTokenAmount: string; protocols: string; tx: { from: string; to: string; data: string } }
  console.log(exp.protocols)
  const divisor = Math.pow(10, to.decimals)
  const expected = parseInt(exp.toTokenAmount as string) / divisor
  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl,
        },
      },
    ],
  })
  const trResult = await ethers.provider.call({
    from: exp?.tx.from,
    to: exp?.tx.to,
    data: exp?.tx.data,
  })
  const reported = parseInt(trResult.substring(2, 66), 16) / divisor
  const spent = parseInt(trResult.substring(66), 16)
  return {
    expected,
    reported,
    spent,
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
  const providers = undefined //[LiquidityProviders.Quickswap, LiquidityProviders.Sushiswap, LiquidityProviders.Trident]
  for (let i = 0; i < toArray.length; ++i) {
    const to = toArray[i]
    if (from.symbol === to.symbol) continue
    for (let amount = divisor; amount < amountMax * divisor; amount *= 10) {
      const line = `Routing: ${from.symbol} ${amount / divisor} => ${to.symbol}`
      try {
        const res = await swapEmulate(
          chainId,
          `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
          from,
          to,
          amount,
          gasPrice,
          '0x5a4069c86f49d2454cF4EA9cDa5D3bcB0F340c4B',
          providers
        )
        const div2 = Math.pow(10, to.decimals)
        const expected = parseInt(res?.toTokenAmount as string) / div2
        console.log(line, expected)
        await provider.request({
          method: 'hardhat_reset',
          params: [
            {
              forking: {
                jsonRpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
              },
            },
          ],
        })
        const rct = await ethers.provider.call({
          from: res?.tx.from,
          to: res?.tx.to,
          data: res?.tx.data,
        })
        console.log(rct)

        if (rct !== '0xf32bec2f') {
          const retAmount = parseInt(rct.substring(2, 66), 16) / div2
          const spentAmount = parseInt(rct.substring(66) || '0', 16) / divisor
          console.log(`Emulation: In ${spentAmount}, Out ${retAmount}, ${((retAmount - expected) / expected) * 100}%`)
        }
      } catch (e) {
        console.log(line, 'Error', e)
      }
    }
  }
}

it.only('1', async () => {
  await testPolygon(USDC as Record<ChainId, Type>, 60000)
})
