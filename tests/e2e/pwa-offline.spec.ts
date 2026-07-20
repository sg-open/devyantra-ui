import { test, expect } from './fixtures/base'

test.describe('Offline PWA (D4)', () => {
  test('hash generator keeps computing after the app goes offline', async ({ page, context, devyantra }) => {
    await devyantra.navigateToTool('hash-generator')

    // Wait for the service worker to install & activate before cutting the
    // network — otherwise there's nothing to serve the reload from and the
    // test would just be proving Chromium's own offline error page exists.
    await page.evaluate(() => navigator.serviceWorker.ready)

    await context.setOffline(true)
    await page.reload()

    // App shell rendered from the SW cache, not a browser offline error page.
    // ".luxury-toolbar" is the persistent header bar present on every route —
    // the closest thing this app has to a "tab bar" — so its visibility is
    // the app-shell-loaded signal.
    await expect(page.locator('.luxury-toolbar')).toBeVisible()

    // Compute (not just render) proof: Web Crypto hashing runs with no network.
    await page.locator('textarea').first().fill('hello')
    await expect(page.getByText('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBeVisible()
  })
})
