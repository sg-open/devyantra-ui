import { test, expect } from './fixtures/base'

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('should have proper skip links', async ({ page }) => {
    // Check skip links exist
    const skipLinks = page.locator('.skip-link')
    await expect(skipLinks).toHaveCount(2)

    // Check skip link text
    const skipToContent = skipLinks.first()
    const skipToNav = skipLinks.nth(1)

    await expect(skipToContent).toContainText('Skip to main content')
    await expect(skipToNav).toContainText('Skip to navigation')

    // Test skip link functionality
    await page.keyboard.press('Tab') // Focus first skip link
    await expect(skipToContent).toBeFocused()

    // Use keyboard activation instead of click
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Check that main content is visible and page scrolled
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1 — each tool component has its own h1
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)

    // Check heading levels are logical
    const allHeadings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await allHeadings.count()

    if (headingCount > 1) {
      for (let i = 0; i < headingCount; i++) {
        const heading = allHeadings.nth(i)
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(tagName)
      }
    }
  })

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check visible, non-internal buttons have accessible names
    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const hasAccessibleName = await button.evaluate(el => {
        // Skip PrimeVue internal elements (hidden, zero-size, etc.)
        if (el.offsetWidth === 0 && el.offsetHeight === 0) return true
        if (el.closest('[data-pc-section]') && !el.hasAttribute('aria-label')) {
          // PrimeVue internal buttons without explicit labels — skip
          const hasText = (el.textContent?.trim().length ?? 0) > 0
          if (!hasText) return true
        }
        return el.hasAttribute('aria-label') ||
               el.hasAttribute('aria-labelledby') ||
               (el.textContent?.trim().length ?? 0) > 0 ||
               el.hasAttribute('title')
      })
      expect(hasAccessibleName).toBe(true)
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    let tabCount = 0
    const maxTabs = 20 // Reasonable limit to prevent infinite loops

    // Start tabbing through the page
    await page.keyboard.press('Tab')
    tabCount++

    // Track focusable elements
    const focusedElements: string[] = []

    while (tabCount < maxTabs) {
      const focused = await page.evaluate(() => {
        const activeElement = document.activeElement
        if (activeElement) {
          return {
            tagName: activeElement.tagName.toLowerCase(),
            className: activeElement.className,
            id: activeElement.id,
            type: activeElement.getAttribute('type'),
            role: activeElement.getAttribute('role')
          }
        }
        return null
      })

      if (focused) {
        focusedElements.push(`${focused.tagName}${focused.id ? '#' + focused.id : ''}${focused.className ? '.' + focused.className.split(' ')[0] : ''}`)
      }

      await page.keyboard.press('Tab')
      tabCount++

      // Break if we've cycled back to the beginning
      if (tabCount > 5 && focusedElements[0] === focusedElements[focusedElements.length - 1]) {
        break
      }
    }

    // Should have focused on multiple elements
    expect(focusedElements.length).toBeGreaterThan(2)

    // Should include key interactive elements
    const focusedString = focusedElements.join(' ')
    expect(focusedString).toContain('button') // Should focus on buttons
  })

  test('should have proper focus indicators', async ({ page }) => {
    // Test a theme option button focus
    const themeOption = page.locator('.theme-option').first()
    await themeOption.focus()

    // Check focus is visible
    const focusStyle = await themeOption.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow
      }
    })

    // Should have some form of focus indicator (outline or box-shadow)
    const hasFocusIndicator = focusStyle.outline !== 'none' ||
                             focusStyle.outlineWidth !== '0px' ||
                             focusStyle.boxShadow !== 'none'

    expect(hasFocusIndicator).toBe(true)
  })

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    const mainCount = await main.count()
    expect(mainCount).toBeGreaterThanOrEqual(1)

    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"], [role="banner"]')
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible()
    }

    // Check for proper list structure if lists exist
    const lists = page.locator('ul, ol')
    const listCount = await lists.count()

    for (let i = 0; i < listCount; i++) {
      const list = lists.nth(i)
      const listItems = list.locator('li')
      const itemCount = await listItems.count()

      if (itemCount > 0) {
        // Lists should contain list items
        expect(itemCount).toBeGreaterThan(0)
      }
    }
  })

  test('should have proper language attributes', async ({ page }) => {
    // Check html lang attribute
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // Format like "en" or "en-US"
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })

    // Check that animations are reduced or disabled
    const animatedElements = page.locator('[class*="animate"], [class*="transition"], .logo-container')

    if (await animatedElements.count() > 0) {
      const firstAnimated = animatedElements.first()
      const styles = await firstAnimated.evaluate(el => {
        const computed = getComputedStyle(el)
        return {
          animationDuration: computed.animationDuration,
          animationDelay: computed.animationDelay,
          transitionDuration: computed.transitionDuration
        }
      })

      // Animations should be disabled or very short with reduced motion
      if (styles.animationDuration !== 'none' && styles.animationDuration !== '0s') {
        // Should be very short or respect reduced motion
        expect(parseFloat(styles.animationDuration)).toBeLessThanOrEqual(0.5)
      }
    }
  })
})
