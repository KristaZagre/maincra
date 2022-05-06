import transpileModules from 'next-transpile-modules'

const withTranspileModules = transpileModules(['@sushiswap/ui'])

export default withTranspileModules({
  basePath: '/auction-market',
  reactStrictMode: true,
  swcMinify: true,
  runtime: 'edge',
  serverComponents: true,
})
