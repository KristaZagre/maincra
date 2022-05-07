import transpileModules from 'next-transpile-modules'

const withTranspileModules = transpileModules([
  '@sushiswap/ui',
  '@sushiswap/redux-token-lists',
  '@sushiswap/chain',
  '@sushiswap/wallet-connector',
])

export default withTranspileModules({
  basePath: '/auction-market',
  reactStrictMode: true,
  swcMinify: true,
  runtime: 'edge',
  serverComponents: true,
})
