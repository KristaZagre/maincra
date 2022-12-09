import { AddressZero } from '@ethersproject/constants'
import { expect, Page, test } from '@playwright/test'
import { Native } from '@sushiswap/currency'
import { TRIDENT_ENABLED_NETWORKS } from 'config'
import { deployFakeToken, selectNetwork, timeout, Token } from 'test/utils'

enum PoolType {
  LEGACY,
  CLASSIC,
  STABLE,
}

const PoolFeeTier = {
  LOWEST: '001',
  LOW: '005',
  REGULAR: '03',
  HIGH: '1',
}

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)
const NATIVE_TOKEN: Token = {
  address: AddressZero,
  symbol: Native.onChain(CHAIN_ID).symbol,
}
const AMOUNT = '10'

test.describe('Add liquidity', () => {
  test.beforeEach(async ({ page }) => {
    const url = (process.env.PLAYWRIGHT_URL as string).concat('/add')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    // Select pool network
    await page.locator('[testdata-id=earn-add-select-network]').click()
    await page.locator(`[testdata-id=network-selector-${CHAIN_ID}]`).click()
  })

  if (TRIDENT_ENABLED_NETWORKS.indexOf(CHAIN_ID) === -1) {
    test('Create liquidity pool legacy', async ({ page }) => {
      await createPool(page, PoolType.LEGACY)
      // todo: assert pool creation
    })
  } else {
    test('Create liquidity pool trident classic', async ({ page }) => {
      await createPool(page, PoolType.CLASSIC, PoolFeeTier.HIGH)
      // todo: assert pool creation
    })

    test('Create liquidity pool trident stable', async ({ page }) => {
      await createPool(page, PoolType.STABLE, PoolFeeTier.LOWEST)
      // todo: assert pool creation
    })
  }
})

async function createPool(page: Page, poolType: PoolType, fee = '03') {
  // Deploy fake token
  const fakeToken = await deployFakeToken(CHAIN_ID)

  if (poolType !== PoolType.LEGACY) {
    // Select pool type
    await page.locator('[testdata-id=earn-pool-select-type-button]').click()
    await page.locator(`[testdata-id=earn-pool-type-selector-${PoolType[poolType].toLowerCase()}]`).click()

    // Select fee tier
    await page.locator('[testdata-id=earn-pool-select-fee-tier-button]').click()
    await page.locator(`[testdata-id=earn-pool-fee-tier-selector-${fee}]`).click()
  }

  // Select token 1 (Native)
  await page.locator('[testdata-id=earn-add-input-currency-1-button]').click()
  await page
    .locator(`[testdata-id=earn-add-input-currency-1-token-selector-dialog-address-input]`)
    .fill(NATIVE_TOKEN.symbol)
  await page
    .locator(`[testdata-id=earn-add-input-currency-1-token-selector-dialog-row-${NATIVE_TOKEN.address}]`)
    .click()

  // Select token 2 (Fake token)
  await page.locator('[testdata-id=earn-add-input-currency-2-button]').click()
  await page
    .locator(`[testdata-id=earn-add-input-currency-2-token-selector-dialog-address-input]`)
    .fill(fakeToken.address)
  timeout(3_000) //can take some time to load the token
  await page.locator(`[testdata-id=import-input-currency-token-selector-dialog-row-${fakeToken.address}]`).click()
  await page.locator(`[testdata-id=import-input-currency-token-confirm-button-${fakeToken.address}]`).click()
  timeout(2_000) //wait for the modal to disappear

  // Input amounts
  await page.locator('[testdata-id=earn-add-input-currency-2-input]').fill(AMOUNT)
  await page.locator('[testdata-id=earn-add-input-currency-1-input]').fill(AMOUNT)

  // Create pool
  if (poolType === PoolType.LEGACY) {
    await page.locator(`[testdata-id=earn-add-legacy-button]`).click()
  } else {
    await page.locator(`[testdata-id=earn-create-trident-button]`).click()
    // Approve BentoBox
    await page
      .locator('[testdata-id=create-trident-approve-bentobox-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`BentoBox Approved`)
      })
      .catch(() => console.log('BentoBox already approved or not needed'))
  }

  // Approve Token
  await page
    .locator(
      `[testdata-id=${
        poolType === PoolType.LEGACY
          ? 'earn-add-section-review-approve-token-2-button'
          : 'create-trident-approve-token1-button'
      }]`
    )
    .click({ timeout: 1500 })
    .then(async () => {
      console.log(`${fakeToken.address} Approved`)
    })
    .catch(() => console.log(`${fakeToken.address} already approved or not needed`))

  const confirmCreatePoolButton = page.locator(
    `[testdata-id=${
      poolType === PoolType.LEGACY ? 'earn-add-legacy-review-modal-add-button' : 'earn-create-review-modal-add-button'
    }]`
  )
  await expect(confirmCreatePoolButton).toBeEnabled()
  await confirmCreatePoolButton.click()
}
