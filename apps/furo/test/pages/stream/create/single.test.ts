import { AddressZero } from '@ethersproject/constants'
import { expect, test } from '@playwright/test'
import { Native } from '@sushiswap/currency'
import { depositToBento, selectDate, selectNetwork, timeout, Token } from 'test/utils'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)
const RECIPIENT = '0x23defc2ca207e7fbd84ae43b00048fb5cb4db5b2'
const NATIVE_TOKEN: Token = {
  address: AddressZero,
  symbol: Native.onChain(CHAIN_ID).symbol,
}

const WNATIVE_TOKEN = {
  address: Native.onChain(CHAIN_ID).wrapped.address.toLowerCase(),
  symbol: Native.onChain(CHAIN_ID).wrapped.symbol ?? 'WETH',
}

test.describe('Create stream', () => {
  test('Create a stream, native token', async ({ page }) => {
    const url = (process.env.PLAYWRIGHT_URL as string).concat('/stream/create/single')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    // Date
    await selectDate('stream-start-date', 1, page)
    await selectDate('stream-end-date', 2, page)

    // Recipient
    await page.locator(`[testdata-id=create-stream-recipient-input]`).fill(RECIPIENT)

    // Token selector
    await page.locator(`[testdata-id=token-selector-button]`).click()
    await page.fill(`[testdata-id=create-single-stream-token-selector-dialog-address-input]`, NATIVE_TOKEN.symbol)
    await timeout(1000) // wait for the list to load instead of using timeout

    await page.locator(`[testdata-id=create-single-stream-token-selector-dialog-row-${NATIVE_TOKEN.address}]`).click()

    // Fund source
    await page.locator(`[testdata-id=fund-source-wallet-button]`).click()

    // Amount
    const amount = '10'
    await page.locator('[testdata-id=create-stream-amount-input]').fill(amount)

    await page
      .locator('[testdata-id=furo-create-single-stream-approve-bentobox-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`BentoBox Approved`)
      })
      .catch(() => console.log('BentoBox already approved or not needed'))

    const confirmCreateStreamButton = page.locator(`[testdata-id=furo-create-single-stream-confirm-button]`)

    await expect(confirmCreateStreamButton).toBeEnabled()
    await confirmCreateStreamButton.click()

    const expectedText = new RegExp(`Created .* ${NATIVE_TOKEN.symbol} stream`)
    await expect(page.locator('div', { hasText: expectedText }).last()).toContainText(expectedText)
  })

  test('Create a stream using bentobox balance', async ({ page }) => {
    //deposit 1 native to bentobox
    const amount = '10.0'
    await depositToBento(amount, CHAIN_ID)

    const url = (process.env.PLAYWRIGHT_URL as string).concat('/stream/create/single')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    // Date
    await selectDate('stream-start-date', 1, page)
    await selectDate('stream-end-date', 2, page)

    // Recipient
    await page.locator(`[testdata-id=create-stream-recipient-input]`).fill(RECIPIENT)

    // Token selector
    await page.locator(`[testdata-id=token-selector-button]`).click()
    await page.fill(`[testdata-id=create-single-stream-token-selector-dialog-address-input]`, WNATIVE_TOKEN.symbol)
    await timeout(1000) // wait for the list to load instead of using timeout

    await page
      .locator(`[testdata-id=create-single-stream-token-selector-dialog-row-${WNATIVE_TOKEN.address.toLowerCase()}]`)
      .click()

    // Fund source
    await page.locator(`[testdata-id=fund-source-bentobox-button]`).click()

    // Amount
    await page.locator('[testdata-id=create-stream-amount-input]').fill(amount)

    // Approve BentoBox
    await page
      .locator('[testdata-id=furo-create-single-stream-approve-bentobox-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`BentoBox Approved`)
      })
      .catch(() => console.log('BentoBox already approved or not needed'))

    // Approve Token
    await page
      .locator('[testdata-id=furo-create-single-stream-approve-token-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`${WNATIVE_TOKEN.symbol} Approved`)
      })
      .catch(() => console.log(`${WNATIVE_TOKEN.symbol} already approved or not needed`))

    const confirmCreateStreamButton = page.locator(`[testdata-id=furo-create-single-stream-confirm-button]`)

    await expect(confirmCreateStreamButton).toBeEnabled()
    await confirmCreateStreamButton.click()

    const expectedText = new RegExp(`Created .* ${WNATIVE_TOKEN.symbol} stream`)
    await expect(page.locator('div', { hasText: expectedText }).last()).toContainText(expectedText)
  })
})
