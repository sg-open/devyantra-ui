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

  test('a 5,000-element flat array stays responsive and renders a bounded tree with a "show more" row (F1)', async ({ page }) => {
    // Small numbers only, so this stays well under the 2 MB published limit
    // (~23 KB) — the point here is CHILD COUNT (5,000), not payload size.
    const bigArray = JSON.stringify(Array.from({ length: 5000 }, (_, i) => i))
    await page.locator('#json-input').waitFor()
    await page.evaluate((text) => {
      const ta = document.querySelector('#json-input') as HTMLTextAreaElement
      ta.value = text
      ta.dispatchEvent(new Event('input', { bubbles: true }))
    }, bigArray)

    // Root is a single array node with 5,000 children (> 200) -> starts
    // COLLAPSED even at depth 0 (F1's amended default-expand rule), so the
    // unbounded-mount blowup this fixes can't even begin at parse time.
    const rootToggle = page.locator('.jx-toggle').first()
    await expect(rootToggle).toBeVisible({ timeout: 2000 })
    await expect(rootToggle).toHaveAttribute('aria-expanded', 'false')

    // Expanding must complete promptly and the page must stay interactive —
    // proof the tab never freezes mounting whatever this reveals.
    await rootToggle.click()
    await expect(page.locator('.jx-children > .jx-node')).toHaveCount(1000)
    const moreRow = page.locator('.jx-more')
    await expect(moreRow).toBeVisible({ timeout: 2000 })
    await expect(moreRow).toHaveText('Show 1,000 more (4,000 remaining)')

    // Extra responsiveness proof: an unrelated input still accepts typing immediately.
    const search = page.locator('#json-search')
    await search.fill('123')
    await expect(search).toHaveValue('123')

    // Clicking "show more" reveals the next page on top of the first.
    await moreRow.click()
    await expect(page.locator('.jx-children > .jx-node')).toHaveCount(2000)
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

/* ═══════════════════════════════════════════
   UUID / ULID GENERATOR (Task 7, spec D5)
   ═══════════════════════════════════════════ */
test.describe('UUID / ULID Generator', () => {
  // Crockford's Base32 alphabet, verbatim from the engine spec — excludes I, L, O, U.
  const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  const ulidRe = new RegExp(`^[${CROCKFORD}]{26}$`)
  const uuidV7Re = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  const uuidV4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/uuid-generator', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })
  })

  test('loads with UUID v4 selected by default and a freshly generated identifier already showing', async ({ page }) => {
    await expect(page.locator('#kind-v4')).toBeChecked()
    await expect(page.locator('#uuid-count')).toHaveValue('1')

    const rows = page.locator('.uuid-row')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toHaveText(uuidV4Re)
  })

  test('generating 5 UUID v7 IDs produces 5 rows matching the UUID shape; inspecting the first shows version 7 and a timestamp within the last minute', async ({ page }) => {
    await page.locator('#kind-v7').check()
    await page.locator('#uuid-count').fill('5')
    await page.locator('#uuid-generate').click()

    const rows = page.locator('.uuid-row')
    await expect(rows).toHaveCount(5)
    const allIds = await rows.allTextContents()
    for (const id of allIds) {
      expect(id).toMatch(uuidV7Re)
    }

    await page.locator('#uuid-inspect-input').fill(allIds[0]!)

    await expect(page.locator('.inspect-kind')).toHaveText('UUID')
    await expect(page.locator('.inspect-version')).toHaveText('7')
    await expect(page.locator('.inspect-variant')).toHaveText('RFC 4122')

    const isoText = (await page.locator('.inspect-timestamp-iso').textContent())!.trim()
    const decodedMs = new Date(isoText).getTime()
    const ageMs = Date.now() - decodedMs
    expect(ageMs).toBeGreaterThanOrEqual(0)
    expect(ageMs).toBeLessThan(60_000) // "within the last minute"
  })

  test('switching to ULID auto-selects uppercase and generates 26-char Crockford rows', async ({ page }) => {
    await page.locator('#kind-ulid').check()
    // Component contract: kind-switch auto-defaults case (ULID -> uppercase)
    // as long as the user hasn't manually overridden the toggle this session.
    await expect(page.locator('#uppercase-on')).toHaveClass(/active/)

    await page.locator('#uuid-generate').click()

    const rows = page.locator('.uuid-row')
    await expect(rows).toHaveCount(1) // count was left at its default (1)
    const text = (await rows.first().textContent())!.trim()
    expect(text).toHaveLength(26)
    expect(text).toMatch(ulidRe)
  })

  test('persistence: kind and count survive a reload, and a fresh batch regenerates on its own', async ({ page }) => {
    await page.locator('#kind-ulid').check()
    await page.locator('#uuid-count').fill('7')
    await page.locator('#uuid-generate').click() // flushes {kind,count,uppercase} immediately

    const beforeReload = await page.locator('.uuid-row').allTextContents()
    expect(beforeReload).toHaveLength(7)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })

    await expect(page.locator('#kind-ulid')).toBeChecked()
    await expect(page.locator('#uuid-count')).toHaveValue('7')

    // Restored settings regenerate a batch on their own — no click required —
    // but generated VALUES are never persisted, so it's a fresh random batch.
    const afterReload = page.locator('.uuid-row')
    await expect(afterReload).toHaveCount(7)
    const afterIds = await afterReload.allTextContents()
    for (const id of afterIds) {
      expect(id.trim()).toMatch(ulidRe)
    }
    expect(afterIds).not.toEqual(beforeReload)
  })
})

/* ═══════════════════════════════════════════
   URL PARSER (Task 8, spec D6)
   ═══════════════════════════════════════════ */
test.describe('URL Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/url-parser', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })
  })

  test('parses the search fixture into parts and a param grid, then edits and deletes rows live', async ({ page }) => {
    await page.locator('#url-input').fill('https://example.com/search?q=hello+world&tag=a&tag=b#top')

    // "+" decodes as a space (application/x-www-form-urlencoded policy).
    const rows = page.locator('.param-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(0).locator('.param-key')).toHaveValue('q')
    await expect(rows.nth(0).locator('.param-value')).toHaveValue('hello world')
    await expect(rows.nth(1).locator('.param-key')).toHaveValue('tag')
    await expect(rows.nth(1).locator('.param-value')).toHaveValue('a')
    await expect(rows.nth(2).locator('.param-key')).toHaveValue('tag')
    await expect(rows.nth(2).locator('.param-value')).toHaveValue('b')
    await expect(page.locator('.part-hash')).toHaveText('top')

    // Editing q -> "bye" rebuilds live; both tag rows are still present.
    await rows.nth(0).locator('.param-value').fill('bye')
    const rebuilt = page.locator('#rebuilt-url')
    await expect(rebuilt).toHaveValue('https://example.com/search?q=bye&tag=a&tag=b#top')

    // Deleting the first "tag" row drops it from the rebuilt URL but keeps the other.
    await rows.nth(1).locator('.param-delete').click()
    await expect(page.locator('.param-row')).toHaveCount(2)
    await expect(rebuilt).toHaveValue('https://example.com/search?q=bye&tag=b#top')
  })

  test('"ht!tp:/x" shows the invalid-URL error inline, not the base-URL hint', async ({ page }) => {
    await page.locator('#url-input').fill('ht!tp:/x')

    const error = page.locator('.field-error')
    await expect(error).toBeVisible({ timeout: 2000 })
    await expect(error).toContainText('Invalid URL: "ht!tp:/x"')

    // No results, and no base-URL field — this is a broken absolute attempt,
    // not a relative reference waiting on a base.
    await expect(page.locator('.param-row')).toHaveCount(0)
    await expect(page.locator('#url-base-input')).toHaveCount(0)
  })

  test('the encode/decode textarea has a proper accessible label (F4)', async ({ page }) => {
    // getByLabel resolves via the <label for="encode-decode-input"> association
    // added in F4 — if the label were missing/mismatched this lookup itself
    // would fail to find the textarea at all.
    const textarea = page.getByLabel('Text to encode or decode')
    await expect(textarea).toHaveId('encode-decode-input')

    await textarea.fill('hello world')
    await page.locator('#encode-btn').click()
    await expect(textarea).toHaveValue('hello%20world')
  })

  test('persistence: input survives a reload and the parts/param grid recompute on their own', async ({ page }) => {
    await page.locator('#url-input').fill('https://example.com/search?q=hello+world&tag=a&tag=b#top')
    await page.waitForTimeout(1000) // useToolState's default 800ms save debounce

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main-content', { state: 'visible' })

    await expect(page.locator('#url-input')).toHaveValue('https://example.com/search?q=hello+world&tag=a&tag=b#top')

    // Restored input recomputes on its own — no user edit required.
    await expect(page.locator('.part-hash')).toHaveText('top', { timeout: 2000 })
    const rows = page.locator('.param-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(0).locator('.param-value')).toHaveValue('hello world')
    await expect(page.locator('#rebuilt-url')).toHaveValue('https://example.com/search?q=hello%20world&tag=a&tag=b#top')
  })
})
