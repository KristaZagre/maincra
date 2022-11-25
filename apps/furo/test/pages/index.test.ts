import { expect, test } from '@playwright/test'
import { chainName } from '@sushiswap/chain'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

const CHAIN_ID = parseInt(process.env.CHAIN_ID)

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    console.log(err)
  })
  await page.goto(process.env.PLAYWRIGHT_URL as string)
  await page.locator(`[testdata-id=network-selector-button]`).click()
  const networkList = page.locator(`[testdata-id=network-selector-list]`)
  const desiredNetwork = networkList.getByText(chainName[CHAIN_ID])
  expect(desiredNetwork).toBeVisible()
  await desiredNetwork.click()

  if (await desiredNetwork.isVisible()) {
    await page.locator(`[testdata-id=network-selector-button]`).click()
  }
})



test.describe('Create stream', () => {

  test('Create a stream', async ({ page }) => {
    const createStreamLink = page.locator('[testdata-id=furo-landing-pay-someone-button]')
    await createStreamLink.click()

    // Expects the URL to contain intro.
    await expect(page).toHaveURL(process.env.PLAYWRIGHT_URL + '/stream/create')
  })

  
  // test('Create a stream using bentobox balance', async ({ page }) => {
 
  // })

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


function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
