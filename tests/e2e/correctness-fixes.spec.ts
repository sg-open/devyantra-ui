import { test, expect } from './fixtures/base'
import path from 'path'
import fs from 'fs'
import os from 'os'

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

test.describe('Share lifecycle (D2)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('share round-trips text AND options, cleans the hash, and edits after opening a link survive reload', async ({ page }) => {
    await page.locator('textarea').first().fill('Shared Left κόσμος')
    await page.locator('textarea').nth(1).fill('Shared Right κόσμος')
    await page.locator('.compare-btn').click()
    await page.locator('.diff-toggle', { hasText: /whitespace/i }).locator('input').check()

    await page.locator('.share-btn').click()
    await expect(page.locator('.toast-message', { hasText: 'Link copied' })).toBeVisible()
    const url = await page.evaluate(() => navigator.clipboard.readText())
    expect(url).toContain('#')

    // Open the link fresh. Chromium treats goto() to a URL that differs from
    // the current document only by hash fragment as a same-document
    // navigation (no reload) — hopping through about:blank first forces a
    // real cross-document load, as an actual visitor clicking the link would get.
    await page.goto('about:blank')
    await page.goto(url)
    await expect(page.locator('textarea').first()).toHaveValue('Shared Left κόσμος')
    // Hash cleaned right after restore
    expect(new URL(page.url()).hash).toBe('')

    // Edit, autosave, reload — the edit must win (no resurrection of shared state)
    await page.locator('textarea').first().fill('MY-EDIT-99999')
    await page.waitForTimeout(1300)
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('MY-EDIT-99999')
  })

  test('oversized share shows an error toast and leaves the clipboard alone', async ({ page }) => {
    const big = Array.from({ length: 4000 }, (_, i) => `line-${i}-${(i * 7919) % 104729}-${(i * 104729).toString(36)}`).join('\n')
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'))
    // Programmatic set + 'input' dispatch (drives v-model) instead of .fill(): filling this 4000-line string via .fill() blows the 30s test timeout
    await page.locator('textarea').nth(1).waitFor()
    await page.evaluate((text) => {
      const tas = document.querySelectorAll('textarea')
      tas[0].value = text
      tas[0].dispatchEvent(new Event('input', { bubbles: true }))
      tas[1].value = text + 'diff'
      tas[1].dispatchEvent(new Event('input', { bubbles: true }))
    }, big)
    await page.locator('.share-btn').click()
    await expect(page.locator('.toast-message', { hasText: 'Too large' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('sentinel')
  })

  test('garbage share hash falls back to saved state instead of blanking (D2 validation)', async ({ page }) => {
    // Save some state first
    await page.locator('textarea').first().fill('my precious state')
    await page.waitForTimeout(1300)
    // Visit with a decompressible-but-unknown-version hash: LZ of {"version":"9.9.9"}
    await page.evaluate(() => {
      // @ts-expect-error lz-string is bundled in the app chunk; recompress via app is unavailable here,
      // so simulate: navigating with a syntactically-valid-but-rejected hash
      window.location.hash = '#NoIWJhYmVsIjoibm9uc2Vuc2Ui' // decompresses to null/garbage
    })
    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('my precious state')
  })

  test('Clear All + immediate reload stays cleared (flush race)', async ({ page }) => {
    await page.locator('textarea').first().fill('soon gone')
    await page.locator('textarea').nth(1).fill('also gone')
    await page.waitForTimeout(1300)
    await page.locator('.quick-btn', { hasText: 'Clear All' }).click()
    await page.reload() // immediately, inside the old 1s debounce window
    await expect(page.locator('textarea').first()).toHaveValue('')
    await expect(page.locator('textarea').nth(1)).toHaveValue('')
  })
})

test.describe('Keyboard shortcuts and undoable clears (D5)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('Mod+Shift+Digit1 copies the left pane (event.code matching)', async ({ page }) => {
    await page.locator('textarea').first().fill('left pane content')
    await page.locator('body').click() // focus outside the textarea
    await page.keyboard.press('ControlOrMeta+Shift+Digit1')
    await expect(page.locator('.toast-message', { hasText: 'copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('left pane content')
  })

  test('Mod+Shift+X swaps panes; Mod+Shift+R no longer clears anything', async ({ page }) => {
    await page.locator('textarea').first().fill('AAA')
    await page.locator('textarea').nth(1).fill('BBB')
    await page.keyboard.press('ControlOrMeta+Shift+KeyX')
    await expect(page.locator('textarea').first()).toHaveValue('BBB')
    await expect(page.locator('textarea').nth(1)).toHaveValue('AAA')

    // The old destructive binding must be gone
    await page.keyboard.press('ControlOrMeta+Shift+KeyR')
    await expect(page.locator('textarea').first()).toHaveValue('BBB')
  })

  test('Clear button shows an Undo toast that restores the text', async ({ page }) => {
    await page.locator('textarea').first().fill('do not lose me')
    await page.locator('.left-actions .clear-btn').click()
    await expect(page.locator('textarea').first()).toHaveValue('')

    const undo = page.locator('.toast-action', { hasText: 'Undo' })
    await expect(undo).toBeVisible()
    await undo.click()
    await expect(page.locator('textarea').first()).toHaveValue('do not lose me')
  })

  test('Alt+ArrowUp inside a textarea is NOT hijacked by diff navigation', async ({ page }) => {
    await page.locator('textarea').first().fill('line1\nline2')
    await page.locator('textarea').nth(1).fill('line1\nline9')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.diff-renderer')).toBeVisible()

    const ta = page.locator('textarea').first()
    await ta.click()
    await page.keyboard.press('Alt+ArrowUp')
    // Focus must remain in the textarea (no scroll-jump/nav side effect steals it)
    await expect(ta).toBeFocused()
  })
})

test.describe('One-sided compares (D7)', () => {
  test('empty left vs content right renders an all-added diff', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('text-compare')
    await page.locator('textarea').nth(1).fill('brand new line 1\nbrand new line 2')
    await expect(page.locator('.compare-btn')).toBeEnabled()
    await page.locator('.compare-btn').click()
    await expect(page.locator('.d2h-ins').first()).toBeVisible()
    await expect(page.locator('.diff-stat-chip--added')).toContainText('+2 added')
  })
})

test.describe('Formatter honest errors (D6)', () => {
  test('Beautify on truncated JSON shows the parse error, not silent success', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('format-text')
    await page.locator('textarea').first().fill('{"a":1,')
    await page.locator('button', { hasText: 'Beautify' }).first().click()
    await expect(page.locator('.p-message-error .p-message-text')).toBeVisible()
  })
})

test.describe('Timestamp zero and Base64 stale output (D7)', () => {
  test('epoch 0 converts to 1970-01-01', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('timestamp-converter')
    await page.locator('.timestamp-input').fill('0')
    await expect(page.locator('.result-item code', { hasText: '1970-01-01T00:00:00.000Z' })).toBeVisible()
  })

  test('Base64 decode error clears the previous output', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
    await page.locator('textarea').first().fill('aGVsbG8=')
    await page.locator('button', { hasText: 'Decode' }).click()
    await expect(page.locator('.output-text')).toHaveValue('hello')

    await page.locator('textarea').first().fill('not@@base64!!')
    await page.locator('button', { hasText: 'Decode' }).click()
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.output-text')).toHaveCount(0) // stale output gone
  })
})

test.describe('Upload validation (D7)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('extensionless text file (Makefile) uploads fine', async ({ page }) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dy-'))
    const file = path.join(dir, 'Makefile')
    fs.writeFileSync(file, 'all:\n\techo hi\n')
    await page.locator('input[type="file"]').first().setInputFiles(file)
    await expect(page.locator('textarea').first()).toHaveValue('all:\n\techo hi\n')
  })

  test('UTF-16LE text file decodes as text, not "binary"', async ({ page }) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dy-'))
    const file = path.join(dir, 'utf16.txt')
    // BOM FF FE + "hi" in UTF-16LE
    fs.writeFileSync(file, Buffer.from([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00]))
    await page.locator('input[type="file"]').first().setInputFiles(file)
    await expect(page.locator('textarea').first()).toHaveValue('hi')
  })

  test('empty file loads as empty with an info toast, not silently', async ({ page }) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dy-'))
    const file = path.join(dir, 'empty.txt')
    fs.writeFileSync(file, '')
    await page.locator('input[type="file"]').first().setInputFiles(file)
    await expect(page.locator('.toast-message', { hasText: 'empty' })).toBeVisible()
  })
})
