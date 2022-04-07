import transpileModules from 'next-transpile-modules'

const withTranspileModules = transpileModules(['ui'])

export default withTranspileModules({
  basePath: '/auction-market',
  reactStrictMode: true,
  swcMinify: true,
})
