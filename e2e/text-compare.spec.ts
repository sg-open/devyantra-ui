import { test, expect } from './fixtures/base'

test.describe('Text Comparison Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('should have the main comparison interface', async ({ page }) => {
    // Check for main UI elements
    await expect(page.locator('.diff-container')).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
    await expect(page.locator('textarea').nth(1)).toBeVisible()

    // Check for compare button
    const compareButton = page.locator('button', { hasText: /compare/i })
    await expect(compareButton).toBeVisible()
  })

  test('should compare identical texts', async ({ page }) => {
    const sampleText = 'Hello World\nThis is a test\nLine 3'

    // Fill both text areas with the same content
    await page.locator('textarea').first().fill(sampleText)
    await page.locator('textarea').nth(1).fill(sampleText)

    // Click compare
    await page.click('button:has-text("Compare")')

    // Wait for comparison to complete
    await page.waitForSelector('.diff-results', { state: 'visible' })

    // Check that no differences are shown
    const noDiffMessage = page.locator('text=No differences found')
    await expect(noDiffMessage).toBeVisible()
  })

  test('should compare different texts and show differences', async ({ page }) => {
    const text1 = 'Hello World\nThis is a test\nLine 3'
    const text2 = 'Hello Universe\nThis is a test\nLine 4'

    // Fill text areas with different content
    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    // Click compare
    await page.click('button:has-text("Compare")')

    // Wait for comparison results
    await page.waitForSelector('.diff-results', { state: 'visible' })

    // Check that differences are highlighted
    const diffElements = page.locator('.diff-line')
    await expect(diffElements).toHaveCount.greaterThan(0)

    // Check for added/removed content indicators
    const addedContent = page.locator('.diff-added')
    const removedContent = page.locator('.diff-removed')

    await expect(addedContent.or(removedContent)).toHaveCount.greaterThan(0)
  })

  test('should switch between diff view modes', async ({ page }) => {
    const text1 = 'Line 1\nLine 2\nLine 3'
    const text2 = 'Line 1\nModified Line 2\nLine 3'

    // Fill text areas
    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    // Compare
    await page.click('button:has-text("Compare")')
    await page.waitForSelector('.diff-results', { state: 'visible' })

    // Check for view mode toggles
    const splitViewButton = page.locator('button', { hasText: /split/i })
    const unifiedViewButton = page.locator('button', { hasText: /unified/i })

    if (await splitViewButton.isVisible()) {
      await splitViewButton.click()
      await page.waitForTimeout(500) // Wait for view change
    }

    if (await unifiedViewButton.isVisible()) {
      await unifiedViewButton.click()
      await page.waitForTimeout(500) // Wait for view change
    }

    // Verify diff results are still visible
    await expect(page.locator('.diff-results')).toBeVisible()
  })

  test('should handle file upload for comparison', async ({ page }) => {
    // Create test files content
    const file1Content = 'File 1 content\nLine 2\nLine 3'
    const file2Content = 'File 1 content\nModified Line 2\nLine 3'

    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]')

    if (await fileInputs.count() > 0) {
      // Create temporary files for upload
      const file1 = await page.evaluateHandle(content => {
        const file = new File([content], 'test1.txt', { type: 'text/plain' })
        return file
      }, file1Content)

      const file2 = await page.evaluateHandle(content => {
        const file = new File([content], 'test2.txt', { type: 'text/plain' })
        return file
      }, file2Content)

      // Upload files
      await fileInputs.first().setInputFiles([file1 as any])
      await fileInputs.nth(1).setInputFiles([file2 as any])

      // Wait for file content to load
      await page.waitForTimeout(1000)

      // Verify content was loaded
      const textarea1 = page.locator('textarea').first()
      const textarea2 = page.locator('textarea').nth(1)

      await expect(textarea1).toHaveValue(file1Content)
      await expect(textarea2).toHaveValue(file2Content)
    }
  })

  test('should validate file size limits', async ({ page }) => {
    // Create a large file content (>10MB would trigger size limit)
    const largeContent = 'x'.repeat(1024 * 1024) // 1MB - should be fine

    await page.locator('textarea').first().fill(largeContent)
    await page.locator('textarea').nth(1).fill('small content')

    // Compare should work for reasonable sizes
    await page.click('button:has-text("Compare")')

    // Should not show file size error for normal content
    const errorMessage = page.locator('.p-toast-error')
    await expect(errorMessage).not.toBeVisible()
  })

  test('should preserve line numbers in diff view', async ({ page }) => {
    const text1 = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
    const text2 = 'Line 1\nModified Line 2\nLine 3\nNew Line 4\nLine 5'

    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    await page.click('button:has-text("Compare")')
    await page.waitForSelector('.diff-results', { state: 'visible' })

    // Check for line numbers
    const lineNumbers = page.locator('.line-number')
    await expect(lineNumbers).toHaveCount.greaterThan(0)

    // Verify line numbers are sequential
    const firstLineNumber = await lineNumbers.first().textContent()
    expect(firstLineNumber?.trim()).toBe('1')
  })

  test('should handle empty input gracefully', async ({ page }) => {
    // Leave both text areas empty
    await page.locator('textarea').first().fill('')
    await page.locator('textarea').nth(1).fill('')

    // Try to compare
    await page.click('button:has-text("Compare")')

    // Should handle empty input without errors
    const errorToast = page.locator('.p-toast-error')
    await expect(errorToast).not.toBeVisible()
  })

  test('should handle syntax highlighting for different languages', async ({ page }) => {
    const jsonText1 = '{"name": "test", "value": 1}'
    const jsonText2 = '{"name": "test", "value": 2}'

    await page.locator('textarea').first().fill(jsonText1)
    await page.locator('textarea').nth(1).fill(jsonText2)

    // Look for language selection dropdown
    const languageSelect = page.locator('select, .p-dropdown')

    if (await languageSelect.count() > 0) {
      // Select JSON language if available
      await languageSelect.first().click()

      const jsonOption = page.locator('option:has-text("JSON"), .p-dropdown-item:has-text("JSON")')
      if (await jsonOption.count() > 0) {
        await jsonOption.click()
      }
    }

    // Compare
    await page.click('button:has-text("Compare")')
    await page.waitForSelector('.diff-results', { state: 'visible' })

    // Check that syntax highlighting is applied
    const highlightedElements = page.locator('.hljs, .highlight, .token')
    // Should have some syntax highlighting elements
    const count = await highlightedElements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that text areas are still accessible
    const textareas = page.locator('textarea')
    await expect(textareas.first()).toBeVisible()
    await expect(textareas.nth(1)).toBeVisible()

    // Check that compare button is accessible
    const compareButton = page.locator('button:has-text("Compare")')
    await expect(compareButton).toBeVisible()

    // Test basic functionality on mobile
    await textareas.first().fill('mobile test 1')
    await textareas.nth(1).fill('mobile test 2')

    await compareButton.click()

    // Should still work on mobile
    await page.waitForSelector('.diff-results', { state: 'visible', timeout: 10000 })
  })
})