import {
  Extractor,
  FactoryAlgebra,
  FactoryV2,
  FactoryV3,
  LogFilterType,
  MultiCallAggregator,
  TokenManager,
} from '@sushiswap/extractor'
import {
  ConstantProductPoolCode,
  LiquidityProviders,
  NativeWrapProvider,
  PoolCode,
  Router,
} from '@sushiswap/router'
import { BASES_TO_CHECK_TRADES_AGAINST } from '@sushiswap/router-config'
import { RouteStatus, getBigInt } from '@sushiswap/tines'
import {
  SUSHISWAP_V2_FACTORY_ADDRESS,
  SUSHISWAP_V2_INIT_CODE_HASH,
} from '@sushiswap/v2-sdk'
import {
  POOL_INIT_CODE_HASH,
  SUSHISWAP_V3_FACTORY_ADDRESS,
  SUSHISWAP_V3_INIT_CODE_HASH,
  SushiSwapV3ChainId,
} from '@sushiswap/v3-sdk'
import { config } from '@sushiswap/viem-config'
import { ChainId } from 'sushi/chain'
import { Native, Token } from 'sushi/currency'
import {
  http,
  Address,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  custom,
  walletActions,
} from 'viem'
import { Chain, hardhat, telos } from 'viem/chains'
import { createHardhatProvider } from '../src'
import { pancakeswapV3Factory } from './Extractor.test'
import RouteProcessor4 from './RouteProcessor4.sol/RouteProcessor4.json'

export const TickLensContract = {
  [ChainId.ETHEREUM]: '0xbfd8137f7d1516d3ea5ca83523914859ec47f573' as Address,
  [ChainId.POLYGON]: '0xbfd8137f7d1516d3ea5ca83523914859ec47f573' as Address,
  [ChainId.ARBITRUM]: '0xbfd8137f7d1516d3ea5ca83523914859ec47f573' as Address,
  [ChainId.OPTIMISM]: '0xbfd8137f7d1516d3ea5ca83523914859ec47f573' as Address,
  [ChainId.CELO]: '0x5f115D9113F88e0a0Db1b5033D90D4a9690AcD3D' as Address,
  [ChainId.POLYGON_ZKEVM]:
    '0x0BE808376Ecb75a5CF9bB6D237d16cd37893d904' as Address,
  [ChainId.AVALANCHE]: '0xDdC1b5920723F774d2Ec2C3c9355251A20819776' as Address,
  [ChainId.BASE]: '0xF4d73326C13a4Fc5FD7A064217e12780e9Bd62c3' as Address,
  [ChainId.BSC]: '0xD9270014D396281579760619CCf4c3af0501A47C' as Address,
  [ChainId.TELOS]: '0x9dE2dEA5c68898eb4cb2DeaFf357DFB26255a4aa' as Address,
}

export const UniswapV2FactoryAddress: Record<number, string> = {
  [ChainId.ETHEREUM]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
}
export function uniswapV2Factory(chain: ChainId): FactoryV2 {
  return {
    address: UniswapV2FactoryAddress[chain] as Address,
    provider: LiquidityProviders.UniswapV2,
    fee: 0.003,
    initCodeHash:
      '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  }
}

export function sushiswapV2Factory(chain: ChainId): FactoryV2 {
  return {
    address: SUSHISWAP_V2_FACTORY_ADDRESS[chain] as Address,
    provider: LiquidityProviders.SushiSwapV2,
    fee: 0.003,
    initCodeHash: SUSHISWAP_V2_INIT_CODE_HASH[chain],
  }
}

export const UniswapV3FactoryAddress: Record<number, string> = {
  [ChainId.ETHEREUM]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [ChainId.POLYGON]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [ChainId.ARBITRUM]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [ChainId.OPTIMISM]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [ChainId.BSC]: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
  [ChainId.CELO]: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
  [ChainId.BASE]: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
}
export function uniswapV3Factory(chain: ChainId): FactoryV3 {
  return {
    address: UniswapV3FactoryAddress[chain] as Address,
    provider: LiquidityProviders.UniswapV3,
    initCodeHash: POOL_INIT_CODE_HASH,
  }
}

export function sushiswapV3Factory(chainId: SushiSwapV3ChainId) {
  return {
    address: SUSHISWAP_V3_FACTORY_ADDRESS[chainId],
    provider: LiquidityProviders.SushiSwapV3,
    initCodeHash: SUSHISWAP_V3_INIT_CODE_HASH[chainId],
  } as const
}

const delay = async (ms: number) => new Promise((res) => setTimeout(res, ms))

async function createForkRouteProcessor(
  providerUrl: string,
  forkBlockNumber: bigint,
  chainId: ChainId,
): Promise<{
  client: PublicClient & WalletClient
  deployUser: Address
  RouteProcessorAddress: Address | null
}> {
  const forkProvider = await createHardhatProvider(
    chainId,
    providerUrl,
    Number(forkBlockNumber),
  )
  const client = createPublicClient({
    chain: {
      ...hardhat,
      contracts: {
        multicall3: {
          address: '0xca11bde05977b3631167028862be2a173976ca11',
          blockCreated: 100,
        },
      },
      id: chainId,
    },
    transport: custom(forkProvider),
  }).extend(walletActions)
  const [deployUser] = await client.getAddresses()
  const RouteProcessorTx = await client.deployContract({
    chain: null,
    abi: RouteProcessor4.abi,
    bytecode: RouteProcessor4.bytecode as Hex,
    account: deployUser,
    args: ['0x0000000000000000000000000000000000000000', []],
  })
  const RouteProcessorAddress = (
    await client.waitForTransactionReceipt({ hash: RouteProcessorTx })
  ).contractAddress

  return {
    client,
    deployUser,
    RouteProcessorAddress,
  }
}

async function startInfinitTest(args: {
  transport?: Transport
  providerURL: string
  chain: Chain
  factoriesV2: FactoryV2[]
  factoriesV3: FactoryV3[]
  factoriesAlgebra?: FactoryAlgebra[]
  tickHelperContract: Address
  cacheDir: string
  logDepth: number
  logType?: LogFilterType
  logging?: boolean
  maxCallsInOneBatch?: number
  account?: Address
  checkTokens?: Token[]
}) {
  const transport = args.transport ?? http(args.providerURL)
  const client = createPublicClient({
    chain: args.chain,
    transport: transport,
  })
  const chainId = client.chain?.id as ChainId

  const forkBlockNumber = await client.getBlockNumber()
  const fork = await createForkRouteProcessor(
    args.providerURL,
    forkBlockNumber,
    chainId,
  )
  if (!fork.RouteProcessorAddress)
    throw new Error('RouteProcessor deploy failed')
  console.log(
    `RP4 deploy address: ${fork.RouteProcessorAddress} at block ${forkBlockNumber} chainId ${chainId}`,
  )

  const extractor = new Extractor({ ...args, client })
  await extractor.start(
    BASES_TO_CHECK_TRADES_AGAINST[chainId].concat(args.checkTokens ?? []),
  )

  const nativeProvider = new NativeWrapProvider(chainId, client)
  const tokenManager = new TokenManager(
    extractor.extractorV2?.multiCallAggregator ||
      (extractor.extractorV3?.multiCallAggregator as MultiCallAggregator),
    __dirname,
    `tokens-${client.chain?.id}`,
  )
  await tokenManager.addCachedTokens()
  const tokens =
    args.checkTokens ??
    BASES_TO_CHECK_TRADES_AGAINST[chainId].concat(
      Array.from(tokenManager.tokens.values()).slice(0, 100),
    )
  for (;;) {
    for (let i = 0; i < tokens.length; ++i) {
      await delay(1000)
      const time0 = performance.now()
      const pools0 = extractor.getPoolCodesForTokens(
        BASES_TO_CHECK_TRADES_AGAINST[chainId].concat([tokens[i]]),
      )
      const time1 = performance.now()
      const pools1 = await extractor.getPoolCodesForTokensAsync(
        BASES_TO_CHECK_TRADES_AGAINST[chainId].concat([tokens[i]]),
        2000,
      )
      const time2 = performance.now()
      const pools0_2 = pools0.filter(
        (p) => p instanceof ConstantProductPoolCode,
      ).length
      const pools0_3 = pools0.length - pools0_2
      const pools1_2 = pools1.filter(
        (p) => p instanceof ConstantProductPoolCode,
      ).length
      const pools1_3 = pools1.length - pools1_2
      const timingLine =
        `sync: (${pools0_2}, ${pools0_3}) pools ${Math.round(
          time1 - time0,
        )}ms` +
        `, async: (${pools1_2}, ${pools1_3}) pools ${Math.round(
          time2 - time1,
        )}ms`

      const pools = pools1
      const poolMap = new Map<string, PoolCode>()
      pools.forEach((p) => poolMap.set(p.pool.address, p))
      nativeProvider
        .getCurrentPoolList()
        .forEach((p) => poolMap.set(p.pool.address, p))
      const fromToken = Native.onChain(chainId)
      const toToken = tokens[i]
      const route = Router.findBestRoute(
        poolMap,
        chainId,
        fromToken,
        getBigInt(1e18),
        toToken,
        30e9,
      )
      if (route.status === RouteStatus.NoWay) {
        console.log(
          `Routing: ${fromToken.symbol} => ${toToken.symbol} ${route.status} ` +
            timingLine,
        )
        continue
      }
      const rpParams = Router.routeProcessor4Params(
        poolMap,
        route,
        fromToken,
        toToken,
        fork.RouteProcessorAddress,
        fork.RouteProcessorAddress,
      )
      if (rpParams === undefined) {
        console.log(
          `Routing: ${fromToken.symbol} => ${toToken.symbol} ${route.status} ROUTE CREATION FAILED !!!`,
        )
        continue
      }

      // console.log(
      //   'ROUTE:',
      //   route.legs.map(
      //     (l) =>
      //       `${l.tokenFrom.symbol} -> ${l.tokenTo.symbol}  ${l.poolAddress}  ${l.assumedAmountIn} -> ${l.assumedAmountOut}`
      //   )
      // )

      try {
        const { result: amountOutReal } = (await fork.client.simulateContract({
          address: fork.RouteProcessorAddress,
          abi: RouteProcessor4.abi,
          functionName: 'processRoute',
          args: [
            rpParams.tokenIn as Address,
            BigInt(rpParams.amountIn.toString()),
            rpParams.tokenOut as Address,
            0n,
            rpParams.to as Address,
            rpParams.routeCode as Address, // !!!!
          ],
          value: BigInt(rpParams.value?.toString() as string),
          account: args.account,
        })) as { result: bigint }
        const amountOutExp = BigInt(route.amountOutBI.toString())
        const diff =
          amountOutExp === 0n
            ? amountOutReal - amountOutExp
            : Number(amountOutReal - amountOutExp) / route.amountOut
        console.log(
          `Routing: ${fromToken.symbol} => ${toToken.symbol} ${
            route.legs.length - 1
          } pools ` +
            timingLine +
            ` diff = ${diff > 0 ? '+' : ''}${diff} `,
        )
        if (Math.abs(Number(diff)) > 0.001)
          console.log('Routing: TOO BIG DIFFERENCE !!!!!!!!!!!!!!!!!!!!!')
      } catch (e) {
        console.log(`Routing failed. No connection ? ${e}`)
      }
    }
  }
}

const drpcId = process.env['DRPC_ID'] || process.env['NEXT_PUBLIC_DRPC_ID']

it.skip('Extractor BSC infinite work test', async () => {
  await startInfinitTest({
    transport: config[ChainId.BSC].transport,
    chain: config[ChainId.BSC].chain as Chain,
    factoriesV2: [],
    factoriesV3: [pancakeswapV3Factory(ChainId.BSC)],
    tickHelperContract: TickLensContract[ChainId.BSC],
    cacheDir: './cache',
    logDepth: 300,
    logging: true,
    providerURL: `https://lb.drpc.org/ogrpc?network=bsc&dkey=${drpcId}`,
  })
})

it.skip('Extractor Telos infinite work test', async () => {
  await startInfinitTest({
    providerURL: 'http://rpc3.us.telos.net:7000/evm',
    transport: http('http://rpc3.us.telos.net:7000/evm'),
    //transport: http('https://rpc1.eu.telos.net/evm'),
    chain: telos,
    factoriesV2: [], //sushiswapV2Factory(ChainId.TELOS)],
    factoriesV3: [],
    factoriesAlgebra: [
      {
        address: '0xa09babf9a48003ae9b9333966a8bda94d820d0d9',
        provider: LiquidityProviders.AlgebraIntegral,
      },
    ],
    tickHelperContract: TickLensContract[ChainId.TELOS],
    cacheDir: './cache',
    logDepth: 300,
    logging: true,
    //logType: LogFilterType.Native,
    checkTokens: [
      new Token({
        chainId: ChainId.TELOS,
        address: '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E',
        name: 'Wrapped TLOS',
        symbol: 'WTLOS',
        decimals: 18,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin 1',
        symbol: 'USDC1',
        decimals: 6,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0xA0fB8cd450c8Fd3a11901876cD5f17eB47C6bc50',
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0x8D97Cea50351Fb4329d591682b148D43a0C3611b',
        name: 'USD Coin 2',
        symbol: 'USDC2',
        decimals: 6,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0x7627b27594bc71e6Ab0fCE755aE8931EB1E12DAC',
        name: 'Bitcoin',
        symbol: 'BTC.b',
        decimals: 8,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0xaC45EDe2098bc989Dfe0798B4630872006e24c3f',
        name: 'Swapsicle SLUSH Token',
        symbol: 'SLUSH',
        decimals: 18,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
        name: 'Staked TLOS',
        symbol: 'STLOS',
        decimals: 18,
      }),
      new Token({
        chainId: ChainId.TELOS,
        address: '0xfB319EA5DDEd8cFe8Bcf9c720ed380b98874Bf63',
        name: 'Robinos',
        symbol: 'RBN',
        decimals: 6,
      }),
    ],
  })
})
