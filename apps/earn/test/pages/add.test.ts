import { AddressZero } from '@ethersproject/constants'
import { test } from '@playwright/test'
import { Native } from '@sushiswap/currency'
import { selectNetwork, Token } from 'test/utils'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)
const NATIVE_TOKEN: Token = {
  address: AddressZero,
  symbol: Native.onChain(CHAIN_ID).symbol,
}

test.describe('Add liquidity', () => {
  test('Create liquidity pool trident classic', async ({ page }) => {
    const url = (process.env.PLAYWRIGHT_URL as string).concat('/add')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    // Select pool network
    await page.locator('[testdata-id=earn-add-select-network]').click()
    await page.locator(`[testdata-id=network-selector-${CHAIN_ID}]`).click()

    // Select pool type
    await page.locator('[testdata-id=earn-pool-select-type-button]').click()

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
    await page.locator('[testdata-id=earn-add-input-currency-1-button]').click()
    await page
      .locator(`[testdata-id=earn-add-input-currency-1-token-selector-dialog-address-input]`)
      .fill('address of the fake token')
    await page
      .locator(`[testdata-id=import-input-currency-token-selector-dialog-row-${'address of the fake token'}]`)
      .click()
  })
})
