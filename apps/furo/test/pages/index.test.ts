import { AddressZero } from '@ethersproject/constants'
import { parseUnits } from '@ethersproject/units'
import { expect, Page, test } from '@playwright/test'
import { chainName } from '@sushiswap/chain'
import { Native, WNATIVE_ADDRESS } from '@sushiswap/currency'
import { Contract } from 'ethers'
import { BENTOBOX_ADDRESS, BENTOBOX_DEPOSIT_ABI, getProvider, getSigners } from 'test/utils'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)
const RECIPIENT = '0x23defc2ca207e7fbd84ae43b00048fb5cb4db5b2'
const NATIVE_TOKEN: Token = {
  address: AddressZero,
  symbol: Native.onChain(CHAIN_ID).symbol,
}
const WNATIVE_TOKEN: Token = {
  address: WNATIVE_ADDRESS[CHAIN_ID],
  symbol: `W${NATIVE_TOKEN.symbol}`,
}

test.describe('Create stream', () => {
  test('Create a stream, native token', async ({ page }) => {
    const url = (process.env.PLAYWRIGHT_URL as string).concat('/stream/create/single')
    await page.goto(url)
    await selectNetwork(page)

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
    await depositToBento(amount)

    const url = (process.env.PLAYWRIGHT_URL as string).concat('/stream/create/single')
    await page.goto(url)
    await selectNetwork(page)

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

    await page
      .locator('[testdata-id=furo-create-single-stream-approve-token-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`WMATIC Approved`)
      })
      .catch(() => console.log('WMATIC already approved or not needed'))

    const confirmCreateStreamButton = page.locator(`[testdata-id=furo-create-single-stream-confirm-button]`)

    await expect(confirmCreateStreamButton).toBeEnabled()
    await confirmCreateStreamButton.click()

    const expectedText = new RegExp(`Created .* W${NATIVE_TOKEN.symbol} stream`)
    await expect(page.locator('div', { hasText: expectedText }).last()).toContainText(expectedText)
  })
})

// test.describe('Create vest', () => {

//   test('Graded', async() => {

//   })

//   test('Cliff', async() => {

//   })

//   test('Hybrid', async() => {

//   })

// })

// test.describe('Create vest with balance from bentobox', () => {

// })

async function selectNetwork(page: Page) {
  await page.locator(`[testdata-id=network-selector-button]`).click()
  const networkList = page.locator(`[testdata-id=network-selector-list]`)
  const desiredNetwork = networkList.getByText(chainName[CHAIN_ID])
  expect(desiredNetwork).toBeVisible()
  await desiredNetwork.click()

  if (await desiredNetwork.isVisible()) {
    await page.locator(`[testdata-id=network-selector-button]`).click()
  }
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface Token {
  address: string
  symbol: string
}

async function selectDate(testDataId: string, months: number, page: Page) {
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

async function depositToBento(amount: string) {
  const amountToSend = parseUnits(amount, 'ether').add(parseUnits('100.0', 'gwei')) //add 100 gwei so we actually get the amount asked as bentobox round down
  const signer = getSigners()[0].connect(getProvider({ chainId: CHAIN_ID }))
  const bentoContract = new Contract(BENTOBOX_ADDRESS[CHAIN_ID], BENTOBOX_DEPOSIT_ABI, signer)
  await bentoContract.deposit(
    '0x0000000000000000000000000000000000000000',
    signer.address,
    signer.address,
    amountToSend,
    0,
    { value: amountToSend }
  )
}
