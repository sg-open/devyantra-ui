import { test, expect } from './fixtures/base'
import type { Page } from '@playwright/test'

/* ─── Helper: toggle to dark mode ─── */
async function setDarkMode(page: Page) {
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains('app-dark')
  )
  if (!isDark) {
    await page.locator('.theme-option:has-text("Dark")').click()
    await page.waitForTimeout(200)
  }
}

/* ═══════════════════════════════════════════
   FORMAT TEXT
   ═══════════════════════════════════════════ */
test.describe('Format Text Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('format-text')
  })

  test('should format JSON input correctly', async ({ page }) => {
    const input = '{"name":"test","value":123,"nested":{"a":1}}'
    await page.locator('textarea').first().fill(input)
    await page.locator('button:has-text("Beautify")').click()
    await page.waitForTimeout(500)

    const output = page.locator('.formatted-output')
    await expect(output).toBeVisible({ timeout: 5000 })
    const text = await output.textContent()
    expect(text).toContain('"name"')
    expect(text).toContain('"test"')
  })

  test('should load sample data', async ({ page }) => {
    await page.locator('.sample-btn, button:has-text("Sample")').click()
    await page.waitForTimeout(300)
    const textarea = page.locator('textarea').first()
    const value = await textarea.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('should clear input', async ({ page }) => {
    await page.locator('textarea').first().fill('test content')
    await page.locator('.clear-btn, button:has-text("Clear")').first().click()
    const value = await page.locator('textarea').first().inputValue()
    expect(value).toBe('')
  })

  test('should detect type tag for JSON', async ({ page }) => {
    await page.locator('textarea').first().fill('{"a":1}')
    await page.waitForTimeout(800) // detection debounce
    const tag = page.locator('.type-badge')
    await expect(tag).toBeVisible()
  })

  test('should show format type buttons', async ({ page }) => {
    const formatBtns = page.locator('.format-type-btn')
    await expect(formatBtns).toHaveCount(5) // JSON, SQL, XML, CSS, JS
  })

  test('should handle empty input gracefully', async ({ page }) => {
    // Button should be disabled when input is empty
    const btn = page.locator('button:has-text("Beautify")')
    await expect(btn).toBeDisabled()
  })

  test('should copy formatted output', async ({ page }) => {
    await page.locator('textarea').first().fill('{"a":1}')
    await page.locator('button:has-text("Beautify")').click()
    await page.waitForTimeout(500)
    // Output copy moved into <ToolActions> (Task 9, platform track) — the
    // ad-hoc panel-header copy button was removed to avoid a duplicate.
    const copyBtn = page.locator('.tool-actions button:has-text("Copy")')
    if (await copyBtn.isVisible()) {
      await copyBtn.click()
      // No error = success (clipboard API may not work in test env)
    }
  })

  test('should minify JSON input', async ({ page }) => {
    const input = '{\n  "name": "test",\n  "value": 123\n}'
    await page.locator('textarea').first().fill(input)
    await page.locator('button:has-text("Minify")').click()
    await page.waitForTimeout(500)

    const output = page.locator('.formatted-output')
    await expect(output).toBeVisible()
    const text = await output.textContent()
    // Minified JSON should have no newlines or extra spaces
    expect(text).toContain('"name"')
    expect(text).not.toContain('\n')
  })

  test('should format SQL input', async ({ page }) => {
    const input = 'SELECT id, name FROM users WHERE active = 1 ORDER BY name'
    await page.locator('textarea').first().fill(input)

    // Select SQL format type (must fill input first — buttons disabled when empty)
    await page.locator('.format-type-btn', { hasText: 'SQL' }).click()
    await page.locator('button:has-text("Beautify")').click()
    await page.waitForTimeout(500)

    const output = page.locator('.formatted-output')
    await expect(output).toBeVisible()
    const text = await output.textContent()
    expect(text).toContain('SELECT')
    expect(text).toContain('FROM')
  })
})

/* ═══════════════════════════════════════════
   HASH GENERATOR
   ═══════════════════════════════════════════ */
test.describe('Hash Generator Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('hash-generator')
  })

  test('should generate hashes for input text', async ({ page }) => {
    await page.locator('textarea').first().fill('hello world')
    await page.waitForTimeout(500)

    // Check that hash results appear
    const hashItems = page.locator('.hash-item')
    await expect(hashItems.first()).toBeVisible({ timeout: 5000 })

    // Verify MD5 hash is correct
    const md5Value = page.locator('.hash-item').first().locator('.hash-value')
    const md5Text = await md5Value.textContent()
    expect(md5Text).toBeTruthy()
    expect(md5Text!.length).toBeGreaterThan(10)
  })

  test('should toggle case', async ({ page }) => {
    await page.locator('textarea').first().fill('test')
    await page.waitForTimeout(500)

    // Get lowercase hash
    const hashBefore = await page.locator('.hash-value').first().textContent()

    // Toggle to uppercase
    await page.locator('.toggle-btn:has-text("UPPERCASE")').click()
    await page.waitForTimeout(300)
    const hashAfter = await page.locator('.hash-value').first().textContent()

    expect(hashAfter).toBe(hashBefore!.toUpperCase())
  })

  test('should clear input and hashes', async ({ page }) => {
    await page.locator('textarea').first().fill('test')
    await page.waitForTimeout(500)
    await expect(page.locator('.hash-results')).toBeVisible()

    // Clear moved into <ToolActions> (Task 9, platform track) — the ad-hoc
    // "Clear input" icon button was removed to avoid a duplicate.
    await page.locator('.tool-actions button:has-text("Clear")').click()
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should show byte count', async ({ page }) => {
    await page.locator('textarea').first().fill('hello')
    const byteCount = page.locator('.byte-count')
    await expect(byteCount).toContainText('5 bytes')
  })

  test('should copy individual hash', async ({ page }) => {
    await page.locator('textarea').first().fill('test')
    await page.waitForTimeout(500)
    const copyBtn = page.locator('[aria-label*="Copy"][aria-label*="hash"]').first()
    await expect(copyBtn).toBeVisible()
    await copyBtn.click()
  })

  test('should copy all hashes', async ({ page }) => {
    await page.locator('textarea').first().fill('test')
    await page.waitForTimeout(500)
    // "Copy All" was consolidated into <ToolActions>'s generic Copy button
    // (Task 9, platform track), bound to the same joined hash text.
    await page.locator('.tool-actions button:has-text("Copy")').click()
  })
})

/* ═══════════════════════════════════════════
   BASE64 TOOLS
   ═══════════════════════════════════════════ */
test.describe('Base64 Tools', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('base64-tools')
  })

  test('should encode text to Base64', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World')
    await page.locator('.encode-btn, button:has-text("Encode")').click()
    await page.waitForTimeout(300)

    const output = page.locator('.output-text, .output-section textarea')
    await expect(output).toBeVisible()
    const value = await output.inputValue()
    expect(value).toBe('SGVsbG8gV29ybGQ=')
  })

  test('should decode Base64 to text', async ({ page }) => {
    await page.locator('textarea').first().fill('SGVsbG8gV29ybGQ=')
    await page.locator('button:has-text("Decode")').click()
    await page.waitForTimeout(300)

    const output = page.locator('.output-text, .output-section textarea')
    const value = await output.inputValue()
    expect(value).toBe('Hello World')
  })

  test('should handle URL-safe encoding', async ({ page }) => {
    await page.locator('.toggle-btn:has-text("URL-safe")').click()
    await page.locator('textarea').first().fill('subjects?_d')
    await page.locator('.encode-btn, button:has-text("Encode")').click()
    await page.waitForTimeout(300)

    const output = page.locator('.output-text, .output-section textarea')
    const value = await output.inputValue()
    // URL-safe encoding should not contain + or /
    expect(value).not.toContain('+')
    expect(value).not.toContain('/')
  })

  test('should show error for invalid Base64', async ({ page }) => {
    await page.locator('textarea').first().fill('!!!invalid!!!')
    await page.locator('button:has-text("Decode")').click()
    await page.waitForTimeout(300)

    const error = page.locator('.error-message')
    await expect(error).toBeVisible()
  })

  test('should use output as input', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello')
    await page.locator('.encode-btn, button:has-text("Encode")').click()
    await page.waitForTimeout(300)

    await page.locator('[aria-label="Use output as input"]').click()
    await page.waitForTimeout(200)

    const inputValue = await page.locator('textarea').first().inputValue()
    expect(inputValue).toBe('SGVsbG8=')
  })

  test('should show char/byte counts', async ({ page }) => {
    await page.locator('textarea').first().fill('test')
    const charCount = page.locator('.char-count').first()
    await expect(charCount).toContainText('4 chars')
  })
})

/* ═══════════════════════════════════════════
   JWT DECODER
   ═══════════════════════════════════════════ */
test.describe('JWT Decoder Tool', () => {
  const VALID_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldllyISBEZXZlbG9wZXIiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6OTk5OTk5OTk5OX0.GjJ0D48L05bR-HNv3KT-W_6V3EWYQl3KQu0KJU2iFkI'

  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('jwt-decoder')
  })

  test('should decode a valid JWT', async ({ page }) => {
    await page.locator('textarea').first().fill(VALID_TOKEN)
    await page.waitForTimeout(500)

    // Parts should appear
    const parts = page.locator('.jwt-part')
    await expect(parts).toHaveCount(3) // Header, Payload, Signature

    // Header should contain alg
    const header = parts.first().locator('.jwt-json')
    await expect(header).toContainText('"alg"')
    await expect(header).toContainText('"HS256"')
  })

  test('should show valid status for correct JWT', async ({ page }) => {
    await page.locator('textarea').first().fill(VALID_TOKEN)
    await page.waitForTimeout(500)
    await expect(page.locator('.status-valid')).toBeVisible()
  })

  test('should show invalid status for bad input', async ({ page }) => {
    await page.locator('textarea').first().fill('not.a.jwt')
    await page.waitForTimeout(500)
    await expect(page.locator('.status-invalid')).toBeVisible()
  })

  test('should load example tokens', async ({ page }) => {
    await page.locator('.quick-btn').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.jwt-part')).toHaveCount(3)
  })

  test('should clear token', async ({ page }) => {
    await page.locator('textarea').first().fill(VALID_TOKEN)
    await page.waitForTimeout(300)
    // Clear moved into <ToolActions> (Task 10, platform track) — the ad-hoc
    // "Clear token" icon button was removed to avoid a duplicate control.
    await page.locator('.tool-actions button:has-text("Clear")').click()
    const value = await page.locator('textarea').first().inputValue()
    expect(value).toBe('')
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should copy header part', async ({ page }) => {
    await page.locator('textarea').first().fill(VALID_TOKEN)
    await page.waitForTimeout(500)
    const copyBtn = page.locator('.jwt-part').first().locator('button:has-text("Copy")')
    await expect(copyBtn).toBeVisible()
    await copyBtn.click()
  })

  test('should show token expiry info', async ({ page }) => {
    await page.locator('textarea').first().fill(VALID_TOKEN)
    await page.waitForTimeout(500)

    const tokenInfo = page.locator('.token-info')
    await expect(tokenInfo).toBeVisible()
    await expect(tokenInfo).toContainText('Issued')
    await expect(tokenInfo).toContainText('Expires')
  })

  test('should show expired token status', async ({ page }) => {
    // Load the expired example
    await page.locator('.quick-btn:has-text("Expired")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('.info-value.expired').first()).toBeVisible()
  })
})

/* ═══════════════════════════════════════════
   TIMESTAMP CONVERTER
   ═══════════════════════════════════════════ */
test.describe('Timestamp Converter Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('timestamp-converter')
  })

  test('should display current time', async ({ page }) => {
    const unixSeconds = page.locator('.time-item code').first()
    await expect(unixSeconds).toBeVisible()
    const value = await unixSeconds.textContent()
    const num = parseInt(value!)
    expect(num).toBeGreaterThan(1700000000) // reasonable timestamp
  })

  test('should convert timestamp to date', async ({ page }) => {
    await page.locator('.timestamp-input, input[type="number"]').fill('1700000000')
    await page.waitForTimeout(300)

    const result = page.locator('.result-item code').first()
    await expect(result).toBeVisible()
    // Nov 14, 2023 in some locale
    const text = await result.textContent()
    expect(text).toContain('2023')
  })

  test('should convert date to timestamp', async ({ page }) => {
    await page.locator('.datetime-input, input[type="datetime-local"]').fill('2024-01-15T12:00')
    await page.waitForTimeout(300)

    const secResult = page.locator('.result-items').last().locator('code').first()
    await expect(secResult).toBeVisible()
    const value = await secResult.textContent()
    const num = parseInt(value!)
    expect(num).toBeGreaterThan(1700000000)
  })

  test('should toggle seconds/milliseconds', async ({ page }) => {
    await page.locator('.timestamp-input, input[type="number"]').fill('1700000000000')
    await page.locator('.toggle-btn:has-text("ms")').click()
    await page.waitForTimeout(300)

    const result = page.locator('.result-item code').first()
    const text = await result.textContent()
    expect(text).toContain('2023')
  })

  test('should display reference timestamps', async ({ page }) => {
    const refs = page.locator('.reference-item')
    await expect(refs).toHaveCount(4) // Epoch, Y2K, Max 32-bit, Now
  })

  test('should have copy buttons with aria-labels', async ({ page }) => {
    await page.locator('.copy-icon').first().waitFor({ state: 'attached' })
    const copyBtns = page.locator('.copy-icon')
    const count = await copyBtns.count()
    expect(count).toBeGreaterThanOrEqual(4)

    // All should have aria-label
    for (let i = 0; i < count; i++) {
      const ariaLabel = await copyBtns.nth(i).getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})

/* ═══════════════════════════════════════════
   CHARACTER COUNT
   ═══════════════════════════════════════════ */
test.describe('Character Count Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('character-count')
  })

  test('should count characters correctly', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World')
    await page.waitForTimeout(300)

    // 11 characters
    const charCard = page.locator('.stat-card').first().locator('.stat-value')
    await expect(charCard).toContainText('11')
  })

  test('should count words correctly', async ({ page }) => {
    await page.locator('textarea').first().fill('one two three four five')
    await page.waitForTimeout(300)

    // 5 words — find the Words stat card
    const wordsCard = page.locator('.stat-card.success .stat-value')
    await expect(wordsCard).toContainText('5')
  })

  test('should show detailed analysis for non-empty text', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World. This is a test sentence.')
    await page.waitForTimeout(300)

    const analysis = page.locator('.detailed-analysis')
    await expect(analysis).toBeVisible()
    await expect(analysis).toContainText('Sentences')
  })

  test('should show empty state when no text', async ({ page }) => {
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should clear text and reset stats', async ({ page }) => {
    await page.locator('textarea').first().fill('test text')
    await page.waitForTimeout(200)
    // Clear/Copy consolidated into <ToolActions> (Task 10, platform track) —
    // the ad-hoc "Clear Text"/"Copy Stats" buttons were removed to avoid a
    // duplicate control.
    await page.locator('.tool-actions button:has-text("Clear")').click()

    const value = await page.locator('textarea').first().inputValue()
    expect(value).toBe('')

    const charValue = page.locator('.stat-card').first().locator('.stat-value')
    await expect(charValue).toContainText('0')
  })

  test('should copy stats', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello World')
    await page.waitForTimeout(200)
    await page.locator('.tool-actions button:has-text("Copy")').click()
    // No error = success
  })

  test('should handle unicode correctly', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello 🌍 World')
    await page.waitForTimeout(300)

    // Should count characters (emoji may be 2 chars in JS)
    const charCard = page.locator('.stat-card').first().locator('.stat-value')
    const value = await charCard.textContent()
    expect(parseInt(value!)).toBeGreaterThanOrEqual(13)
  })
})

/* ═══════════════════════════════════════════
   DELIMITER TOOL
   ═══════════════════════════════════════════ */
test.describe('Delimiter Tool', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('delimiter')
  })

  test('should convert newline-separated to delimited', async ({ page }) => {
    // Find the newline textarea (right panel)
    const newlineArea = page.locator('textarea').last()
    await newlineArea.fill('one\ntwo\nthree')

    // Click the convert button (left arrow = convert newline to delimited)
    const toDelimitedBtn = page.locator('.convert-btn[title="Convert newline text to delimited"]')
    await toDelimitedBtn.click()
    await page.waitForTimeout(300)

    const delimitedArea = page.locator('textarea').first()
    const value = await delimitedArea.inputValue()
    // Should be comma-separated by default
    expect(value).toContain('one')
  })

  test('should switch delimiter types', async ({ page }) => {
    await page.locator('.delimiter-btn').first().waitFor({ state: 'visible' })
    const delimBtns = page.locator('.delimiter-btn')
    const count = await delimBtns.count()
    expect(count).toBeGreaterThanOrEqual(3) // comma, tab, pipe, etc.

    // Click each to verify no crash
    for (let i = 0; i < Math.min(count, 4); i++) {
      await delimBtns.nth(i).click()
      await page.waitForTimeout(200)
    }
  })

  test('should have panel labels', async ({ page }) => {
    const labels = page.locator('.input-label')
    await expect(labels).toHaveCount(2) // "Delimited Text" and "Newline Separated"
  })

  test('should convert delimited to newline-separated', async ({ page }) => {
    const delimitedArea = page.locator('textarea').first()
    await delimitedArea.fill('apple,banana,cherry')

    const toNewlinesBtn = page.locator('.convert-btn[title="Convert delimited text to newlines"]')
    await toNewlinesBtn.click()
    await page.waitForTimeout(300)

    const newlineArea = page.locator('textarea').last()
    const value = await newlineArea.inputValue()
    expect(value).toBe('apple\nbanana\ncherry')
  })

  test('should use pipe delimiter', async ({ page }) => {
    // Select pipe delimiter
    await page.locator('.delimiter-btn', { hasText: 'Pipe' }).click()

    const newlineArea = page.locator('textarea').last()
    await newlineArea.fill('one\ntwo\nthree')

    const toDelimitedBtn = page.locator('.convert-btn[title="Convert newline text to delimited"]')
    await toDelimitedBtn.click()
    await page.waitForTimeout(300)

    const delimitedArea = page.locator('textarea').first()
    const value = await delimitedArea.inputValue()
    expect(value).toBe('one|two|three')
  })

  test('should support custom delimiter', async ({ page }) => {
    // Click Custom button
    await page.locator('.delimiter-btn.custom-btn').click()

    // Enter custom delimiter
    const customInput = page.locator('.custom-delimiter-input')
    await expect(customInput).toBeVisible()
    await customInput.fill(' :: ')

    // Fill newline text and convert
    const newlineArea = page.locator('textarea').last()
    await newlineArea.fill('a\nb\nc')

    const toDelimitedBtn = page.locator('.convert-btn[title="Convert newline text to delimited"]')
    await toDelimitedBtn.click()
    await page.waitForTimeout(300)

    const delimitedArea = page.locator('textarea').first()
    const value = await delimitedArea.inputValue()
    expect(value).toBe('a :: b :: c')
  })

  test('should trim whitespace during conversion', async ({ page }) => {
    // Trim whitespace is on by default
    const delimitedArea = page.locator('textarea').first()
    await delimitedArea.fill('  apple , banana , cherry  ')

    const toNewlinesBtn = page.locator('.convert-btn[title="Convert delimited text to newlines"]')
    await toNewlinesBtn.click()
    await page.waitForTimeout(300)

    const newlineArea = page.locator('textarea').last()
    const value = await newlineArea.inputValue()
    expect(value).toBe('apple\nbanana\ncherry')
  })

  test('should remove empty lines during conversion', async ({ page }) => {
    // Remove empty lines is on by default
    const newlineArea = page.locator('textarea').last()
    await newlineArea.fill('one\n\ntwo\n\nthree')

    const toDelimitedBtn = page.locator('.convert-btn[title="Convert newline text to delimited"]')
    await toDelimitedBtn.click()
    await page.waitForTimeout(300)

    const delimitedArea = page.locator('textarea').first()
    const value = await delimitedArea.inputValue()
    expect(value).toBe('one,two,three')
  })

  test('should clear delimited and newline panels independently', async ({ page }) => {
    const delimitedArea = page.locator('textarea').first()
    const newlineArea = page.locator('textarea').last()

    await delimitedArea.fill('some,data')
    await newlineArea.fill('some\ndata')

    // Each panel got its own <ToolActions> (Task 10, platform track) — the
    // ad-hoc per-panel "Clear"/"Copy" buttons were removed to avoid a
    // duplicate control. One ToolActions instance per panel preserves the
    // original first()/last() independence check.
    const clearBtns = page.locator('.tool-actions button:has-text("Clear")')

    // Clear left panel
    await clearBtns.first().click()
    await expect(delimitedArea).toHaveValue('')
    await expect(newlineArea).toHaveValue('some\ndata')

    // Clear right panel
    await clearBtns.last().click()
    await expect(newlineArea).toHaveValue('')
  })

  test('should show item and line counts', async ({ page }) => {
    const delimitedArea = page.locator('textarea').first()
    await delimitedArea.fill('a,b,c,d')

    const itemCount = page.locator('.item-count')
    await expect(itemCount).toContainText('4 items')
  })
})

/* ═══════════════════════════════════════════
   CROSS-CUTTING: THEME TOGGLE IN BOTH MODES
   ═══════════════════════════════════════════ */
test.describe('Theme toggle across all tools', () => {
  const tools = [
    'format-text',
    'hash-generator',
    'base64-tools',
    'jwt-decoder',
    'timestamp-converter',
    'character-count',
    'delimiter',
  ]

  for (const tool of tools) {
    test(`${tool} renders without errors in dark mode`, async ({ page, devyantra }) => {
      await devyantra.navigateToTool(tool)
      await setDarkMode(page)
      await page.waitForTimeout(300)

      // No console errors
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))

      // Verify page still has content
      await expect(page.locator('#main-content')).toBeVisible()
      expect(errors).toHaveLength(0)
    })
  }
})

/* ═══════════════════════════════════════════
   ACCESSIBILITY: HEADING HIERARCHY + ARIA
   ═══════════════════════════════════════════ */
test.describe('Accessibility checks across tools', () => {
  const tools = [
    'format-text',
    'hash-generator',
    'base64-tools',
    'jwt-decoder',
    'timestamp-converter',
    'character-count',
    'delimiter',
  ]

  for (const tool of tools) {
    test(`${tool} has no heading level skips`, async ({ page, devyantra }) => {
      await devyantra.navigateToTool(tool)

      const headingLevels = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        return Array.from(headings)
          .filter((h) => (h as HTMLElement).offsetParent !== null) // visible only
          .map((h) => parseInt(h.tagName[1]!))
      })

      // Check no skips: each level is at most 1 more than previous
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i]! - headingLevels[i - 1]!
        expect(diff).toBeLessThanOrEqual(1)
      }
    })

    test(`${tool} icon-only buttons have aria-labels`, async ({ page, devyantra }) => {
      await devyantra.navigateToTool(tool)

      const missingLabels = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button:not([disabled])')
        const missing: string[] = []
        buttons.forEach((btn) => {
          const el = btn as HTMLElement
          if (el.offsetParent === null) return // skip hidden
          const hasText = el.textContent?.trim().length ?? 0 > 0
          const hasAriaLabel = el.hasAttribute('aria-label')
          const hasAriaLabelledBy = el.hasAttribute('aria-labelledby')
          // Check if it's icon-only (only contains <i> or <svg>)
          const children = Array.from(el.childNodes).filter(
            (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
          )
          const isIconOnly =
            children.length === 1 &&
            children[0]!.nodeType === Node.ELEMENT_NODE &&
            ((children[0] as Element).tagName === 'I' || (children[0] as Element).tagName === 'SVG')

          if (isIconOnly && !hasAriaLabel && !hasAriaLabelledBy && !hasText) {
            missing.push(el.outerHTML.substring(0, 100))
          }
        })
        return missing
      })

      expect(missingLabels).toHaveLength(0)
    })
  }
})
