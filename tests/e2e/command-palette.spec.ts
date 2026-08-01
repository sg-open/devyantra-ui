import { test, expect } from './fixtures/base'

test.describe('Command Palette', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('should open with Cmd+K and close with Escape', async ({ page }) => {
    // Open palette with keyboard shortcut
    await page.keyboard.press('Meta+k')
    const palette = page.locator('.palette-overlay')
    await expect(palette).toBeVisible()

    // Search input should be focused
    const searchInput = page.locator('.palette-input')
    await expect(searchInput).toBeFocused()

    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(palette).not.toBeVisible()
  })

  test('should open by clicking the search trigger button', async ({ page }) => {
    await page.locator('.cmdk-trigger').click()
    const palette = page.locator('.palette-overlay')
    await expect(palette).toBeVisible()
  })

  test('should close when clicking the overlay background', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    const overlay = page.locator('.palette-overlay')
    await expect(overlay).toBeVisible()

    // Click the overlay (not the panel)
    await overlay.click({ position: { x: 10, y: 10 } })
    await expect(overlay).not.toBeVisible()
  })

  test('should show all commands when no search query', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    const items = page.locator('.palette-item')
    expect(await items.count()).toBeGreaterThanOrEqual(11) // 8+ tools + Toggle Theme + Copy Current URL + Feedback
  })

  test('should filter commands by search query', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    const searchInput = page.locator('.palette-input')

    await searchInput.fill('jwt')
    await page.waitForTimeout(100)

    const items = page.locator('.palette-item')
    await expect(items).toHaveCount(1)
    await expect(items.first()).toContainText('JWT Decoder')
  })

  test('should show "No results found" for non-matching query', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await page.locator('.palette-input').fill('xyznonexistent')
    await page.waitForTimeout(100)

    await expect(page.locator('.palette-empty')).toBeVisible()
    await expect(page.locator('.palette-empty')).toContainText('No results found')
  })

  test('should navigate to tool when clicking a command', async ({ page }) => {
    await page.keyboard.press('Meta+k')

    // Click "Hash Generator"
    await page.locator('.palette-item', { hasText: 'Hash Generator' }).click()

    // Palette should close
    await expect(page.locator('.palette-overlay')).not.toBeVisible()

    // Should navigate to hash generator
    await expect(page).toHaveURL(/hash-generator/)
  })

  test('should navigate with keyboard (arrows + Enter)', async ({ page }) => {
    await page.keyboard.press('Meta+k')

    // First item should be selected by default
    const firstItem = page.locator('.palette-item').first()
    await expect(firstItem).toHaveClass(/selected/)

    // Press down arrow to select second item
    await page.keyboard.press('ArrowDown')
    const secondItem = page.locator('.palette-item').nth(1)
    await expect(secondItem).toHaveClass(/selected/)

    // Press up arrow to go back to first
    await page.keyboard.press('ArrowUp')
    await expect(firstItem).toHaveClass(/selected/)

    // Press Enter to execute
    await page.keyboard.press('Enter')
    await expect(page.locator('.palette-overlay')).not.toBeVisible()
  })

  test('should toggle theme via command palette', async ({ page, devyantra }) => {
    const initialTheme = await devyantra.getCurrentTheme()

    await page.keyboard.press('Meta+k')
    await page.locator('.palette-input').fill('theme')
    await page.waitForTimeout(100)

    const themeItem = page.locator('.palette-item', { hasText: 'Toggle Theme' })
    await expect(themeItem).toBeVisible()
    await themeItem.click()

    const newTheme = await devyantra.getCurrentTheme()
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should reset search and selection when reopened', async ({ page }) => {
    // Open, type something, close
    await page.keyboard.press('Meta+k')
    await page.locator('.palette-input').fill('hash')
    await page.keyboard.press('Escape')

    // Reopen — should be reset
    await page.keyboard.press('Meta+k')
    const searchInput = page.locator('.palette-input')
    await expect(searchInput).toHaveValue('')

    const items = page.locator('.palette-item')
    expect(await items.count()).toBeGreaterThanOrEqual(11)

    // First item should be selected
    await expect(items.first()).toHaveClass(/selected/)
  })

  test('should search by description text', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await page.locator('.palette-input').fill('encode')
    await page.waitForTimeout(100)

    // Should match Base64 Tools (description: "Encode & decode")
    const items = page.locator('.palette-item')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(1)
    await expect(page.locator('.palette-item', { hasText: 'Base64' })).toBeVisible()
  })
})
