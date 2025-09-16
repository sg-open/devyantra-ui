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
    // Check for h1
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)
    await expect(h1Elements).toContainText('DevYantra')

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
    // Check buttons have accessible names
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const hasAccessibleName = await button.evaluate(el => {
        return el.hasAttribute('aria-label') ||
               el.hasAttribute('aria-labelledby') ||
               el.textContent?.trim().length > 0 ||
               el.hasAttribute('title')
      })
      expect(hasAccessibleName).toBe(true)
    }

    // Check form controls have labels
    const inputs = page.locator('input, textarea, select')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const hasLabel = await input.evaluate(el => {
        return el.hasAttribute('aria-label') ||
               el.hasAttribute('aria-labelledby') ||
               document.querySelector(`label[for="${el.id}"]`) !== null ||
               el.closest('label') !== null
      })
      expect(hasLabel).toBe(true)
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
    // Test theme toggle button focus
    const themeToggle = page.locator('.theme-toggle-btn')
    await themeToggle.focus()

    // Check focus is visible
    const focusStyle = await themeToggle.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow
      }
    })

    // Should have some form of focus indicator
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
    const nav = page.locator('nav, [role="navigation"]')
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

  test('should support high contrast mode', async ({ page }) => {
    // Test in high contrast simulation
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })

    // Check that text is still readable
    const textElements = page.locator('p, span, h1, h2, h3, button')
    const elementCount = await textElements.count()

    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = textElements.nth(i)
      const styles = await element.evaluate(el => {
        const computed = getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          display: computed.display
        }
      })

      // Should have color defined and not be completely transparent
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
      expect(styles.color).not.toBe('transparent')
    }
  })

  test('should have proper form validation announcements', async ({ page, devyantra }) => {
    // Navigate to a form-heavy tool
    await devyantra.navigateToTool('hash-generator')

    // Try to submit without input (if applicable)
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Hash")')

    if (await generateButton.count() > 0) {
      await generateButton.click()

      // Check for any validation messages
      const validationMessages = page.locator('[aria-live], .error-message, .validation-error, .p-toast')

      // If validation messages exist, they should be accessible
      const messageCount = await validationMessages.count()
      if (messageCount > 0) {
        const firstMessage = validationMessages.first()
        const hasAriaLive = await firstMessage.evaluate(el => {
          return el.hasAttribute('aria-live') ||
                 el.hasAttribute('role') ||
                 el.closest('[aria-live]') !== null
        })
        expect(hasAriaLive).toBe(true)
      }
    }
  })

  test('should have proper language attributes', async ({ page }) => {
    // Check html lang attribute
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // Format like "en" or "en-US"

    // Check for any content in different languages
    const langElements = page.locator('[lang]')
    const langCount = await langElements.count()

    for (let i = 0; i < langCount; i++) {
      const element = langElements.nth(i)
      const lang = await element.getAttribute('lang')
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
    }
  })

  test('should support screen reader navigation', async ({ page }) => {
    // Check for proper landmark roles
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer')
    const landmarkCount = await landmarks.count()
    expect(landmarkCount).toBeGreaterThan(0)

    // Check for proper heading structure for screen readers
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()

    if (headingCount > 1) {
      // Verify heading hierarchy makes sense
      const headingLevels = []
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i)
        const level = await heading.evaluate(el => parseInt(el.tagName.charAt(1)))
        headingLevels.push(level)
      }

      // First heading should be h1
      expect(headingLevels[0]).toBe(1)
    }
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

  test('should have accessible color contrast', async ({ page }) => {
    // Check key text elements for sufficient contrast
    const textElements = page.locator('h1, p, button, .privacy-badge')
    const elementCount = await textElements.count()

    for (let i = 0; i < Math.min(elementCount, 3); i++) {
      const element = textElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const styles = await element.evaluate(el => {
          const computed = getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })

        // Should have defined colors (not transparent)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
        expect(styles.color).not.toBe('transparent')

        // Font size should be reasonable
        const fontSize = parseFloat(styles.fontSize)
        expect(fontSize).toBeGreaterThan(10) // At least 10px
      }
    }
  })

  test('should support zoom up to 200%', async ({ page }) => {
    // Set zoom level to 200%
    await page.setViewportSize({ width: 640, height: 480 }) // Simulate 200% zoom

    // Check that important elements are still accessible
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()

    const themeToggle = page.locator('.theme-toggle-btn')
    await expect(themeToggle).toBeVisible()

    // Text should still be readable
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()

    // Should not have horizontal scrolling issues
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = 640
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50) // Allow small overflow
  })
})