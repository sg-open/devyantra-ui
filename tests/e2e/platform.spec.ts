import { test, expect } from './fixtures/base'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.describe('Tool persistence (D2)', () => {
  test('Format Text: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('format-text')
    await page.locator('textarea').first().fill('PERSIST-FORMAT-TEXT-42')
    await page.waitForTimeout(1000) // debounce is 800ms
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-FORMAT-TEXT-42')
  })

  test('Hash Generator: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('hash-generator')
    await page.locator('textarea').first().fill('PERSIST-HASH-GEN-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-HASH-GEN-42')
  })

  test('Base64 Tools: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
    await page.locator('textarea').first().fill('PERSIST-BASE64-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-BASE64-42')
  })

  test('Base64 Tools: Clear shows an Undo toast that restores the input', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
    await page.locator('textarea').first().fill('UNDO-ME-BASE64')
    await page.locator('.tool-actions button:has-text("Clear")').click()
    await expect(page.locator('textarea').first()).toHaveValue('')

    const undo = page.locator('.toast-action', { hasText: 'Undo' })
    await expect(undo).toBeVisible()
    await undo.click()
    await expect(page.locator('textarea').first()).toHaveValue('UNDO-ME-BASE64')
  })

  test('JWT Decoder: token survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('jwt-decoder')
    await page.locator('textarea').first().fill('PERSIST-JWT-TOKEN-42')
    await page.waitForTimeout(1000) // debounce is 800ms
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-JWT-TOKEN-42')
  })

  test('Character Count: input survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('character-count')
    await page.locator('textarea').first().fill('PERSIST-CHARCOUNT-42')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-CHARCOUNT-42')
  })

  test('Delimiter Tool: delimited-text panel survives reload', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('delimiter')
    await page.locator('textarea').first().fill('PERSIST-DELIM-42,x,y')
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('PERSIST-DELIM-42,x,y')
  })

  test('Timestamp Converter: unit + datetime survive reload (numeric timestamp value does not — known quirk, see task-10-report.md)', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('timestamp-converter')
    await page.locator('.timestamp-input, input[type="number"]').fill('1712345678')
    await page.locator('.datetime-input, input[type="datetime-local"]').fill('2024-06-01T10:30')
    await page.locator('.toggle-btn:has-text("ms")').click()
    await page.waitForTimeout(1000)
    await page.reload()

    // Unit (a plain string ref) restores.
    await expect(page.locator('.toggle-btn:has-text("ms")')).toHaveClass(/active/)
    // Datetime (a plain string ref, never number-cast) restores.
    await expect(page.locator('.datetime-input, input[type="datetime-local"]')).toHaveValue('2024-06-01T10:30')
    // NOT asserted: the numeric timestamp input itself. inputTimestamp is a
    // string ref (`ref('')`), but v-model on <input type="number"> casts any
    // non-empty entry to a `number` (@vue/runtime-dom vModelText castToNumber).
    // On reload, the fresh '' (string) ref fails useToolState's strict typeof
    // match, so the stored number is silently skipped — this value does NOT
    // restore. Accepted per the platform-track plan.
  })
})

test.describe('Self-hosted fonts (D5)', () => {
  test('JetBrains Mono is available with no third-party font requests', async ({ page, devyantra }) => {
    const requestUrls: string[] = []
    page.on('request', (request) => {
      requestUrls.push(request.url())
    })

    await devyantra.navigateToTool('text-compare')

    await page.evaluate(() => document.fonts.ready)
    const jetbrainsMonoAvailable = await page.evaluate(() =>
      document.fonts.check('13px "JetBrains Mono"')
    )
    expect(jetbrainsMonoAvailable).toBe(true)

    // The single variable-font file declares `font-weight: 300 700`; probe a
    // non-400 weight to prove the whole range is served, not just regular.
    const jetbrainsMonoBoldAvailable = await page.evaluate(() =>
      document.fonts.check('600 13px "JetBrains Mono"')
    )
    expect(jetbrainsMonoBoldAvailable).toBe(true)

    const googleFontRequests = requestUrls.filter((url) => url.includes('fonts.g'))
    expect(googleFontRequests).toEqual([])
  })
})

test.describe('Static feedback (D5)', () => {
  test('Feedback page renders 3 GitHub links with correct hrefs and no formspree requests', async ({ page }) => {
    const requestUrls: string[] = []
    const requestMethods: string[] = []

    page.on('request', (request) => {
      requestUrls.push(request.url())
      requestMethods.push(request.method())
    })

    await page.goto('/feedback')

    // Assert the three links exist with correct hrefs
    const bugLink = page.locator('a[href*="github.com/sg-open/devyantra-ui/issues/new?template=bug_report.yml"]')
    const featureLink = page.locator('a[href*="github.com/sg-open/devyantra-ui/issues/new?template=feature_request.yml"]')
    const discussionLink = page.locator('a[href*="github.com/sg-open/devyantra-ui/discussions"]')

    await expect(bugLink).toBeVisible()
    await expect(featureLink).toBeVisible()
    await expect(discussionLink).toBeVisible()

    // Assert no formspree requests
    const formspreeRequests = requestUrls.filter((url) => url.includes('formspree'))
    expect(formspreeRequests).toEqual([])

    // Assert no POST requests at all during the visit
    const postRequests = requestMethods.filter((method) => method === 'POST')
    expect(postRequests).toEqual([])
  })
})

test.describe('Zero egress (D5)', () => {
  test('capstone: a full tool-using session makes zero cross-origin requests', async ({ page }) => {
    // Attached before the first goto — this is the whole point of the test:
    // catch anything the app ever asks the network for, from first paint
    // through a realistic multi-tool session (hash, format, palette, diff).
    const requestUrls: string[] = []
    page.on('request', (request) => {
      requestUrls.push(request.url())
    })

    await page.goto('/tools/hash-generator', { waitUntil: 'domcontentloaded' })
    await page.locator('textarea').first().fill('zero-egress-capstone')
    await expect(page.locator('.hash-results')).toBeVisible()

    // Navigate tool-to-tool via the tab bar — the segmented tool switcher
    // (role="tablist"/"tab") rendered above every tool's content. The route
    // changes before HomeView's out-in transition finishes swapping the
    // mounted component, so wait for a format-text-specific element (and use
    // a format-text-specific textarea selector) rather than racing the
    // still-fading-out hash-generator page with a generic `textarea` locator.
    await page.locator('.seg-item', { hasText: 'Code Formatter' }).click()
    await expect(page).toHaveURL(/\/tools\/format-text$/)
    await expect(page.locator('.formatter-toolbar')).toBeVisible()

    await page.locator('.panel-textarea').fill('{"a":1,"b":2}')
    await page.locator('.toolbar-btn.primary-action').click()
    await expect(page.locator('.formatted-output')).toBeVisible()

    // Open the command palette and jump to Text Compare. Lowercase 'k' —
    // App.vue's shortcut handler matches `e.key === 'k'` exactly; a
    // Shift-modified 'K' would not fire it.
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.locator('.palette-overlay')).toBeVisible()
    await page.locator('.palette-item', { hasText: 'Text Compare' }).click()
    await expect(page).toHaveURL(/\/tools\/text-compare$/)
    await expect(page.locator('.compare-btn')).toBeVisible()

    await page.locator('textarea').first().fill('one two three')
    await page.locator('textarea').nth(1).fill('one TWO three')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.diff-renderer')).toBeVisible()

    // The proof: every single request this whole session ever made — app
    // shell, lazy route chunks, the diff worker script, everything — has to
    // be same-origin as the page itself.
    const origin = new URL(page.url()).origin
    expect(requestUrls.length).toBeGreaterThan(0)
    for (const url of requestUrls) {
      expect(url.startsWith(origin)).toBe(true)
    }
  })

  test('/privacy renders and is reachable from the header badge and the footer link', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('h1')).toHaveText('Nothing leaves your browser')
    await expect(page.getByRole('heading', { name: 'Verify it yourself' })).toBeVisible()

    await page.goto('/tools/text-compare')
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click()
    await expect(page).toHaveURL(/\/privacy$/)

    await page.goto('/tools/text-compare')
    await page.locator('.privacy-badge').click()
    await expect(page).toHaveURL(/\/privacy$/)
  })
})
