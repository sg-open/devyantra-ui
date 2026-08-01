import { test, expect } from './fixtures/base'

// New Tools Track — e2e coverage for each tool as it lands (Task 3+).
// Standard header mirrors platform.spec.ts: clipboard permissions granted up
// front since every tool's ToolActions "Copy" button exercises the clipboard.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

/* ═══════════════════════════════════════════
   REGEX TESTER (Task 3, spec D2 UI)
   ═══════════════════════════════════════════ */
test.describe('Regex Tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/regex-tester', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })
  })

  test('happy path: named-group pattern highlights matches and lists the group in the table', async ({ page }) => {
    await page.locator('#regex-pattern').fill('(?<word>w\\w+)')
    await page.locator('#flag-i').check() // brief pairs this pattern with flags "gi"; g is on by default
    await page.locator('#regex-test-string').fill('Hello World Wide Web')

    // 3 matches: World, Wide, Web
    await expect(page.locator('.rx-hl')).toHaveCount(3, { timeout: 3000 })
    await expect(page.locator('.rx-matches-table tbody tr')).toHaveCount(3)

    // The named group appears in the groups column alongside its value.
    await expect(page.locator('.rx-matches-table')).toContainText('word')
    await expect(page.locator('.rx-matches-table')).toContainText('World')
  })

  test('persistence: pattern, flags, and test string survive a reload', async ({ page }) => {
    await page.locator('#regex-pattern').fill('\\d+')
    await page.locator('#flag-i').check()
    await page.locator('#regex-test-string').fill('order 42 and 108')
    await page.waitForTimeout(1000) // useToolState's default 800ms save debounce

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })

    await expect(page.locator('#regex-pattern')).toHaveValue('\\d+')
    await expect(page.locator('#flag-i')).toBeChecked()
    await expect(page.locator('#regex-test-string')).toHaveValue('order 42 and 108')

    // Restored state recomputes on its own (debounced run fires post-mount) —
    // no user edit required to see the two matches (42, 108) again.
    await expect(page.locator('.rx-hl')).toHaveCount(2, { timeout: 3000 })
  })

  test('ReDoS: catastrophic backtracking times out, the tab stays responsive, and fixing the pattern recovers', async ({ page }) => {
    await page.locator('#regex-pattern').fill('(a+)+$')
    await page.locator('#regex-test-string').fill('a'.repeat(40) + 'b')

    const timeoutMessage = page.locator('.rx-timeout')
    await expect(timeoutMessage).toBeVisible({ timeout: 5000 })
    await expect(timeoutMessage).toContainText(
      'Pattern timed out after 2 s — likely catastrophic backtracking. Edit the pattern to try again.'
    )

    // Responsiveness proof: the pathological pattern only ever runs inside the
    // (now-terminated) worker thread, never on the main thread — so the UI
    // must still take a click immediately, proving the tab was never frozen.
    const patternInput = page.locator('#regex-pattern')
    await expect(patternInput).toBeEditable()
    const flagCheckbox = page.locator('#flag-i')
    await flagCheckbox.click()
    await expect(flagCheckbox).toBeChecked()

    // That click also reruns the still-pathological pattern (flags are part
    // of the debounced run(), per spec) — let this second run cycle all the
    // way back to timeout so the worker is idle again before the fix below,
    // rather than racing a fresh request against a still-busy worker.
    await expect(timeoutMessage).toBeHidden({ timeout: 1500 })
    await expect(timeoutMessage).toBeVisible({ timeout: 5000 })

    // Editing the pattern to something benign recovers to a normal result.
    await patternInput.fill('a+')
    await expect(page.locator('.rx-matches-table')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.rx-chip').first()).toContainText('1 match')
  })
})

/* ═══════════════════════════════════════════
   JSON EXPLORER (Task 4, spec D3)
   ═══════════════════════════════════════════ */
test.describe('JSON Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/json-explorer', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })
  })

  test('renders the users-fixture tree, copies a clicked key\'s path, and a search highlights its match', async ({ page }) => {
    await page.locator('#json-input').fill('{"users":[{"name":"Ada"},{"name":"Lin"}]}')

    // Parse is 300ms-debounced; the fixture is shallow enough (depth <= 2
    // containers throughout) that every leaf, including users[1].name, is
    // expanded by default — no manual expand-clicks needed to see it.
    const adaValue = page.locator('.jx-value[data-path="$.users[0].name"]')
    const linValue = page.locator('.jx-value[data-path="$.users[1].name"]')
    await expect(linValue).toBeVisible({ timeout: 2000 })
    await expect(linValue).toHaveText('"Lin"')
    await expect(adaValue).toHaveText('"Ada"')

    // Clicking the "name" key under index 1 copies its full JSON path.
    await page.locator('.jx-key[data-path="$.users[1].name"]').click()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe('$.users[1].name')

    // Searching "Lin" highlights the matching value only, not its sibling.
    await page.locator('#json-search').fill('Lin')
    await expect(linValue).toHaveClass(/jx-match/)
    await expect(adaValue).not.toHaveClass(/jx-match/)
  })

  test('input over the 2 MB published limit shows the limit message instead of a tree', async ({ page }) => {
    const big = 'x'.repeat(3 * 1024 * 1024) // exactly 3 MiB of ASCII -> byte-exact "3.00 MB"
    // Programmatic set + 'input' dispatch (drives v-model) instead of .fill():
    // a multi-MB string blows well past a comfortable .fill() budget.
    await page.locator('#json-input').waitFor()
    await page.evaluate((text) => {
      const ta = document.querySelector('#json-input') as HTMLTextAreaElement
      ta.value = text
      ta.dispatchEvent(new Event('input', { bubbles: true }))
    }, big)

    const error = page.locator('.jx-error')
    await expect(error).toBeVisible({ timeout: 2000 })
    await expect(error).toContainText('Input is 3.00 MB; the limit is 2 MB')
  })

  test('persistence: input survives a reload and the tree recomputes on its own', async ({ page }) => {
    await page.locator('#json-input').fill('{"a":1,"b":[true,false]}')
    await page.waitForTimeout(1000) // useToolState's default 800ms save debounce

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })

    await expect(page.locator('#json-input')).toHaveValue('{"a":1,"b":[true,false]}')
    // Restored state recomputes on its own (debounced parse fires post-mount) —
    // no user edit required to see the tree again.
    await expect(page.locator('.jx-value[data-path="$.b[0]"]')).toHaveText('true', { timeout: 2000 })
  })
})

/* ═══════════════════════════════════════════
   CRON PARSER (Task 6, spec D4 UI)
   ═══════════════════════════════════════════ */
test.describe('Cron Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/cron-parser', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })
  })

  test('default expression describes itself in plain English and lists the next 10 runs', async ({ page }) => {
    await expect(page.locator('#cron-expression')).toHaveValue('30 9 * * 1-5')
    await expect(page.locator('.cron-description')).toHaveText('At 09:30, Monday through Friday', { timeout: 2000 })
    await expect(page.locator('.cron-runs-table tbody tr')).toHaveCount(10)
  })

  test('switching to the "Every 15 min" preset updates the expression, description, and table', async ({ page }) => {
    // Pinned exact describeCron() output (src/lib/__tests__/cron.spec.ts) — a
    // deterministic assertion that the whole recompute pipeline re-ran.
    await page.locator('#cron-presets').selectOption('*/15 * * * *')
    await expect(page.locator('#cron-expression')).toHaveValue('*/15 * * * *')
    await expect(page.locator('.cron-description')).toHaveText('Every 15 minutes', { timeout: 2000 })
    await expect(page.locator('.cron-runs-table tbody tr')).toHaveCount(10)
  })

  test('"1 2 3" shows the 5-field grammar error inline', async ({ page }) => {
    await page.locator('#cron-expression').fill('1 2 3')
    const error = page.locator('.field-error')
    await expect(error).toBeVisible({ timeout: 2000 })
    await expect(error).toContainText(
      'Expected 5 fields, got 3. Six- and seven-field variants (seconds/years) aren\'t supported.'
    )
    // No results render alongside the error.
    await expect(page.locator('.cron-runs-table')).toHaveCount(0)
  })

  test('"0 0 31 2 *" (day 31 of February) shows the no-match error inline', async ({ page }) => {
    await page.locator('#cron-expression').fill('0 0 31 2 *')
    const error = page.locator('.field-error')
    await expect(error).toBeVisible({ timeout: 2000 })
    await expect(error).toContainText('No matching times in the next 4 years')
  })

  test('persistence: expression survives a reload and recomputes on its own', async ({ page }) => {
    await page.locator('#cron-expression').fill('0 12 * JAN,JUL *')
    await page.waitForTimeout(1000) // useToolState's default 800ms save debounce

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })

    await expect(page.locator('#cron-expression')).toHaveValue('0 12 * JAN,JUL *')
    // Restored state recomputes on its own (debounced compute fires post-mount) —
    // no user edit required to see the description/table again.
    await expect(page.locator('.cron-description')).toHaveText('At 12:00, in January and July', { timeout: 2000 })
    await expect(page.locator('.cron-runs-table tbody tr')).toHaveCount(10)
  })
})
