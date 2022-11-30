import { parseUnits } from '@ethersproject/units'
import { expect, Page } from '@playwright/test'
import { ChainId, chainName } from '@sushiswap/chain'
import { Contract, providers, Wallet } from 'ethers'
import { allChains, Chain, chain as chainLookup } from 'wagmi'

function getNetwork(chain: Chain) {
  return {
    chainId: chain.id,
    ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    name: chain.name,
  }
}

class EthersProviderWrapper extends providers.StaticJsonRpcProvider {
  toJSON() {
    return `<Provider network={${this.network.chainId}} />`
  }
}

export function getProvider({ chains = allChains, chainId }: { chains?: Chain[]; chainId?: number } = {}) {
  const chain = allChains.find((x) => x.id === chainId) ?? chainLookup.foundry
  const url = chainLookup.foundry.rpcUrls.default
  const provider = new EthersProviderWrapper(url, getNetwork(chain))
  provider.pollingInterval = 1_000
  return Object.assign(provider, { chains })
}

class EthersWebSocketProviderWrapper extends providers.WebSocketProvider {
  toJSON() {
    return `<WebSocketProvider network={${this.network.chainId}} />`
  }
}

export function getWebSocketProvider({ chains = allChains, chainId }: { chains?: Chain[]; chainId?: number } = {}) {
  const chain = allChains.find((x) => x.id === chainId) ?? chainLookup.foundry
  const url = chainLookup.foundry.rpcUrls.default.replace('http', 'ws')
  const webSocketProvider = Object.assign(new EthersWebSocketProviderWrapper(url, getNetwork(chain)), { chains })
  // Clean up WebSocketProvider immediately
  // so handle doesn't stay open in test environment
  webSocketProvider?.destroy().catch(() => {
    return
  })
  return webSocketProvider
}

// Default accounts from Anvil
export const accounts = [
  {
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0',
    balance: '10000000000000000000000',
  },
  {
    privateKey: '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e',
    balance: '10000000000000000000000',
  },
]

export class WalletSigner extends Wallet {
  connectUnchecked(): providers.JsonRpcSigner {
    const uncheckedSigner = (<EthersProviderWrapper>this.provider).getUncheckedSigner(this.address)
    return uncheckedSigner
  }
}

export function getSigners() {
  const provider = getProvider()
  return accounts.map((x) => new WalletSigner(x.privateKey, provider))
}

export const addressRegex = /^0x[a-fA-F0-9]{40}/

export const BENTOBOX_ADDRESS: Record<number, string> = {
  [ChainId.ETHEREUM]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.ROPSTEN]: '0x6BdD85290001C8Aef74f35A7606065FA15aD5ACF',
  [ChainId.RINKEBY]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.GÖRLI]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.KOVAN]: '0xc381a85ed7C7448Da073b7d6C9d4cBf1Cbf576f0',
  [ChainId.FANTOM]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.POLYGON]: '0x0319000133d3AdA02600f0875d2cf03D442C3367',
  [ChainId.POLYGON_TESTNET]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.GNOSIS]: '0xE2d7F5dd869Fc7c126D21b13a9080e75a4bDb324',
  [ChainId.BSC]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.BSC_TESTNET]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.ARBITRUM]: '0x74c764D41B77DBbb4fe771daB1939B00b146894A',
  [ChainId.AVALANCHE]: '0x0711B6026068f736bae6B213031fCE978D48E026',
  [ChainId.HECO]: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
  [ChainId.CELO]: '0x0711B6026068f736bae6B213031fCE978D48E026',
  [ChainId.HARMONY]: '0xA28cfF72b04f83A7E3f912e6ad34d5537708a2C2',
  [ChainId.MOONBEAM]: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
  [ChainId.MOONRIVER]: '0x145d82bCa93cCa2AE057D1c6f26245d1b9522E6F',
  [ChainId.OPTIMISM]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.KAVA]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.METIS]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.BTTC]: '0x8dacffa7F69Ce572992132697252E16254225D38',
}

export const BENTOBOX_DEPOSIT_ABI = [
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'token_', type: 'address' },
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'share', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [
      { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { internalType: 'uint256', name: 'shareOut', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
]

export async function selectNetwork(page: Page, chainId: ChainId) {
  await page.locator(`[testdata-id=network-selector-button]`).click()
  const networkList = page.locator(`[testdata-id=network-selector-list]`)
  const desiredNetwork = networkList.getByText(chainName[chainId])
  await expect(desiredNetwork).toBeVisible()
  await desiredNetwork.click()

  if (await desiredNetwork.isVisible()) {
    await page.locator(`[testdata-id=network-selector-button]`).click()
  }
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface Token {
  address: string
  symbol: string
}

export async function selectDate(testDataId: string, months: number, page: Page) {
  await page.locator(`[testdata-id=${testDataId}]`).click()
  for (let i = 0; i < months; i++) {
    await page.locator(`[aria-label="Next Month"]`).click()
  }

  await page
    .locator(
      `div.react-datepicker__day.react-datepicker__day--001, div.react-datepicker__day.react-datepicker__day--001.react-datepicker__day--weekend`
    )
    .last()
    .click()
}

export async function depositToBento(amount: string, chainId: ChainId) {
  const amountToSend = parseUnits(amount, 'ether').add(parseUnits('100.0', 'gwei')) //add 100 gwei so we actually get the amount asked as bentobox round down
  const signer = getSigners()[0].connect(getProvider({ chainId }))
  const bentoContract = new Contract(BENTOBOX_ADDRESS[chainId], BENTOBOX_DEPOSIT_ABI, signer)
  await bentoContract.deposit(
    '0x0000000000000000000000000000000000000000',
    signer.address,
    signer.address,
    amountToSend,
    0,
    { value: amountToSend }
  )
}
