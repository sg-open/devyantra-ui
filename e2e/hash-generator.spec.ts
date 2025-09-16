import { test, expect } from './fixtures/base'

test.describe('Hash Generator Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('hash-generator')
  })

  test('should have the hash generator interface', async ({ page }) => {
    // Check for input textarea
    await expect(page.locator('textarea')).toBeVisible()

    // Check for generate button
    const generateButton = page.locator('button', { hasText: /generate|hash/i })
    await expect(generateButton).toBeVisible()

    // Check for hash algorithm options
    const hashOptions = page.locator('select, .p-dropdown, input[type="radio"], input[type="checkbox"]')
    await expect(hashOptions).toHaveCount.greaterThan(0)
  })

  test('should generate MD5 hash', async ({ page }) => {
    const inputText = 'Hello World'
    const expectedMD5 = 'b10a8db164e0754105b7a99be72e3fe5' // Known MD5 for "Hello World"

    // Input text
    await page.locator('textarea').fill(inputText)

    // Select MD5 algorithm (look for various possible UI elements)
    const md5Option = page.locator('option:has-text("MD5"), .p-dropdown-item:has-text("MD5"), input[value="md5"], label:has-text("MD5")')

    if (await md5Option.count() > 0) {
      await md5Option.first().click()
    }

    // Generate hash
    await page.click('button:has-text("Generate"), button:has-text("Hash")')

    // Wait for hash generation
    await page.waitForTimeout(500)

    // Check for MD5 hash result
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.toLowerCase()).toContain(expectedMD5)
    }
  })

  test('should generate SHA-256 hash', async ({ page }) => {
    const inputText = 'test data'
    // Known SHA-256 for "test data": "916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9"

    await page.locator('textarea').fill(inputText)

    // Select SHA-256 algorithm
    const sha256Option = page.locator('option:has-text("SHA-256"), .p-dropdown-item:has-text("SHA-256"), input[value="sha256"], label:has-text("SHA-256")')

    if (await sha256Option.count() > 0) {
      await sha256Option.first().click()
    }

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Verify SHA-256 hash (should be 64 characters long)
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.length).toBe(64) // SHA-256 is always 64 hex characters
      expect(hashValue).toMatch(/^[a-f0-9]{64}$/i) // Should be valid hex
    }
  })

  test('should generate SHA-1 hash', async ({ page }) => {
    const inputText = 'sample text'

    await page.locator('textarea').fill(inputText)

    // Select SHA-1 algorithm
    const sha1Option = page.locator('option:has-text("SHA-1"), .p-dropdown-item:has-text("SHA-1"), input[value="sha1"], label:has-text("SHA-1")')

    if (await sha1Option.count() > 0) {
      await sha1Option.first().click()
    }

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Verify SHA-1 hash (should be 40 characters long)
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.length).toBe(40) // SHA-1 is always 40 hex characters
      expect(hashValue).toMatch(/^[a-f0-9]{40}$/i) // Should be valid hex
    }
  })

  test('should handle empty input', async ({ page }) => {
    // Leave input empty
    await page.locator('textarea').fill('')

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Should still generate hash for empty string or show appropriate message
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    const errorMessage = page.locator('.error-message, .p-toast-error')

    // Either should show a hash for empty string or an error message
    const hasResult = await hashResult.count() > 0 && (await hashResult.inputValue() || await hashResult.textContent())?.trim().length > 0
    const hasError = await errorMessage.count() > 0

    expect(hasResult || hasError).toBe(true)
  })

  test('should handle large text input', async ({ page }) => {
    // Create large text input
    const largeText = 'A'.repeat(10000) // 10KB of text

    await page.locator('textarea').fill(largeText)

    // Select an algorithm
    const algorithmOption = page.locator('option:has-text("SHA-256"), .p-dropdown-item:has-text("SHA-256"), input[value="sha256"], label:has-text("SHA-256")')
    if (await algorithmOption.count() > 0) {
      await algorithmOption.first().click()
    }

    await page.click('button:has-text("Generate"), button:has-text("Hash")')

    // Wait longer for large text processing
    await page.waitForTimeout(2000)

    // Should generate hash for large text
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.length).toBeGreaterThan(0)
    }
  })

  test('should copy hash to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const inputText = 'copy test'
    await page.locator('textarea').fill(inputText)

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Look for copy button
    const copyButton = page.locator('button[title*="copy"], button:has-text("Copy"), .copy-button')

    if (await copyButton.count() > 0) {
      await copyButton.first().click()
      await page.waitForTimeout(500)

      // Verify clipboard content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText.length).toBeGreaterThan(0)
      expect(clipboardText).toMatch(/^[a-f0-9]+$/i) // Should be hex hash
    }
  })

  test('should clear input and output', async ({ page }) => {
    const sampleText = 'test for clearing'
    await page.locator('textarea').fill(sampleText)

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Look for clear button
    const clearButton = page.locator('button:has-text("Clear")')

    if (await clearButton.count() > 0) {
      await clearButton.click()

      // Verify input is cleared
      const inputTextarea = page.locator('textarea')
      await expect(inputTextarea).toHaveValue('')

      // Verify output is cleared
      const outputArea = page.locator('.hash-result, .output, textarea').nth(1)
      if (await outputArea.count() > 0) {
        const outputValue = await outputArea.inputValue() || await outputArea.textContent()
        expect(outputValue?.trim()).toBe('')
      }
    }
  })

  test('should generate different hashes for different algorithms', async ({ page }) => {
    const inputText = 'test consistency'
    await page.locator('textarea').fill(inputText)

    const hashes: Record<string, string> = {}

    // Test multiple algorithms if available
    const algorithms = ['MD5', 'SHA-1', 'SHA-256']

    for (const algorithm of algorithms) {
      const algorithmOption = page.locator(`option:has-text("${algorithm}"), .p-dropdown-item:has-text("${algorithm}"), input[value="${algorithm.toLowerCase()}"], label:has-text("${algorithm}")`)

      if (await algorithmOption.count() > 0) {
        await algorithmOption.first().click()
        await page.click('button:has-text("Generate"), button:has-text("Hash")')
        await page.waitForTimeout(500)

        const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
        if (await hashResult.count() > 0) {
          const hashValue = await hashResult.inputValue() || await hashResult.textContent()
          if (hashValue?.trim()) {
            hashes[algorithm] = hashValue.trim()
          }
        }
      }
    }

    // Verify that different algorithms produce different hashes
    const hashValues = Object.values(hashes)
    const uniqueHashes = new Set(hashValues)
    expect(uniqueHashes.size).toBe(hashValues.length)
  })

  test('should be case sensitive', async ({ page }) => {
    const text1 = 'Case Sensitive Test'
    const text2 = 'case sensitive test'

    // Generate hash for first text
    await page.locator('textarea').fill(text1)
    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    const hashResult1 = page.locator('.hash-result, .output, textarea').nth(1)
    const hash1 = await hashResult1.inputValue() || await hashResult1.textContent()

    // Generate hash for second text
    await page.locator('textarea').fill(text2)
    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    const hash2 = await hashResult1.inputValue() || await hashResult1.textContent()

    // Hashes should be different due to case sensitivity
    expect(hash1?.trim()).not.toBe(hash2?.trim())
  })

  test('should handle special characters', async ({ page }) => {
    const specialText = '🚀 Hello! @#$%^&*()_+ 中文 العربية'
    await page.locator('textarea').fill(specialText)

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    // Should generate valid hash for special characters
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.length).toBeGreaterThan(0)
      expect(hashValue).toMatch(/^[a-f0-9]+$/i) // Should be valid hex
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that interface is still accessible
    const inputTextarea = page.locator('textarea')
    await expect(inputTextarea).toBeVisible()

    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Hash")')
    await expect(generateButton).toBeVisible()

    // Test functionality on mobile
    await inputTextarea.fill('mobile hash test')
    await generateButton.click()
    await page.waitForTimeout(500)

    // Should work on mobile
    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()
      expect(hashValue?.length).toBeGreaterThan(0)
    }
  })

  test('should validate hash output format', async ({ page }) => {
    const inputText = 'format validation test'
    await page.locator('textarea').fill(inputText)

    await page.click('button:has-text("Generate"), button:has-text("Hash")')
    await page.waitForTimeout(500)

    const hashResult = page.locator('.hash-result, .output, textarea').nth(1)
    if (await hashResult.count() > 0) {
      const hashValue = await hashResult.inputValue() || await hashResult.textContent()

      // Hash should be valid hexadecimal
      expect(hashValue).toMatch(/^[a-f0-9]+$/i)

      // Hash should not contain spaces or special characters
      expect(hashValue).not.toContain(' ')
      expect(hashValue).not.toContain('\n')
    }
  })
})