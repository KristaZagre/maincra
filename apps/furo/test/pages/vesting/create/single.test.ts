import { AddressZero } from '@ethersproject/constants'
import { expect, test } from '@playwright/test'
import { Native } from '@sushiswap/currency'
import { selectDate, selectNetwork, timeout, Token } from 'test/utils'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)
const RECIPIENT = '0x23defc2ca207e7fbd84ae43b00048fb5cb4db5b2'
const NATIVE_TOKEN: Token = {
  address: AddressZero,
  symbol: Native.onChain(CHAIN_ID).symbol,
}

test.describe('Create vest', () => {
  test('Graded', async ({ page }) => {
    const url = (process.env.PLAYWRIGHT_URL as string).concat('/vesting/create/single')
    await page.goto(url)
    await selectNetwork(page, CHAIN_ID)

    const amount = '1'
    const amountOfPeriods = '5'
    const totalAmount = (parseFloat(amount) * parseFloat(amountOfPeriods)).toString()

    // Token selector
    await page.locator(`[testdata-id=token-selector-button]`).click()
    await page.fill(`[testdata-id=create-single-vest-token-selector-dialog-address-input]`, NATIVE_TOKEN.symbol)
    await timeout(1000) // wait for the list to load instead of using timeout

    await page.locator(`[testdata-id=create-single-vest-token-selector-dialog-row-${NATIVE_TOKEN.address}]`).click()

    // Date
    await selectDate('vesting-start-date', 1, page)

    // Recipient
    await page.locator(`[testdata-id=create-vest-recipient-input]`).fill(RECIPIENT)

    // Fund source
    await page.locator(`[testdata-id=fund-source-wallet-button]`).click()

    // Amount
    await page.locator('[testdata-id=create-vest-graded-step-amount-input]').fill(amount)

    // Amount of periods
    await page.locator('[testdata-id=furo-graded-vesting-step-amount-input]').fill(amountOfPeriods)
    await page.locator('[testdata-id=furo-graded-vesting-step-amount-add-button]').click()
    await page.locator('[testdata-id=furo-graded-vesting-step-amount-minus-button]').click()

    // Edit period length
    await page.locator('[testdata-id=furo-select-period-length-button]').click()
    await page.locator('text=Bi-weekly').click()

    // Review
    await page.locator('[testdata-id=furo-review-vesting-button]').click()

    // add expect to check if data displayed is correct
    await expect(page.locator('[testdata-id=furo-review-modal-funds-source]')).toContainText('wallet')
    await expect(page.locator('[testdata-id=furo-review-modal-total-amount]')).toContainText(totalAmount)
    await expect(page.locator('[testdata-id=furo-review-modal-payment-per-period]')).toContainText(
      `${amount} ${NATIVE_TOKEN.symbol}`
    )
    await expect(page.locator('[testdata-id=furo-review-modal-period-length]')).toContainText('Bi-weekly')
    await expect(page.locator('[testdata-id=furo-review-modal-amount-of-periods]')).toContainText(amountOfPeriods)

    // Approve BentoBox
    await page
      .locator('[testdata-id=furo-create-single-vest-approve-bentobox-button]')
      .click({ timeout: 1500 })
      .then(async () => {
        console.log(`BentoBox Approved`)
      })
      .catch(() => console.log('BentoBox already approved or not needed'))

    // Confirm creation
    await timeout(1000) //confirm button can take some time to appear
    const confirmCreateVestingButton = page.locator('[testdata-id=furo-create-single-vest-confirm-button]')
    expect(confirmCreateVestingButton).toBeEnabled()
    await confirmCreateVestingButton.click()

    const expectedText = new RegExp(`Created .* ${NATIVE_TOKEN.symbol} vesting`)
    await expect(page.locator('div', { hasText: expectedText }).last()).toContainText(expectedText)
  })
  //   test('Cliff', async() => {
  //   })
  //   test('Hybrid', async() => {
  //   })
})

// test.describe('Create vest with balance from bentobox', () => {

// })
