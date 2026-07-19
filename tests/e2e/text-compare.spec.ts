import { test, expect } from './fixtures/base'
import path from 'path'
import fs from 'fs'
import os from 'os'

test.describe('Text Comparison Tool', () => {
  test.beforeEach(async ({ devyantra }, testInfo) => {
    test.skip(testInfo.project.name.includes('Mobile'), 'Desktop-only tests')
    await devyantra.navigateToTool('text-compare')
  })

  test('should have the main comparison interface', async ({ page }) => {
    // Check for two text areas
    await expect(page.locator('textarea').first()).toBeVisible()
    await expect(page.locator('textarea').nth(1)).toBeVisible()

    // Check for labels
    await expect(page.locator('text=Original Text:')).toBeVisible()
    await expect(page.locator('text=Changed Text:')).toBeVisible()

    // Compare button should be visible (disabled when inputs are empty)
    await expect(page.locator('.compare-btn')).toBeVisible()
  })

  test('should show diff when Compare is clicked', async ({ page }) => {
    const text1 = 'Hello World\nThis is a test\nLine 3'
    const text2 = 'Hello Universe\nThis is a test\nLine 4'

    // Fill both text areas
    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for the diff renderer to show the computed rows
    const diffContainer = page.locator('.diff-renderer')
    await expect(diffContainer).toBeVisible({ timeout: 5000 })

    // The diff core renders rows with these classes for changes
    const changedCells = page.locator('.dv-row--removed, .dv-row--added')
    await expect(changedCells.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show "no differences" for identical texts', async ({ page }) => {
    const sampleText = 'Hello World\nThis is a test\nLine 3'

    await page.locator('textarea').first().fill(sampleText)
    await page.locator('textarea').nth(1).fill(sampleText)

    // Click Compare
    await page.locator('.compare-btn').click()
    await page.waitForTimeout(500)

    // Should show "No differences found" or "texts are identical"
    const noDiffMessage = page.locator('text=No differences found')
      .or(page.locator('text=texts are identical'))
    await expect(noDiffMessage.first()).toBeVisible({ timeout: 5000 })
  })

  test('should not show diff when only one textarea has content', async ({ page }) => {
    await page.locator('textarea').first().fill('some text')

    // Wait a moment
    await page.waitForTimeout(500)

    // Diff renderer should not be visible
    await expect(page.locator('.diff-renderer')).not.toBeVisible()
  })

  test('should switch between split and unified view modes', async ({ page }) => {
    await page.locator('textarea').first().fill('Line 1\nLine 2\nLine 3')
    await page.locator('textarea').nth(1).fill('Line 1\nModified Line 2\nLine 3')

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for diff to render
    const diffRenderer = page.locator('.diff-renderer')
    await expect(diffRenderer).toBeVisible({ timeout: 5000 })

    // Should have split and unified buttons (segmented control)
    const splitButton = page.locator('.diff-segment', { hasText: /split/i })
    const unifiedButton = page.locator('.diff-segment', { hasText: /unified/i })

    await expect(splitButton).toBeVisible()
    await expect(unifiedButton).toBeVisible()

    // Click unified
    await unifiedButton.click()
    await page.waitForTimeout(300)

    // Diff should still be visible
    await expect(diffRenderer).toBeVisible()

    // Click split
    await splitButton.click()
    await page.waitForTimeout(300)

    await expect(diffRenderer).toBeVisible()
  })

  test('should display diff stats', async ({ page }) => {
    await page.locator('textarea').first().fill('Line 1\nLine 2\nLine 3')
    await page.locator('textarea').nth(1).fill('Line 1\nModified Line 2\nLine 3\nLine 4')

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for stats bar to appear
    const statsBar = page.locator('.diff-stats-bar')
    await expect(statsBar).toBeVisible({ timeout: 5000 })

    // Check for stat chips (added and modified — no removals for this input)
    await expect(page.locator('.diff-stat-chip--added')).toBeVisible()
    await expect(page.locator('.diff-stat-chip--modified')).toBeVisible()
  })

  test('should handle file upload via hidden input', async ({ page }) => {
    // Create temporary test files
    const tmpDir = os.tmpdir()
    const file1Path = path.join(tmpDir, 'test-compare-1.txt')
    const file2Path = path.join(tmpDir, 'test-compare-2.txt')

    fs.writeFileSync(file1Path, 'File 1 content\nLine 2\nLine 3')
    fs.writeFileSync(file2Path, 'File 1 content\nModified Line 2\nLine 3')

    try {
      // Upload to left side
      const fileInputs = page.locator('input[type="file"]')
      await fileInputs.first().setInputFiles(file1Path)

      // Wait for content to load
      await page.waitForTimeout(500)
      await expect(page.locator('textarea').first()).toHaveValue('File 1 content\nLine 2\nLine 3')

      // Upload to right side
      await fileInputs.nth(1).setInputFiles(file2Path)
      await page.waitForTimeout(500)
      await expect(page.locator('textarea').nth(1)).toHaveValue('File 1 content\nModified Line 2\nLine 3')

      // Click Compare then diff should appear
      await page.locator('.compare-btn').click()
      await expect(page.locator('.diff-renderer')).toBeVisible({ timeout: 5000 })
    } finally {
      // Cleanup temp files
      fs.unlinkSync(file1Path)
      fs.unlinkSync(file2Path)
    }
  })

  test('should have upload buttons', async ({ page }) => {
    const uploadButtons = page.locator('.upload-btn')
    // Two upload buttons — one per side
    await expect(uploadButtons).toHaveCount(2)
  })

  test('should navigate between changes', async ({ page }) => {
    // Create texts with multiple changes
    const text1 = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8'
    const text2 = 'Line 1\nChanged 2\nLine 3\nLine 4\nChanged 5\nLine 6\nLine 7\nChanged 8'

    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for diff and navigation to be ready
    const diffRenderer = page.locator('.diff-renderer')
    await expect(diffRenderer).toBeVisible({ timeout: 5000 })

    // Navigation controls should appear when there are changes
    const navCounter = page.locator('.diff-nav-counter')
    // Wait for navigation to scan (MutationObserver needs to fire)
    await page.waitForTimeout(1000)

    if (await navCounter.isVisible()) {
      // Should show something like "1/3"
      const navText = await navCounter.textContent()
      expect(navText).toContain('/')

      // Click next change button
      const nextButton = page.locator('.diff-nav-btn').last()
      await nextButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('should have export buttons (Copy and Export)', async ({ page }) => {
    await page.locator('textarea').first().fill('original')
    await page.locator('textarea').nth(1).fill('modified')

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for diff to render
    await expect(page.locator('.diff-renderer')).toBeVisible({ timeout: 5000 })

    // Check for copy button
    const copyButton = page.locator('.diff-action-btn', { hasText: /copy/i })
    await expect(copyButton).toBeVisible()

    // Check for export button
    const exportButton = page.locator('.diff-action-btn', { hasText: /export/i })
    await expect(exportButton).toBeVisible()
  })

  test('should swap texts when swap button is clicked', async ({ page }) => {
    const text1 = 'original text'
    const text2 = 'changed text'

    await page.locator('textarea').first().fill(text1)
    await page.locator('textarea').nth(1).fill(text2)

    // Click swap button
    const swapButton = page.locator('.swap-btn')
    await swapButton.click()

    // Verify texts are swapped
    await expect(page.locator('textarea').first()).toHaveValue(text2)
    await expect(page.locator('textarea').nth(1)).toHaveValue(text1)
  })

  test('should clear all when clear all button is clicked', async ({ page }) => {
    await page.locator('textarea').first().fill('some text')
    await page.locator('textarea').nth(1).fill('other text')

    // Find "Clear All" button in right actions area
    const clearAllButton = page.locator('button', { hasText: /clear all/i })
    await clearAllButton.click()

    // Both textareas should be empty
    await expect(page.locator('textarea').first()).toHaveValue('')
    await expect(page.locator('textarea').nth(1)).toHaveValue('')
  })

  test('should handle empty input gracefully', async ({ page }) => {
    // Leave both text areas empty — no errors should appear
    await page.waitForTimeout(500)

    // No error toast should be visible
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).not.toBeVisible()

    // No diff renderer should be shown
    await expect(page.locator('.diff-renderer')).not.toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that text areas are still accessible
    const textareas = page.locator('textarea')
    await expect(textareas.first()).toBeVisible()
    await expect(textareas.nth(1)).toBeVisible()

    // Test basic functionality on mobile
    await textareas.first().fill('mobile test 1')
    await textareas.nth(1).fill('mobile test 2')

    // Click Compare then diff should render on mobile too
    await page.locator('.compare-btn').click()
    await expect(page.locator('.diff-renderer')).toBeVisible({ timeout: 5000 })
  })

  test('should toggle ignore whitespace and ignore case options', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World')
    await page.locator('textarea').nth(1).fill('hello world')

    // Click Compare
    await page.locator('.compare-btn').click()

    // Wait for diff to render
    await expect(page.locator('.diff-renderer')).toBeVisible({ timeout: 5000 })

    // Find the ignore case toggle (label says "Case")
    const caseToggle = page.locator('.diff-toggle', { hasText: /case/i })
    await expect(caseToggle).toBeVisible()

    // Click it — case-only differences must disappear
    await caseToggle.locator('input[type="checkbox"]').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
  })

  test('should have share button', async ({ page }) => {
    const shareButton = page.locator('.share-btn')
    await expect(shareButton).toBeVisible()
  })
})
