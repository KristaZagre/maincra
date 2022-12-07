import { AddressZero } from '@ethersproject/constants'
import { expect, test } from '@playwright/test'
import { Native } from '@sushiswap/currency'
import { deployFakeToken, selectNetwork, timeout, Token } from 'test/utils'

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
  test('Create liquidity pool trident classic', async ({ page }) => {
    // Deploy fake token
    const fakeToken = await deployFakeToken(CHAIN_ID)

    const url = (process.env.PLAYWRIGHT_URL as string).concat('/add')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    // Select pool network
    await page.locator('[testdata-id=earn-add-select-network]').click()
    await page.locator(`[testdata-id=network-selector-${CHAIN_ID}]`).click()

    // Select pool type
    await page.locator('[testdata-id=earn-pool-select-type-button]').click()
    await page.locator('[testdata-id=earn-pool-type-selector-classic]').click()

    // Select fee tier
    await page.locator('[testdata-id=earn-pool-select-fee-tier-button]').click()
    await page.locator('[testdata-id=earn-pool-fee-tier-selector-03]').click()

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
    await page.locator(`[testdata-id=import-input-currency-token-selector-dialog-row-${fakeToken.address}]`).click()
    await page.locator(`[testdata-id=import-input-currency-token-confirm-button-${fakeToken.address}]`).click()
    timeout(2_000) //wait for the modal to disappear

    // Input amounts
    await page.locator('[testdata-id=earn-add-input-currency-2-input]').fill(AMOUNT)
    await page.locator('[testdata-id=earn-add-input-currency-1-input]').fill(AMOUNT)

    // Create pool
    await page.locator(`[testdata-id=earn-create-trident-button]`).click()
    // Approve BentoBox
    await page
      .locator('[testdata-id=create-trident-approve-bentobox-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`BentoBox Approved`)
      })
      .catch(() => console.log('BentoBox already approved or not needed'))
    // Approve Token
    await page
      .locator('[testdata-id=create-trident-approve-token1-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`${fakeToken.address} Approved`)
      })
      .catch(() => console.log(`${fakeToken.address} already approved or not needed`))

    const confirmCreatePoolButton = page.locator('[testdata-id="earn-create-review-modal-add-button"]')
    await expect(confirmCreatePoolButton).toBeEnabled()
    await confirmCreatePoolButton.click()

    await expect(
      page.locator('div', { hasText: 'Successfully added liquidity to the MATIC/FT pair' }).last()
    ).toContainText('Successfully added liquidity to the MATIC/FT pair')
  })
})
