import { test as base, expect, type Page } from '@playwright/test'

/**
 * Custom fixtures and page object models for DevYantra E2E tests
 */

export interface DevYantraPageObjects {
  /** Navigation helpers */
  navigateToTool(toolName: string): Promise<void>

  /** Common UI interactions */
  waitForPageLoad(): Promise<void>
  checkAccessibility(): Promise<void>

  /** Theme testing */
  toggleTheme(): Promise<void>
  getCurrentTheme(): Promise<string>
}

class DevYantraPage implements DevYantraPageObjects {
  constructor(private page: Page) {}

  async navigateToTool(toolName: string): Promise<void> {
    // Map tool names to routes
    const toolRoutes: Record<string, string> = {
      'text-compare': '/tools/text-compare',
      'format-text': '/tools/format-text',
      'hash-generator': '/tools/hash-generator',
      'base64-tools': '/tools/base64-tools',
      'timestamp-converter': '/tools/timestamp-converter',
      'character-count': '/tools/character-count',
      'jwt-decoder': '/tools/jwt-decoder',
      'delimiter': '/tools/delimiter'
    }

    const route = toolRoutes[toolName]
    if (!route) {
      throw new Error(`Unknown tool: ${toolName}`)
    }

    await this.page.goto(route, { waitUntil: 'domcontentloaded' })
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    // Wait for the main content to be visible
    await this.page.waitForSelector('#main-content', { state: 'visible' })

    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(() => {
      const spinners = document.querySelectorAll('.p-progress-spinner')
      return spinners.length === 0 || Array.from(spinners).every(spinner =>
        getComputedStyle(spinner).display === 'none'
      )
    })
  }

  async checkAccessibility(): Promise<void> {
    // Check for skip links
    const skipLinks = await this.page.locator('.skip-link')
    await expect(skipLinks).toHaveCount(2)

    // Check for proper heading structure
    const h1 = await this.page.locator('h1')
    await expect(h1).toBeVisible()

    // Check for proper ARIA labels on interactive elements (excluding hidden/disabled ones)
    const buttons = await this.page.locator('button:visible')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()

      if (isVisible) {
        const hasLabel = await button.evaluate(el => {
          // Skip buttons that are decorative or have icons only
          const hasIcon = el.querySelector('i, svg, .p-icon')
          const hasText = el.textContent?.trim().length > 0
          const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
          const hasTitle = el.hasAttribute('title')

          return hasText || hasAriaLabel || hasTitle || (hasIcon && el.getAttribute('aria-hidden') === 'true')
        })
        expect(hasLabel).toBe(true)
      }
    }
  }

  async toggleTheme(): Promise<void> {
    await this.page.click('.theme-option:not(.active)')
    // Wait for theme transition
    await this.page.waitForTimeout(300)
  }

  async getCurrentTheme(): Promise<string> {
    return await this.page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || 'light'
    })
  }
}

// Extend the base test with our custom fixtures
export const test = base.extend<{ devyantra: DevYantraPageObjects }>({
  devyantra: async ({ page }, use) => {
    const devyantraPage = new DevYantraPage(page)
    await use(devyantraPage)
  },
})

export { expect }