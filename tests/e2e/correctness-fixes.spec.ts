import { test, expect } from './fixtures/base'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.describe('Ignore toggles actually change the diff (D1)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('Case toggle makes case-only differences disappear', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World')
    await page.locator('textarea').nth(1).fill('hello world')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.d2h-del, .d2h-ins').first()).toBeVisible()

    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')

    // and back
    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').uncheck()
    await expect(page.locator('.d2h-del, .d2h-ins').first()).toBeVisible()
  })

  test('Whitespace toggle makes whitespace-only differences disappear', async ({ page }) => {
    await page.locator('textarea').first().fill('a        b\nline two')
    await page.locator('textarea').nth(1).fill('a b\nline two')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.d2h-del, .d2h-ins').first()).toBeVisible()

    await page.locator('.diff-toggle', { hasText: /whitespace/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
  })

  test('Copy button is disabled when there is no current diff, and copied patches contain original text (D4/D1)', async ({ page }) => {
    await page.locator('textarea').first().fill('Alpha\nSame')
    await page.locator('textarea').nth(1).fill('alpha\nSame')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.d2h-del, .d2h-ins').first()).toBeVisible()

    // Patch always carries ORIGINAL case even while viewing a case-folded diff
    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
    // With no visible differences, Copy/Export must be disabled — no stale patch
    await expect(page.locator('.diff-action-btn', { hasText: 'Copy' })).toBeDisabled()
    await expect(page.locator('.diff-action-btn', { hasText: 'Export' })).toBeDisabled()

    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').uncheck()
    await expect(page.locator('.d2h-del, .d2h-ins').first()).toBeVisible()
    await page.locator('.diff-action-btn', { hasText: 'Copy' }).click()
    const patch = await page.evaluate(() => navigator.clipboard.readText())
    expect(patch).toContain('-Alpha')
    expect(patch).toContain('+alpha')
  })
})
