import { ChainId } from '../../chain/index.js'

export const nativeCurrencyIds = {
  [ChainId.ETHEREUM]: 'ETH',
  [ChainId.ROPSTEN]: 'ETH',
  [ChainId.RINKEBY]: 'ETH',
  [ChainId.GÖRLI]: 'ETH',
  [ChainId.KOVAN]: 'ETH',
  [ChainId.POLYGON]: 'MATIC',
  [ChainId.POLYGON_TESTNET]: 'MATIC',
  [ChainId.FANTOM]: 'FTM',
  [ChainId.FANTOM_TESTNET]: 'FTM',
  [ChainId.GNOSIS]: 'XDAI',
  [ChainId.BSC]: 'BNB',
  [ChainId.BSC_TESTNET]: 'BNB',
  [ChainId.ARBITRUM]: 'ETH',
  [ChainId.ARBITRUM_NOVA]: 'ETH',
  [ChainId.ARBITRUM_TESTNET]: 'ETH',
  [ChainId.AVALANCHE]: 'AVAX',
  [ChainId.AVALANCHE_TESTNET]: 'AVAX',
  [ChainId.HECO]: 'HT',
  [ChainId.HECO_TESTNET]: 'HT',
  [ChainId.HARMONY]: 'ONE',
  [ChainId.HARMONY_TESTNET]: 'ONE',
  [ChainId.OKEX]: 'OKT',
  [ChainId.OKEX_TESTNET]: 'OKT',
  [ChainId.CELO]: 'CELO',
  [ChainId.PALM]: 'PALM',
  [ChainId.MOONRIVER]: 'MOVR',
  [ChainId.FUSE]: 'FUSE',
  [ChainId.TELOS]: 'TLOS',
  [ChainId.MOONBEAM]: 'GLMR',
  [ChainId.OPTIMISM]: 'ETH',
  [ChainId.KAVA]: 'KAVA',
  [ChainId.METIS]: 'METIS',
  [ChainId.BOBA]: 'ETH',
  [ChainId.BOBA]: 'ETH',
  [ChainId.BOBA_AVAX]: 'BOBA',
  [ChainId.BOBA_BNB]: 'BOBA',
  [ChainId.BTTC]: 'BTT',
  [ChainId.THUNDERCORE]: 'TT',
  // [ChainId.CONSENSUS_ZKEVM_TESTNET]: 'ETH',
  // [ChainId.SCROLL_ALPHA_TESTNET]: 'ETH',
  // [ChainId.BASE_TESTNET]: 'ETH',
  [ChainId.POLYGON_ZKEVM]: 'ETH',
  [ChainId.CORE]: 'CORE',
  [ChainId.HAQQ]: 'ISLM',
  [ChainId.ZKSYNC_ERA]: 'ETH',
  [ChainId.LINEA]: 'ETH',
  [ChainId.BASE]: 'ETH',
  [ChainId.SCROLL]: 'ETH',
  // [ChainId.SEPOLIA]: 'ETH',
  [ChainId.FILECOIN]: 'FIL',
} as const
