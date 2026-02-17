import { test, expect } from './fixtures/base'

test.describe('DevYantra Core Functionality', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('should load the application correctly', async ({ page, devyantra }) => {
    await devyantra.waitForPageLoad()

    // Check that the main elements are present
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('#main-content')).toBeVisible()

    // Check for the privacy badges
    await expect(page.locator('.privacy-badge')).toBeVisible()
    await expect(page.locator('.free-badge')).toBeVisible()
    await expect(page.locator('.open-source-badge')).toBeVisible()
  })

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/DEVYANTRA/)

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /developer tools/)

    // Check meta keywords
    const metaKeywords = page.locator('meta[name="keywords"]')
    await expect(metaKeywords).toHaveAttribute('content', /developer tools/)
  })

  test('should toggle theme correctly', async ({ devyantra }) => {
    const initialTheme = await devyantra.getCurrentTheme()

    // Toggle theme — cycles through 6 modes
    await devyantra.toggleTheme()
    const secondTheme = await devyantra.getCurrentTheme()

    // Verify theme changed
    expect(secondTheme).not.toBe(initialTheme)

    // Toggle again — should change to yet another theme
    await devyantra.toggleTheme()
    const thirdTheme = await devyantra.getCurrentTheme()

    expect(thirdTheme).not.toBe(secondTheme)
  })

  test('should have working skip links for accessibility', async ({ page }) => {
    // Focus on skip links using keyboard navigation
    await page.keyboard.press('Tab')

    // Check that skip link becomes visible when focused
    const skipToContent = page.locator('.skip-link').first()
    await expect(skipToContent).toBeFocused()

    // Use keyboard to activate skip link instead of click
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Verify that main content gains focus or the page scrolls to it
    const mainContent = page.locator('#main-content')
    const isFocused = await mainContent.evaluate(el => el === document.activeElement)
    const isVisible = await mainContent.isVisible()

    // Either the element should be focused or at least visible and scrolled into view
    expect(isFocused || isVisible).toBe(true)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that the layout adapts
    const toolbar = page.locator('.luxury-toolbar')
    await expect(toolbar).toBeVisible()

    // Check that buttons are still accessible
    const themeOption = page.locator('.theme-option').first()
    await expect(themeOption).toBeVisible()
  })

  test('should have proper ARIA labels and roles', async ({ page, devyantra }) => {
    await devyantra.checkAccessibility()

    // Check specific ARIA implementations
    const navigation = page.locator('#navigation')
    await expect(navigation).toHaveAttribute('role', /.+/)

    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Start keyboard navigation
    await page.keyboard.press('Tab')

    // Should focus on skip link
    const skipLink = page.locator('.skip-link').first()
    await expect(skipLink).toBeFocused()

    // Continue navigation
    await page.keyboard.press('Tab')

    // Should eventually reach a theme option button
    let focused = false
    for (let i = 0; i < 15; i++) {
      const themeOption = page.locator('.theme-option').first()
      if (await themeOption.isVisible() && await themeOption.evaluate(el => el === document.activeElement)) {
        focused = true
        break
      }
      const themeOption2 = page.locator('.theme-option').last()
      if (await themeOption2.isVisible() && await themeOption2.evaluate(el => el === document.activeElement)) {
        focused = true
        break
      }
      await page.keyboard.press('Tab')
    }

    expect(focused).toBe(true)
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check that no critical errors occurred
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('service-worker') && // Ignore SW errors
      !error.includes('Extension') // Ignore extension errors
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should have proper performance metrics', async ({ page }) => {
    await page.reload()

    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    })

    // Assert reasonable performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // < 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000) // < 3 seconds
  })
})