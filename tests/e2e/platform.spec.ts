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

  test('JWT Decoder: token survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('jwt-decoder')
    await page.locator('textarea').first().fill('PERSIST-JWT-TOKEN-42')
    await page.waitForTimeout(1000) // debounce is 800ms
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-JWT-TOKEN-42')
  })

  test('Character Count: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('character-count')
    await page.locator('textarea').first().fill('PERSIST-CHARCOUNT-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-CHARCOUNT-42')
  })

  test('Delimiter Tool: delimited-text panel survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('delimiter')
    await page.locator('textarea').first().fill('PERSIST-DELIM-42,x,y')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-DELIM-42,x,y')
  })

  test('Timestamp Converter: unit + datetime survive reload (numeric timestamp value does not — known quirk, see task-10-report.md)', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('timestamp-converter')
    await page.locator('.timestamp-input, input[type="number"]').fill('1712345678')
    await page.locator('.datetime-input, input[type="datetime-local"]').fill('2024-06-01T10:30')
    await page.locator('.toggle-btn:has-text("ms")').click()
    await page.waitForTimeout(1000)
    await page.reload()

    // Unit (a plain string ref) restores.
    await expect(page.locator('.toggle-btn:has-text("ms")')).toHaveClass(/active/)
    // Datetime (a plain string ref, never number-cast) restores.
    await expect(page.locator('.datetime-input, input[type="datetime-local"]')).toHaveValue('2024-06-01T10:30')
    // NOT asserted: the numeric timestamp input itself. inputTimestamp is a
    // string ref (`ref('')`), but v-model on <input type="number"> casts any
    // non-empty entry to a `number` (@vue/runtime-dom vModelText castToNumber).
    // On reload, the fresh '' (string) ref fails useToolState's strict typeof
    // match, so the stored number is silently skipped — this value does NOT
    // restore. Accepted per the platform-track plan.
  })
})
