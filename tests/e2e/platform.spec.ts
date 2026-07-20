import { test, expect } from './fixtures/base'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.describe('Tool persistence (D2)', () => {
  test('Format Text: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('format-text')
    await page.locator('textarea').first().fill('PERSIST-FORMAT-TEXT-42')
    await page.waitForTimeout(1000) // debounce is 800ms
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-FORMAT-TEXT-42')
  })

  test('Hash Generator: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('hash-generator')
    await page.locator('textarea').first().fill('PERSIST-HASH-GEN-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-HASH-GEN-42')
  })

  test('Base64 Tools: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
    await page.locator('textarea').first().fill('PERSIST-BASE64-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-BASE64-42')
  })

  test('Base64 Tools: Clear shows an Undo toast that restores the input', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
    await page.locator('textarea').first().fill('UNDO-ME-BASE64')
    await page.locator('.tool-actions button:has-text("Clear")').click()
    await expect(page.locator('textarea').first()).toHaveValue('')

    const undo = page.locator('.toast-action', { hasText: 'Undo' })
    await expect(undo).toBeVisible()
    await undo.click()
    await expect(page.locator('textarea').first()).toHaveValue('UNDO-ME-BASE64')
  })
})
