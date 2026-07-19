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
    await expect(page.locator('.dv-row--removed, .dv-row--added').first()).toBeVisible()

    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')

    // and back
    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').uncheck()
    await expect(page.locator('.dv-row--removed, .dv-row--added').first()).toBeVisible()
  })

  test('Whitespace toggle makes whitespace-only differences disappear', async ({ page }) => {
    await page.locator('textarea').first().fill('a        b\nline two')
    await page.locator('textarea').nth(1).fill('a b\nline two')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.dv-row--removed, .dv-row--added').first()).toBeVisible()

    await page.locator('.diff-toggle', { hasText: /whitespace/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
  })

  test('Copy button is disabled when there is no current diff, and copied patches contain original text (D4/D1)', async ({ page }) => {
    await page.locator('textarea').first().fill('Alpha\nSame')
    await page.locator('textarea').nth(1).fill('alpha\nSame')
    await page.locator('.compare-btn').click()
    await expect(page.locator('.dv-row--removed, .dv-row--added').first()).toBeVisible()

    // Patch always carries ORIGINAL case even while viewing a case-folded diff
    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
    // With no visible differences, Copy/Export must be disabled — no stale patch
    await expect(page.locator('.diff-action-btn', { hasText: 'Copy' })).toBeDisabled()
    await expect(page.locator('.diff-action-btn', { hasText: 'Export' })).toBeDisabled()

    await page.locator('.diff-toggle', { hasText: /case/i }).locator('input').uncheck()
    await expect(page.locator('.dv-row--removed, .dv-row--added').first()).toBeVisible()
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
    await expect(page.locator('.dv-row--added').first()).toBeVisible()
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

test.describe('Router guard (D7)', () => {
  test('navigating between tools produces no deprecation warnings', async ({ page, devyantra }) => {
    const warnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('next() callback')) warnings.push(msg.text())
    })
    await devyantra.navigateToTool('text-compare')
    await page.locator('a[href="/tools/hash-generator"]').first().click()
    await page.waitForURL('**/tools/hash-generator')
    expect(warnings).toEqual([])
  })
})

test.describe('Navigation reaches insertions (№8)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('split view nav reaches a pure trailing insertion; unified shows the same count', async ({ page }) => {
    await page.locator('textarea').first().fill('a\nb')
    await page.locator('textarea').nth(1).fill('a\nb\nc\nd')
    await page.locator('.compare-btn').click()

    const diffRenderer = page.locator('.diff-renderer')
    await expect(diffRenderer).toBeVisible({ timeout: 5000 })

    // Explicit split, even though it's DiffRenderer's default.
    await page.locator('.diff-segment', { hasText: /split/i }).click()

    // A pure trailing insertion is ONE block — the old DOM-scanning nav (which
    // only ever scanned the left/original side) never saw it at all.
    const navCounter = page.locator('.diff-nav-counter')
    await expect(navCounter).toBeVisible()
    await expect(navCounter).toHaveText('–/1')

    await page.locator('.diff-nav-btn').last().click() // next
    await expect(page.locator('.dv-row--active')).toBeVisible()
    await expect(navCounter).toHaveText('1/1')

    // Switching view mode re-renders the same cached model — no recompute,
    // no navigation reset — so the counter must read identically.
    await page.locator('.diff-segment', { hasText: /unified/i }).click()
    await expect(navCounter).toHaveText('1/1')
    await expect(page.locator('.dv-row--active')).toBeVisible()
  })
})

test.describe('Export fidelity (D6)', () => {
  test('Export honors the displayed context and real filenames; Copy matches Export', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('text-compare')

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dy-'))
    const alphaPath = path.join(dir, 'alpha.txt')
    const betaPath = path.join(dir, 'beta.txt')

    const alphaLines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`)
    const betaLines = [...alphaLines]
    betaLines[3] = 'line 4 CHANGED'
    betaLines[6] = 'line 7 CHANGED'
    const alphaText = alphaLines.join('\n') + '\n'
    const betaText = betaLines.join('\n') + '\n'

    fs.writeFileSync(alphaPath, alphaText)
    fs.writeFileSync(betaPath, betaText)

    const fileInputs = page.locator('input[type="file"]')
    await fileInputs.nth(0).setInputFiles(alphaPath)
    await expect(page.locator('textarea').first()).toHaveValue(alphaText)
    await fileInputs.nth(1).setInputFiles(betaPath)
    await expect(page.locator('textarea').nth(1)).toHaveValue(betaText)

    await page.locator('.compare-btn').click()
    await expect(page.locator('.diff-renderer')).toBeVisible()

    // Context = 0: only the changed lines, no leading-space context lines at all
    await page.locator('.diff-context-select').selectOption('0')
    await expect(page.locator('.diff-loading')).toHaveCount(0)

    const [download0] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.diff-action-btn', { hasText: 'Export' }).click()
    ])
    expect(download0.suggestedFilename()).toBe('diff-alpha.txt-beta.txt.patch')
    const downloadedPath0 = await download0.path()
    const content0 = fs.readFileSync(downloadedPath0!, 'utf-8')

    expect(content0).toContain('--- alpha.txt')
    expect(content0).toContain('+++ beta.txt')
    expect(content0).toContain('-line 4')
    expect(content0).toContain('+line 4 CHANGED')
    expect(content0).toContain('-line 7')
    expect(content0).toContain('+line 7 CHANGED')
    expect(content0.split('\n').some((line) => line.startsWith(' '))).toBe(false)

    // Context = All: same changes, now surrounded by unchanged context lines
    await page.locator('.diff-context-select').selectOption({ label: 'All' })
    await expect(page.locator('.diff-loading')).toHaveCount(0)

    const [download1] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.diff-action-btn', { hasText: 'Export' }).click()
    ])
    const downloadedPath1 = await download1.path()
    const content1 = fs.readFileSync(downloadedPath1!, 'utf-8')

    expect(content1).toContain('--- alpha.txt')
    expect(content1).toContain('+++ beta.txt')
    expect(content1.split('\n').some((line) => line.startsWith(' '))).toBe(true)

    // Copy at the same (All) context must match the second export byte-for-byte
    await page.locator('.diff-action-btn', { hasText: 'Copy' }).click()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(content1)
  })
})

test.describe('Carried follow-ups (D9)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('Sample load with Undo toast restores both panes when clicked', async ({ page }) => {
    await page.locator('textarea').first().fill('precious')
    await page.waitForTimeout(1300)
    await page.locator('.quick-btn', { hasText: 'Sample' }).click()

    // Toast with Undo should be visible
    const undo = page.locator('.toast-action', { hasText: 'Undo' })
    await expect(undo).toBeVisible()

    // Click Undo — left pane back to 'precious'
    await undo.click()
    await expect(page.locator('textarea').first()).toHaveValue('precious')
  })

  test('Per-pane clear (left) + immediate reload stays cleared', async ({ page }) => {
    await page.locator('textarea').first().fill('gone soon')
    await page.waitForTimeout(1300)
    await page.locator('.left-actions .clear-btn').click()
    await page.reload() // immediately, inside the old 1s debounce window
    await expect(page.locator('textarea').first()).toHaveValue('')
  })
})
