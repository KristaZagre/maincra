import { expect, test } from '@playwright/test'

if (!process.env.CHAIN_ID) {
  throw new Error('CHAIN_ID env var not set')
}

test.beforeEach(async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_URL as string)
  page.on('pageerror', (err) => {
    console.log(err.message)
  })
})



test.describe('Create stream', () => {

  test('Create a stream', async ({ page }) => {
 
    const createStreamLink = page.locator('[testdata-id=create-stream-button]')
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