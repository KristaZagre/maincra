import { ChainId } from '@sushiswap/chain'
import transpileModules from 'next-transpile-modules'

const withTranspileModules = transpileModules([
  '@sushiswap/redux-token-lists',
  '@sushiswap/redux-localstorage',
  '@sushiswap/ui',
  '@sushiswap/wagmi',
])

// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/furo',
  reactStrictMode: true,
  swcMinify: false,
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  experimental: {
    esmExternals: 'loose',
  },
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/sushi-cdn/image/fetch/',
  },
  productionBrowserSourceMaps: true,
  // serverRuntimeConfig: {},
  // publicRuntimeConfig: {
  //   supportedChainIds: [
  //     ChainId.ETHEREUM,
  //     ChainId.ARBITRUM,
  //     ChainId.AVALANCHE,
  //     ChainId.BSC,
  //     ChainId.FANTOM,
  //     ChainId.GNOSIS,
  //     ChainId.HARMONY,
  //     ChainId.MOONBEAM,
  //     ChainId.MOONRIVER,
  //     ChainId.OPTIMISM,
  //     ChainId.POLYGON,
  //   ],
  // },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/furo',
        permanent: true,
        basePath: false,
      },
    ]
  },
}

export default withTranspileModules(nextConfig)
