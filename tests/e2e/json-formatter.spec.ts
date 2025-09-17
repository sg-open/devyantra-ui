import { test, expect } from './fixtures/base'

test.describe('JSON Formatter Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('format-text')
  })

  test('should have the JSON formatter interface', async ({ page }) => {
    // Check for main UI elements
    await expect(page.locator('textarea').first()).toBeVisible()
    await expect(page.locator('textarea').nth(1)).toBeVisible()

    // Check for format button
    const formatButton = page.locator('button', { hasText: /format/i })
    await expect(formatButton).toBeVisible()

    // Check for clear button
    const clearButton = page.locator('button', { hasText: /clear/i })
    await expect(clearButton).toBeVisible()
  })

  test('should format valid JSON correctly', async ({ page }) => {
    const compactJson = '{"name":"John","age":30,"city":"New York","hobbies":["reading","coding"]}'
    const expectedFormatted = `{
  "name": "John",
  "age": 30,
  "city": "New York",
  "hobbies": [
    "reading",
    "coding"
  ]
}`

    // Input compact JSON
    await page.locator('textarea').first().fill(compactJson)

    // Click format button
    await page.click('button:has-text("Format")')

    // Wait for formatting to complete
    await page.waitForTimeout(500)

    // Check that output textarea has formatted JSON
    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    // Verify JSON is properly formatted (normalized whitespace comparison)
    const normalizedExpected = expectedFormatted.replace(/\s+/g, ' ').trim()
    const normalizedActual = formattedValue.replace(/\s+/g, ' ').trim()

    expect(normalizedActual).toContain('"name": "John"')
    expect(normalizedActual).toContain('"age": 30')
    expect(normalizedActual).toContain('"hobbies"')
  })

  test('should handle invalid JSON gracefully', async ({ page }) => {
    const invalidJson = '{"name": "John", "age": 30,'

    // Input invalid JSON
    await page.locator('textarea').first().fill(invalidJson)

    // Click format button
    await page.click('button:has-text("Format")')

    // Wait for error handling
    await page.waitForTimeout(500)

    // Check for error message or toast
    const errorElements = page.locator('.p-toast-error, .error-message, .p-message-error')
    await expect(errorElements).toHaveCount.greaterThan(0)
  })

  test('should detect JSON automatically', async ({ page }) => {
    const jsonData = '{"status": "success", "data": {"users": [{"id": 1, "name": "Alice"}]}}'

    // Input JSON without specifying type
    await page.locator('textarea').first().fill(jsonData)

    // Click format button
    await page.click('button:has-text("Format")')

    // Wait for auto-detection and formatting
    await page.waitForTimeout(500)

    // Check that type indicator shows JSON
    const typeIndicator = page.locator('.type-indicator, .detected-type')
    if (await typeIndicator.count() > 0) {
      await expect(typeIndicator).toContainText(/json/i)
    }

    // Verify formatted output
    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    expect(formattedValue).toContain('"status"')
    expect(formattedValue).toContain('"data"')
    expect(formattedValue.length).toBeGreaterThan(jsonData.length) // Should be formatted with whitespace
  })

  test('should handle nested JSON objects', async ({ page }) => {
    const nestedJson = '{"user":{"profile":{"personal":{"name":"John","age":30},"preferences":{"theme":"dark","language":"en"}},"permissions":{"admin":false,"read":true,"write":true}}}'

    await page.locator('textarea').first().fill(nestedJson)
    await page.click('button:has-text("Format")')
    await page.waitForTimeout(500)

    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    // Verify nested structure is properly formatted
    expect(formattedValue).toContain('  "user": {')
    expect(formattedValue).toContain('    "profile": {')
    expect(formattedValue).toContain('      "personal": {')
  })

  test('should handle JSON arrays', async ({ page }) => {
    const jsonArray = '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"},{"id":3,"name":"Charlie"}]'

    await page.locator('textarea').first().fill(jsonArray)
    await page.click('button:has-text("Format")')
    await page.waitForTimeout(500)

    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    // Verify array is properly formatted
    expect(formattedValue).toContain('[\n')
    expect(formattedValue).toContain('  {\n')
    expect(formattedValue).toContain('    "id": 1')
    expect(formattedValue).toContain('    "name": "Alice"')
  })

  test('should clear input and output', async ({ page }) => {
    const sampleJson = '{"test": "data"}'

    // Fill both textareas
    await page.locator('textarea').first().fill(sampleJson)
    await page.click('button:has-text("Format")')
    await page.waitForTimeout(500)

    // Click clear button
    await page.click('button:has-text("Clear")')

    // Verify both textareas are cleared
    const inputTextarea = page.locator('textarea').first()
    const outputTextarea = page.locator('textarea').nth(1)

    await expect(inputTextarea).toHaveValue('')
    await expect(outputTextarea).toHaveValue('')
  })

  test('should copy formatted JSON to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const jsonData = '{"message":"hello world"}'

    await page.locator('textarea').first().fill(jsonData)
    await page.click('button:has-text("Format")')
    await page.waitForTimeout(500)

    // Look for copy button
    const copyButton = page.locator('button[title*="copy"], button:has-text("Copy"), .copy-button')

    if (await copyButton.count() > 0) {
      await copyButton.first().click()

      // Wait for copy operation
      await page.waitForTimeout(500)

      // Verify clipboard content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText).toContain('"message"')
      expect(clipboardText).toContain('"hello world"')
    }
  })

  test('should handle SQL formatting detection', async ({ page }) => {
    const sqlQuery = 'SELECT * FROM users WHERE age > 18 AND status = "active" ORDER BY name'

    await page.locator('textarea').first().fill(sqlQuery)
    await page.click('button:has-text("Format")')
    await page.waitForTimeout(500)

    // Check that SQL is detected and formatted
    const typeIndicator = page.locator('.type-indicator, .detected-type')
    if (await typeIndicator.count() > 0) {
      await expect(typeIndicator).toContainText(/sql/i)
    }

    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    // SQL should be formatted with proper line breaks
    expect(formattedValue).toContain('SELECT')
    expect(formattedValue).toContain('FROM')
    expect(formattedValue).toContain('WHERE')
  })

  test('should handle large JSON files', async ({ page }) => {
    // Create a reasonably large JSON object
    const largeJsonData = {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User${i + 1}`,
        email: `user${i + 1}@example.com`,
        profile: {
          age: 20 + (i % 50),
          location: `City${i % 10}`,
          preferences: {
            theme: i % 2 === 0 ? 'dark' : 'light',
            notifications: true
          }
        }
      }))
    }

    const largeJsonString = JSON.stringify(largeJsonData)

    await page.locator('textarea').first().fill(largeJsonString)
    await page.click('button:has-text("Format")')

    // Wait longer for large JSON processing
    await page.waitForTimeout(2000)

    const outputTextarea = page.locator('textarea').nth(1)
    const formattedValue = await outputTextarea.inputValue()

    // Verify it was formatted correctly
    expect(formattedValue.length).toBeGreaterThan(largeJsonString.length)
    expect(formattedValue).toContain('  "users": [')
    expect(formattedValue).toContain('    {')
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that textareas are still accessible
    const inputTextarea = page.locator('textarea').first()
    const outputTextarea = page.locator('textarea').nth(1)

    await expect(inputTextarea).toBeVisible()
    await expect(outputTextarea).toBeVisible()

    // Test functionality on mobile
    const mobileJson = '{"mobile": "test", "responsive": true}'
    await inputTextarea.fill(mobileJson)

    const formatButton = page.locator('button:has-text("Format")')
    await expect(formatButton).toBeVisible()
    await formatButton.click()

    await page.waitForTimeout(500)

    // Verify formatting still works on mobile
    const formattedValue = await outputTextarea.inputValue()
    expect(formattedValue).toContain('"mobile": "test"')
  })

  test('should handle minification', async ({ page }) => {
    const formattedJson = `{
  "name": "John",
  "age": 30,
  "hobbies": [
    "reading",
    "coding"
  ]
}`

    await page.locator('textarea').first().fill(formattedJson)

    // Look for minify button or compact option
    const minifyButton = page.locator('button:has-text("Minify"), button:has-text("Compact")')

    if (await minifyButton.count() > 0) {
      await minifyButton.click()
      await page.waitForTimeout(500)

      const outputTextarea = page.locator('textarea').nth(1)
      const minifiedValue = await outputTextarea.inputValue()

      // Should be compact (no unnecessary whitespace)
      expect(minifiedValue).not.toContain('\n  ')
      expect(minifiedValue).toContain('{"name":"John"')
    } else {
      // If no explicit minify button, format should still work
      await page.click('button:has-text("Format")')
      await page.waitForTimeout(500)

      const outputTextarea = page.locator('textarea').nth(1)
      const formattedValue = await outputTextarea.inputValue()
      expect(formattedValue).toContain('"name"')
    }
  })
})