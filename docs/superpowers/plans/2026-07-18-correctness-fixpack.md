# Correctness Fix Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every lying-feature and data-loss bug from the 2026-07-18 audit (dead ignore toggles, share-lifecycle data loss, silent clipboard/share/export failures, formatter silent success, broken/colliding shortcuts) plus dead-code cleanup — each fix landing with a behavior-asserting test.

**Architecture:** All changes are surgical edits inside the existing Vue 3 SFC + composables structure. Two tiny new shared primitives are added first (`useClipboard` composable, toast `action` support) because later tasks consume them. Diff computation stays synchronous jsdiff→diff2html (the Worker rework is a separate later spec); this plan only makes its options honest and its outputs truthful.

**Tech Stack:** Vue 3.5 Composition API, TypeScript, `diff@9` (jsdiff), `diff2html@3`, `lz-string`, Vitest 4 (jsdom), Playwright (chromium project for new e2e).

**Spec:** `docs/superpowers/specs/2026-07-18-correctness-fixpack-design.md`

## Global Constraints

- Work on branch `fix/correctness-pack` in `/Users/shaurya/devyantra-ui`. Node `^20.19.0 || >=22.12.0` (run `source ~/.nvm/nvm.sh && nvm use` if the default node is older).
- **No new npm dependencies.** Everything uses libraries already in `package.json`.
- Gates that must stay green after every task: `npm run type-check && npm run lint && npm run test:run`.
- E2E runs are chromium-only for speed: `npx playwright test <file> --project=chromium --reporter=line`. The dev server is started automatically by Playwright config.
- TDD: write the failing test first, watch it fail, implement, watch it pass, commit.
- Invariant from the spec (D1): **ignore options affect comparison, never exported content** — `lastPatch` is always generated from the original, unfolded texts.
- New e2e behavior tests all go in one new file `tests/e2e/correctness-fixes.spec.ts`; each task appends its own `describe` block (the file is created in Task 3).
- Commit messages end with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: `useClipboard` composable — copy feedback everywhere (spec D3)

**Files:**
- Create: `src/composables/useClipboard.ts`
- Test: `src/composables/__tests__/useClipboard.spec.ts`

**Interfaces:**
- Consumes: `useToast()` from `@/composables/useToast` (existing: `add({severity, summary, detail?, life?})`).
- Produces: `useClipboard(): { copyWithFeedback(text: string, label?: string): Promise<boolean> }` — Tasks 3, 5, 6 call this.

- [ ] **Step 1: Write the failing test**

Create `src/composables/__tests__/useClipboard.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useClipboard } from '../useClipboard'
import { useToast } from '../useToast'

describe('useClipboard', () => {
  beforeEach(() => {
    // Reset shared toast state between tests (module-level singleton)
    const { messages } = useToast()
    messages.value.splice(0, messages.value.length)
    vi.restoreAllMocks()
  })

  it('copies via navigator.clipboard and shows a success toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('hello', 'Original text')

    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    const { messages } = useToast()
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0]!.severity).toBe('success')
    expect(messages.value[0]!.summary).toBe('Original text copied')
  })

  it('falls back to execCommand when navigator.clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {}) // no clipboard (e.g. plain-HTTP context)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand as unknown as typeof document.execCommand

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('fallback text')

    expect(ok).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    const { messages } = useToast()
    expect(messages.value[0]!.severity).toBe('success')
    expect(messages.value[0]!.summary).toBe('Text copied')
  })

  it('shows an error toast when every strategy fails', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('nope')

    expect(ok).toBe(false)
    const { messages } = useToast()
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0]!.severity).toBe('error')
    expect(messages.value[0]!.summary).toBe('Copy failed')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/composables/__tests__/useClipboard.spec.ts`
Expected: FAIL — `Cannot find module '../useClipboard'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `src/composables/useClipboard.ts`:

```ts
import { useToast } from '@/composables/useToast'

/**
 * Clipboard writes with mandatory user feedback.
 * Falls back to execCommand('copy') where the async Clipboard API is
 * unavailable (non-secure contexts) or rejects (permissions).
 */
export function useClipboard() {
  const toast = useToast()

  const copyWithFeedback = async (text: string, label = 'Text'): Promise<boolean> => {
    const ok = await writeClipboard(text)
    if (ok) {
      toast.add({ severity: 'success', summary: `${label} copied`, life: 2000 })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Copy failed',
        detail: 'Clipboard is unavailable in this context.',
        life: 4000
      })
    }
    return ok
  }

  return { copyWithFeedback }
}

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to execCommand
    }
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/composables/__tests__/useClipboard.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/composables/useClipboard.ts src/composables/__tests__/useClipboard.spec.ts
git commit -m "feat: add useClipboard composable with mandatory copy feedback

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Toast `action` support (Undo buttons) (spec D5 dependency)

**Files:**
- Modify: `src/composables/useToast.ts`
- Modify: `src/components/AppToast.vue`
- Test: `src/components/__tests__/AppToast.spec.ts` (create)

**Interfaces:**
- Produces: `ToastMessage.action?: { label: string; handler: () => void }` — clicking the rendered action button invokes `handler` then removes the toast. Task 5 consumes this for Undo.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/AppToast.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppToast from '../AppToast.vue'
import { useToast } from '@/composables/useToast'

describe('AppToast actions', () => {
  beforeEach(() => {
    const { messages } = useToast()
    messages.value.splice(0, messages.value.length)
  })

  it('renders an action button and runs the handler, then dismisses', async () => {
    const wrapper = mount(AppToast)
    const handler = vi.fn()
    const { add, messages } = useToast()

    add({ severity: 'info', summary: 'Cleared', action: { label: 'Undo', handler } })
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('.toast-action')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Undo')

    await btn.trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(messages.value).toHaveLength(0) // dismissed after action
  })

  it('renders no action button for plain toasts', async () => {
    const wrapper = mount(AppToast)
    const { add } = useToast()
    add({ severity: 'success', summary: 'Copied' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast-action').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/__tests__/AppToast.spec.ts`
Expected: FAIL — TypeScript/object error on `action` property (not in `ToastMessage`), and `.toast-action` not found.

- [ ] **Step 3: Implement**

In `src/composables/useToast.ts`, replace the `ToastMessage` interface:

```ts
export interface ToastMessage {
  id: number
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail?: string
  life?: number
  action?: { label: string; handler: () => void }
}
```

In `src/components/AppToast.vue`, replace this template block:

```html
        <div class="toast-body">
          <div class="toast-summary">{{ msg.summary }}</div>
          <div v-if="msg.detail" class="toast-detail">{{ msg.detail }}</div>
        </div>
```

with:

```html
        <div class="toast-body">
          <div class="toast-summary">{{ msg.summary }}</div>
          <div v-if="msg.detail" class="toast-detail">{{ msg.detail }}</div>
        </div>
        <button v-if="msg.action" class="toast-action" @click="runAction(msg)">
          {{ msg.action.label }}
        </button>
```

In the same file's `<script setup>`, replace:

```ts
import { useToast } from '@/composables/useToast'

const { messages, remove } = useToast()
```

with:

```ts
import { useToast, type ToastMessage } from '@/composables/useToast'

const { messages, remove } = useToast()

const runAction = (msg: ToastMessage) => {
  msg.action?.handler()
  remove(msg.id)
}
```

And add to the `<style scoped>` block (after the `.toast-close i` rule):

```css
.toast-action {
  align-self: center;
  flex-shrink: 0;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--dt-brand);
  border-radius: var(--radius-sm);
  color: var(--dt-brand);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toast-action:hover {
  background: var(--dt-brand);
  color: #ffffff;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/__tests__/AppToast.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/composables/useToast.ts src/components/AppToast.vue src/components/__tests__/AppToast.spec.ts
git commit -m "feat: toast action buttons (undo support)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire the ignore toggles + honest compute/export (spec D1 + D4)

The Whitespace/Case checkboxes currently do nothing: `CompareText.vue` hardcodes `:ignore-whitespace="false" :ignore-case="false"` and never listens for `options-changed`. Also `lastPatch` survives "No differences found", so Copy/Export can emit a stale patch.

**Semantics being implemented (from spec D1):**
- Whitespace: pass jsdiff's native `ignoreWhitespace: true` to `createTwoFilesPatch` (comparison-level; displayed content stays original).
- Case: jsdiff has no line-level `ignoreCase`, so fold both sides with `toLowerCase()` for the *compared/displayed* diff (the pre-authorized dual-track fallback in the spec's Risks).
- `lastPatch` (Copy/Export source) is **always** built from the raw original texts with no options.
- When the diff is empty (identical, or equal-under-options): clear `lastPatch`, disable Copy/Export.

**Files:**
- Modify: `src/components/DiffRenderer.vue` (lines ~78–95 template buttons, ~273–376 script)
- Modify: `src/components/CompareText.vue` (lines ~193–202 template, ~279–286 script)
- Modify: `tests/e2e/text-compare.spec.ts` (replace the visibility-only toggle test, lines ~268–290)
- Test: `tests/e2e/correctness-fixes.spec.ts` (create)

**Interfaces:**
- Consumes: `useClipboard` from Task 1.
- Produces: `CompareText` now owns `diffOptions = ref<{ ignoreWhitespace: boolean; ignoreCase: boolean }>` — this exact ref is passed to `useShareState` (Task 4 relies on it carrying real values).

- [ ] **Step 1: Write the failing e2e tests**

Create `tests/e2e/correctness-fixes.spec.ts`:

```ts
import { test, expect } from './fixtures/base'

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
```

Also in `tests/e2e/text-compare.spec.ts`, replace the body of the test `'should toggle ignore whitespace and ignore case options'` (currently ending with only a visibility assertion) with a behavior assertion — replace these lines:

```ts
    // Click it
    await caseToggle.locator('input[type="checkbox"]').click()
    await page.waitForTimeout(500)

    // After ignoring case, texts become identical — diff renderer hides or shows "No differences"
    // The diff-renderer container still exists but may show empty state
    const diffRenderer = page.locator('.diff-renderer')
    await expect(diffRenderer).toBeVisible()
```

with:

```ts
    // Click it — case-only differences must disappear
    await caseToggle.locator('input[type="checkbox"]').check()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
```

- [ ] **Step 2: Run e2e to verify it fails**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line`
Expected: the three new tests and the modified toggle test FAIL (diff does not change when toggling); the rest of text-compare passes.

- [ ] **Step 3: Implement — DiffRenderer.vue**

3a. Replace the two action buttons in the template (the `<!-- Action Buttons -->` block) with disabled-aware versions:

```html
      <!-- Action Buttons -->
      <div class="diff-actions">
        <button
          class="diff-action-btn"
          :disabled="!lastPatch"
          @click="copyDiffToClipboard"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x2398;</span>
          <span class="diff-action-text">Copy</span>
        </button>
        <button
          class="diff-action-btn"
          :disabled="!lastPatch"
          @click="downloadPatch"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x21E9;</span>
          <span class="diff-action-text">Export</span>
        </button>
      </div>
```

3b. In the script, add the import at the top with the other imports:

```ts
import { useClipboard } from '@/composables/useClipboard'
```

and after `const navigation = useDiffNavigation(diffContainerRef)` add:

```ts
const clipboard = useClipboard()

const patchActionTitle = computed(() =>
  props.ignoreWhitespace || props.ignoreCase
    ? 'Patch of the original texts — includes differences the active ignore options hide'
    : 'Unified diff of the compared texts'
)
```

3c. Delete the whole `preprocessText` function (lines starting `const preprocessText = (text: string): string => {` through its closing brace) and replace `computeDiff` entirely with:

```ts
// Case folding affects the compared/displayed diff only. Exported patches
// never use folded text — see the lastPatch assignment below.
const foldCase = (text: string): string => (props.ignoreCase ? text.toLowerCase() : text)

const computeDiff = async () => {
  if (!props.leftText && !props.rightText) {
    diffOutputHtml.value = ''
    lastPatch.value = ''
    renderedStats.value = null
    return
  }

  isLoading.value = true
  renderedStats.value = null

  try {
    await nextTick()

    const startTime = performance.now()
    const left = foldCase(props.leftText)
    const right = foldCase(props.rightText)
    const compareOptions = { ignoreWhitespace: props.ignoreWhitespace }

    // Full-context patch over the compared texts — source of truth for stats
    const leftLineCount = left.split('\n').length
    const rightLineCount = right.split('\n').length
    const fullCtx = Math.max(leftLineCount, rightLineCount)

    const fullPatch = createTwoFilesPatch(
      'original', 'modified',
      left, right,
      '', '',
      { context: fullCtx, ...compareOptions }
    )

    const fullDiffJson = diff2htmlParse(fullPatch)
    const computeTime = Math.round(performance.now() - startTime)
    const stats = computeStatsFromParsed(fullDiffJson, computeTime)

    if (stats.additions === 0 && stats.deletions === 0 && stats.modifications === 0) {
      // Identical under the current options — show empty state, and make sure
      // Copy/Export cannot emit a stale patch from a previous comparison.
      diffOutputHtml.value = ''
      lastPatch.value = ''
      return
    }

    renderedStats.value = stats

    // Render with the user-chosen context lines
    const renderCtx = contextLines.value === Infinity ? fullCtx : contextLines.value
    let renderPatch = fullPatch
    if (renderCtx !== fullCtx) {
      renderPatch = createTwoFilesPatch(
        'original', 'modified',
        left, right,
        '', '',
        { context: renderCtx, ...compareOptions }
      )
    }

    const renderDiffJson = diff2htmlParse(renderPatch)
    diffOutputHtml.value = diff2htmlHtml(renderDiffJson, {
      outputFormat: props.mode === 'split' ? 'side-by-side' : 'line-by-line',
      drawFileList: false,
      matching: 'lines',
      renderNothingWhenEmpty: true
    })

    // Copy/Export always reflect the ORIGINAL texts (never case-folded, no
    // ignore options) so exported patches stay appliable.
    lastPatch.value = createTwoFilesPatch(
      'original', 'modified',
      props.leftText, props.rightText,
      '', '',
      { context: fullCtx }
    )

    emit('diff-computed', stats)
  } catch (error) {
    console.error('Error computing diff:', error)
  } finally {
    isLoading.value = false
  }
}
```

3d. The option updaters currently call `computeDiff()` directly, which would double-compute once the props are wired (the props watcher also fires). Replace both:

```ts
const updateIgnoreWhitespace = (value: boolean) => {
  emitOptionsChanged({ ignoreWhitespace: value })
  computeDiff()
}

const updateIgnoreCase = (value: boolean) => {
  emitOptionsChanged({ ignoreCase: value })
  computeDiff()
}
```

with:

```ts
const updateIgnoreWhitespace = (value: boolean) => {
  emitOptionsChanged({ ignoreWhitespace: value })
}

const updateIgnoreCase = (value: boolean) => {
  emitOptionsChanged({ ignoreCase: value })
}
```

3e. Replace `copyDiffToClipboard`:

```ts
const copyDiffToClipboard = async () => {
  if (!lastPatch.value) return
  try {
    await navigator.clipboard.writeText(lastPatch.value)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}
```

with:

```ts
const copyDiffToClipboard = async () => {
  if (!lastPatch.value) return
  await clipboard.copyWithFeedback(lastPatch.value, 'Diff')
}
```

3f. Add disabled styling to `<style scoped>` (after the `.diff-action-btn:hover` rule):

```css
.diff-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
```

- [ ] **Step 4: Implement — CompareText.vue**

4a. Replace the hardcoded props in the template:

```html
        <DiffRenderer
          :left-text="text1Content"
          :right-text="text2Content"
          :mode="diffViewMode"
          :ignore-whitespace="false"
          :ignore-case="false"
          :language="detectedLanguage"
          @mode-changed="diffViewMode = $event"
          class="enhanced-diff"
        />
```

with:

```html
        <DiffRenderer
          :left-text="text1Content"
          :right-text="text2Content"
          :mode="diffViewMode"
          :ignore-whitespace="diffOptions.ignoreWhitespace"
          :ignore-case="diffOptions.ignoreCase"
          :language="detectedLanguage"
          @mode-changed="diffViewMode = $event"
          @options-changed="diffOptions = $event"
          class="enhanced-diff"
        />
```

4b. In the script, replace the `shareOptions` block:

```ts
// Share state for URL/localStorage persistence
const shareOptions = ref<{ ignoreWhitespace: boolean; ignoreCase: boolean }>({
  ignoreWhitespace: false,
  ignoreCase: false
})
const shareState = useShareState(text1Content, text2Content, shareOptions, {
  autoSave: true,
  autoLoad: true
})
```

with:

```ts
// Diff comparison options — updated by DiffRenderer's options-changed event
// and persisted/shared through useShareState.
const diffOptions = ref<{ ignoreWhitespace: boolean; ignoreCase: boolean }>({
  ignoreWhitespace: false,
  ignoreCase: false
})
const shareState = useShareState(text1Content, text2Content, diffOptions, {
  autoSave: true,
  autoLoad: true
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line`
Expected: ALL PASS (including the rewritten toggle test).

- [ ] **Step 6: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/components/DiffRenderer.vue src/components/CompareText.vue tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts
git commit -m "fix: wire ignore-whitespace/case toggles for real; never export stale or folded patches

The toggles were hardcoded to false with their options-changed event
unheard. Whitespace uses jsdiff's native comparison-level option; Case
folds for comparison/display only. lastPatch is always generated from
the original texts and cleared when no differences exist.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Share lifecycle — no data loss, no silent outcomes (spec D2 + Clear-All flush from D7)

Bugs being fixed: autosave watcher registers before URL-restore (visited share links overwrite the visitor's saved state); the `#hash` is never cleaned so shared content resurrects on every reload; garbage/unknown-version hashes "migrate" into blank state; share over 8,000 chars silently no-ops; successful share is also silent; Clear All + fast reload resurrects cleared text (1s debounce race).

**Files:**
- Modify: `src/composables/useShareState.ts`
- Modify: `src/components/CompareText.vue` (`onShareClick`, `clearAll`)
- Test: `src/composables/__tests__/useShareState.spec.ts` (modify), `tests/e2e/correctness-fixes.spec.ts` (append)

**Interfaces:**
- Produces:
  - `export type ShareResult = { ok: true; url: string } | { ok: false; reason: 'empty' | 'too-large' | 'clipboard-failed'; size?: number }`
  - `copyShareUrl(): Promise<ShareResult>` (breaking change from `Promise<boolean>`)
  - `flushSave(): void` — cancels the pending debounce and saves immediately.
  - `generateShareUrl(): string` keeps its existing contract (`''` on overflow).
  - `migrateState` is **deleted**; unknown versions/malformed payloads are rejected.

- [ ] **Step 1: Update/write failing unit tests**

In `src/composables/__tests__/useShareState.spec.ts`:

1a. Replace the phantom-option test `'should load state from URL'` (it uses a nonexistent `granularity` option) with:

```ts
    it('should load state from URL', () => {
      const mockState = {
        leftText: 'url left',
        rightText: 'url right',
        options: { ignoreCase: true },
        timestamp: Date.now(),
        version: '1.0.0'
      }
      const mockCompressed = 'compressed_' + btoa(JSON.stringify(mockState))

      const shareState = useShareState(leftText, rightText, options, {
        autoLoad: false
      })

      const testUrl = `https://example.com/diff#${mockCompressed}`
      const result = shareState.loadFromUrl(testUrl)

      expect(result).toBe(true)
      expect(leftText.value).toBe('url left')
      expect(rightText.value).toBe('url right')
      expect(options.value.ignoreCase).toBe(true)
    })
```

1b. Replace `'should create state snapshot'` (also uses `granularity`) with:

```ts
    it('should create state snapshot', () => {
      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'left text'
      rightText.value = 'right text'
      options.value = { ignoreWhitespace: true }

      const state = shareState.createState()

      expect(state.leftText).toBe('left text')
      expect(state.rightText).toBe('right text')
      expect(state.options.ignoreWhitespace).toBe(true)
      expect(state.version).toBe('1.0.0')
      expect(typeof state.timestamp).toBe('number')
    })
```

1c. Replace `'should handle state version migration'` with strict-rejection tests:

```ts
    it('rejects version-less state instead of migrating it', () => {
      const shareState = useShareState(leftText, rightText, options)

      const oldState = {
        leftText: 'old left',
        rightText: 'old right',
        options: {},
        timestamp: Date.now()
        // No version field
      }

      const decompressed = shareState.decompressState(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shareState.compressState(oldState as any)
      )

      expect(decompressed).toBe(null)
    })

    it('rejects unknown-version state (would otherwise blank both panes)', () => {
      const shareState = useShareState(leftText, rightText, options, { autoLoad: false })
      const compressed = 'compressed_' + btoa(JSON.stringify({ version: '2.0.0' }))

      const result = shareState.loadFromUrl(`https://example.com/diff#${compressed}`)

      expect(result).toBe(false)
      expect(leftText.value).toBe('') // untouched
    })

    it('rejects payloads with non-string texts', () => {
      const shareState = useShareState(leftText, rightText, options, { autoLoad: false })
      const compressed = 'compressed_' + btoa(JSON.stringify({
        version: '1.0.0', leftText: 42, rightText: 'ok', options: {}, timestamp: 1
      }))

      expect(shareState.loadFromUrl(`https://example.com/diff#${compressed}`)).toBe(false)
    })
```

1d. Replace `'should copy share URL to clipboard'`'s two result assertions and the clipboard-error test to the new `ShareResult` shape — in the copy test change:

```ts
      const result = await shareState.copyShareUrl()

      expect(result).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalled()
```

to:

```ts
      const result = await shareState.copyShareUrl()

      expect(result.ok).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalled()
```

and in `'should handle clipboard errors'` change:

```ts
      const result = await shareState.copyShareUrl()

      expect(result).toBe(false)
```

to:

```ts
      const result = await shareState.copyShareUrl()

      expect(result).toEqual({ ok: false, reason: 'clipboard-failed' })
```

1e. Append these new tests inside the `'URL sharing'` describe block:

```ts
    it('copyShareUrl reports too-large with the measured size', async () => {
      const shareState = useShareState(leftText, rightText, options, {
        maxUrlLength: 50, autoLoad: false
      })
      leftText.value = 'a'.repeat(1000)
      rightText.value = 'b'.repeat(1000)

      const result = await shareState.copyShareUrl()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('too-large')
        expect(result.size).toBeGreaterThan(50)
      }
      expect(mockClipboard.writeText).not.toHaveBeenCalled()
    })

    it('copyShareUrl reports empty when there is nothing to share', async () => {
      const shareState = useShareState(leftText, rightText, options, { autoLoad: false })
      const result = await shareState.copyShareUrl()
      expect(result).toEqual({ ok: false, reason: 'empty' })
    })
```

1f. Append a new describe block after `'auto-save functionality'`:

```ts
  describe('restore lifecycle (data-loss protection)', () => {
    it('auto-load from URL strips the hash and does NOT autosave the restored state', async () => {
      const state = {
        leftText: 'shared L', rightText: 'shared R', options: {},
        timestamp: Date.now(), version: '1.0.0'
      }
      const compressed = 'compressed_' + btoa(JSON.stringify(state))
      mockLocation.href = `https://example.com/diff#${compressed}`
      mockLocation.hash = `#${compressed}`

      useShareState(leftText, rightText, options, { autoSave: true, autoLoad: true })

      expect(leftText.value).toBe('shared L')
      // hash cleaned immediately after restore
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', 'https://example.com/diff')
      // restoring must not overwrite the visitor's own saved state
      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('flushSave saves immediately, cancelling the debounce', () => {
      const shareState = useShareState(leftText, rightText, options, { autoSave: true })
      leftText.value = 'about to clear'
      shareState.flushSave()
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
    })
  })
```

- [ ] **Step 2: Run tests to verify the new/changed ones fail**

Run: `npm run test:run -- src/composables/__tests__/useShareState.spec.ts`
Expected: FAIL — migration tests now expect `null` but get migrated objects; `ShareResult` shape mismatches; `flushSave` not a function; hash not cleaned; autosave fires after restore.

- [ ] **Step 3: Implement `useShareState.ts`**

3a. Add the result type after the `ShareStateConfig` interface:

```ts
export type ShareResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'empty' | 'too-large' | 'clipboard-failed'; size?: number }
```

3b. Replace `decompressState`'s version block:

```ts
      const state = JSON.parse(json) as ShareableState

      // Version compatibility check
      if (!state.version || state.version !== CURRENT_VERSION) {
        console.warn('State version mismatch, attempting to migrate...')
        return migrateState(state)
      }

      return state
```

with:

```ts
      return validateState(JSON.parse(json))
```

3c. Delete the entire `migrateState` function and add `validateState` in its place:

```ts
  // Strict validation: unknown versions and malformed payloads are rejected
  // (a lenient "migration" here used to blank both panes on garbage input).
  const validateState = (value: unknown): ShareableState | null => {
    if (!value || typeof value !== 'object') return null
    const obj = value as Record<string, unknown>
    if (obj.version !== CURRENT_VERSION) return null
    if (typeof obj.leftText !== 'string' || typeof obj.rightText !== 'string') return null

    const rawOptions =
      obj.options && typeof obj.options === 'object'
        ? (obj.options as Record<string, unknown>)
        : {}
    const options: Partial<DiffShareOptions> = {}
    if (typeof rawOptions.ignoreWhitespace === 'boolean') options.ignoreWhitespace = rawOptions.ignoreWhitespace
    if (typeof rawOptions.ignoreCase === 'boolean') options.ignoreCase = rawOptions.ignoreCase

    return {
      leftText: obj.leftText,
      rightText: obj.rightText,
      options,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
      version: CURRENT_VERSION
    }
  }
```

3d. Extract a shared URL builder and rewrite `generateShareUrl`/`copyShareUrl` — replace both functions with:

```ts
  const buildShareUrl = (): { url: string; length: number; tooLarge: boolean } => {
    const state = createState()
    const compressed = compressState(state)
    const url = new URL(window.location.href)
    url.hash = compressed
    const str = url.toString()
    return { url: str, length: str.length, tooLarge: str.length > mergedConfig.maxUrlLength }
  }

  // Generate shareable URL ('' when over the length cap — legacy contract)
  const generateShareUrl = (): string => {
    try {
      const built = buildShareUrl()
      if (built.tooLarge) {
        console.warn('Share URL exceeds maximum length, consider using localStorage sharing instead')
        return ''
      }
      shareUrl.value = built.url
      return built.url
    } catch (error) {
      console.error('Failed to generate share URL:', error)
      return ''
    }
  }
```

and (replacing the old `copyShareUrl`):

```ts
  // Copy share URL to clipboard, reporting the outcome for UI feedback
  const copyShareUrl = async (): Promise<ShareResult> => {
    if (!leftText.value && !rightText.value) {
      return { ok: false, reason: 'empty' }
    }
    const built = buildShareUrl()
    if (built.tooLarge) {
      return { ok: false, reason: 'too-large', size: built.length }
    }
    shareUrl.value = built.url
    try {
      await navigator.clipboard.writeText(built.url)
      return { ok: true, url: built.url }
    } catch {
      return { ok: false, reason: 'clipboard-failed' }
    }
  }
```

3e. Fix the lifecycle ordering — replace this whole section (auto-save watcher registration, auto-load, `cleanupUrl` definition):

```ts
  // Watch for changes and auto-save
  if (mergedConfig.autoSave) {
    watch([leftText, rightText, options], debouncedSave, { deep: true })
  }

  // Auto-load on initialization
  if (mergedConfig.autoLoad) {
    // Try URL first, then localStorage
    if (!loadFromUrl()) {
      loadFromLocalStorage()
    }
  }

  // Clean up hash from URL after loading
  const cleanupUrl = () => {
    if (window.location.hash) {
      const url = new URL(window.location.href)
      url.hash = ''
      window.history.replaceState(null, '', url.toString())
    }
  }
```

with:

```ts
  // Clean up hash from URL after loading
  const cleanupUrl = () => {
    if (window.location.hash) {
      const url = new URL(window.location.href)
      url.hash = ''
      window.history.replaceState(null, '', url.toString())
    }
  }

  const flushSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    saveToLocalStorage()
  }

  // Auto-load BEFORE registering the autosave watcher: restoring shared or
  // stored content must never count as a user edit (it used to overwrite the
  // visitor's own saved state within 1s of opening a share link).
  if (mergedConfig.autoLoad) {
    if (loadFromUrl()) {
      // Strip #hash so a reload restores the user's own state, not the link's
      cleanupUrl()
    } else {
      loadFromLocalStorage()
    }
  }

  // Watch for changes and auto-save (registered after restore on purpose)
  if (mergedConfig.autoSave) {
    watch([leftText, rightText, options], debouncedSave, { deep: true })
  }
```

3f. Add `flushSave` to the returned object (after `clearLocalStorage,`):

```ts
    flushSave,
```

- [ ] **Step 4: Implement CompareText.vue feedback + flush**

4a. Replace `onShareClick`:

```ts
// Share handler
const onShareClick = async () => {
  await shareState.copyShareUrl()
}
```

with:

```ts
// Share handler — every outcome is visible to the user
const onShareClick = async () => {
  const result = await shareState.copyShareUrl()
  if (result.ok) {
    toast.add({ severity: 'success', summary: 'Link copied', detail: 'Share URL is on your clipboard.', life: 2500 })
  } else if (result.reason === 'too-large') {
    toast.add({
      severity: 'error',
      summary: 'Too large to share as a link',
      detail: `This comparison compresses to a ${result.size?.toLocaleString()}-character URL; links are capped at 8,000 characters. Use Export to download the diff instead.`,
      life: 6000
    })
  } else if (result.reason === 'clipboard-failed') {
    toast.add({ severity: 'error', summary: 'Copy failed', detail: 'Could not write to the clipboard.', life: 4000 })
  }
}
```

4b. In `clearAll`, after the two timer-clearing lines, add a flush so a reload within 1s cannot resurrect cleared text:

```ts
  if (text1Timer) clearTimeout(text1Timer)
  if (text2Timer) clearTimeout(text2Timer)

  // Persist the cleared state immediately — a reload inside the 1s autosave
  // debounce used to resurrect the cleared text.
  shareState.flushSave()
```

- [ ] **Step 5: Append e2e coverage**

Append to `tests/e2e/correctness-fixes.spec.ts`:

```ts
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

    // Open the link fresh
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
    const big = 'x'.repeat(30000) + '\n' + 'unique-'.repeat(4000)
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'))
    await page.locator('textarea').first().fill(big)
    await page.locator('textarea').nth(1).fill(big + 'diff')
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
```

- [ ] **Step 6: Run all tests**

Run: `npm run test:run -- src/composables/__tests__/useShareState.spec.ts`
Expected: PASS.
Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line`
Expected: PASS.

- [ ] **Step 7: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/composables/useShareState.ts src/composables/__tests__/useShareState.spec.ts src/components/CompareText.vue tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: share lifecycle — no data loss, strict validation, visible outcomes

Restore now runs before the autosave watcher registers and strips the
URL hash; unknown-version/malformed payloads are rejected instead of
'migrating' to blank state; share reports success/too-large/failure via
toasts; Clear All flushes the debounced save.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Keyboard shortcuts — real keys, safe combos, undoable clears (spec D5)

`Cmd+Shift+1/2` can never fire on real keyboards (`event.key` is `'!'`/`'@'` with Shift held); `Cmd+Shift+R` hijacks browser hard-reload to silently clear a pane; `Cmd+Shift+S/E/L` collide with browser UI. `Alt+ArrowUp/Down` is captured document-wide, stealing macOS word-navigation inside the textareas.

**New scheme:** copy left/right = `Mod+Shift+1/2` (matched via `event.code`), swap = `Mod+Shift+X`, load sample = `Mod+Shift+U`. Clear-left/right/all lose shortcuts entirely; all Clear buttons gain a 10s Undo toast.

**Files:**
- Modify: `src/components/CompareText.vue` (shortcut handler, clear functions, 5 tooltips)
- Modify: `src/components/DiffRenderer.vue` (Alt+Arrow focus guard)
- Test: `tests/e2e/correctness-fixes.spec.ts` (append)

**Interfaces:**
- Consumes: toast `action` from Task 2 (`toast.add({..., action: { label, handler }})`).

- [ ] **Step 1: Write the failing e2e tests**

Append to `tests/e2e/correctness-fixes.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify failures**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "D5"`
Expected: the copy test fails only on the toast assertion under Playwright (synthetic key would fire the old handler, but no toast exists yet), swap-on-X fails (not bound), Undo toast fails (no action), Alt+Arrow test may pass or fail flakily — implementation makes it deterministic.

- [ ] **Step 3: Implement CompareText.vue**

3a. Replace the whole `handleKeyboardShortcuts` function:

```ts
// Keyboard shortcuts. Matching uses event.code because with Shift held,
// event.key becomes '!'/'@' on most layouts — the old key-based matching
// could never fire. Destructive clears have no shortcuts by design:
// Mod+Shift+R is browser hard-reload; hijacking it to destroy text was hostile.
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return

  switch (event.code) {
    case 'Digit1':
      event.preventDefault()
      copyText1()
      break
    case 'Digit2':
      event.preventDefault()
      copyText2()
      break
    case 'KeyX':
      event.preventDefault()
      swapTexts()
      break
    case 'KeyU':
      event.preventDefault()
      loadSampleData()
      break
  }
}
```

3b. Replace `clearText1`, `clearText2`, and extend `clearAll` with undo toasts:

```ts
const clearText1 = () => {
  const previous = text1Content.value
  text1Content.value = ''
  text1Type.value = 'text'
  smartSuggestion1.value = null
  if (previous) {
    toast.add({
      severity: 'info',
      summary: 'Original text cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          text1Content.value = previous
          onText1Input()
        }
      }
    })
  }
}

const clearText2 = () => {
  const previous = text2Content.value
  text2Content.value = ''
  text2Type.value = 'text'
  smartSuggestion2.value = null
  if (previous) {
    toast.add({
      severity: 'info',
      summary: 'Changed text cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          text2Content.value = previous
          onText2Input()
        }
      }
    })
  }
}
```

and in `clearAll`, capture and offer both (replace the function body's first two lines and add the toast at the end, keeping the `flushSave` from Task 4 last):

```ts
const clearAll = () => {
  const previous1 = text1Content.value
  const previous2 = text2Content.value
  text1Content.value = ''
  text2Content.value = ''
  text1Type.value = 'text'
  text2Type.value = 'text'
  showDiff.value = false
  smartSuggestion1.value = null
  smartSuggestion2.value = null

  if (text1Timer) clearTimeout(text1Timer)
  if (text2Timer) clearTimeout(text2Timer)

  if (previous1 || previous2) {
    toast.add({
      severity: 'info',
      summary: 'Both panes cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          text1Content.value = previous1
          text2Content.value = previous2
          onText1Input()
          onText2Input()
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the 1s autosave
  // debounce used to resurrect the cleared text.
  shareState.flushSave()
}
```

3c. Update the five stale tooltips in the template:

- `v-tooltip="'Copy (Cmd+Shift+1)'"` → unchanged (still correct).
- `v-tooltip="'Clear (Cmd+Shift+R)'"` → `v-tooltip="'Clear'"`
- `v-tooltip="'Copy (Cmd+Shift+2)'"` → unchanged.
- `v-tooltip="'Clear (Cmd+Shift+E)'"` → `v-tooltip="'Clear'"`
- `v-tooltip="'Swap Sides (Cmd+Shift+S)'"` → `v-tooltip="'Swap Sides (Cmd+Shift+X)'"`
- `v-tooltip="'Load Sample (Cmd+Shift+L)'"` → `v-tooltip="'Load Sample (Cmd+Shift+U)'"`

- [ ] **Step 4: Implement DiffRenderer.vue focus guard**

Replace `handleKeydown`:

```ts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.altKey) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      navigation.nextChange()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      navigation.prevChange()
    }
  }
}
```

with:

```ts
// Alt+Arrow diff navigation must not fire while typing: on macOS,
// Option+Arrow is word-navigation inside inputs.
const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable === true)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!event.altKey || isEditableTarget(event.target)) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    navigation.nextChange()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    navigation.prevChange()
  }
}
```

- [ ] **Step 5: Also adopt `useClipboard` for the pane copy buttons** (they feed the Digit1/2 shortcuts and currently fail silently). In `CompareText.vue` script, add import:

```ts
import { useClipboard } from '@/composables/useClipboard'
```

after `const textProcessor = useTextProcessor()` add:

```ts
const clipboard = useClipboard()
```

and replace `copyText1`/`copyText2`:

```ts
const copyText1 = async () => {
  if (!text1Content.value.trim()) return
  await clipboard.copyWithFeedback(text1Content.value, 'Original text')
}

const copyText2 = async () => {
  if (!text2Content.value.trim()) return
  await clipboard.copyWithFeedback(text2Content.value, 'Changed text')
}
```

- [ ] **Step 6: Run tests**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line`
Expected: PASS.

- [ ] **Step 7: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/components/CompareText.vue src/components/DiffRenderer.vue tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: shortcuts use event.code on non-reserved combos; clears become undoable

Cmd+Shift+1/2 never fired on real keyboards (Shift turns the key into
'!'/'@'); Cmd+Shift+R hijacked hard-reload to destroy a pane. Swap moves
to Mod+Shift+X, sample to Mod+Shift+U, clears lose shortcuts and gain a
10s Undo toast. Alt+Arrow diff nav no longer steals word-navigation
inside inputs.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: One-sided compares (spec D7)

You currently cannot diff against an empty side — `hasBothInputs` requires both panes non-blank, so "everything added / everything removed" comparisons are impossible.

**Files:**
- Modify: `src/components/CompareText.vue` (compare gating)
- Test: `tests/e2e/correctness-fixes.spec.ts` (append)

- [ ] **Step 1: Failing e2e test** — append:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "One-sided"`
Expected: FAIL — Compare button stays disabled.

- [ ] **Step 3: Implement**

In `src/components/CompareText.vue`:

3a. Replace:

```ts
const hasBothInputs = computed(() => text1Content.value.trim().length > 0 && text2Content.value.trim().length > 0)
```

with:

```ts
// One populated side is enough: empty-vs-content is a legitimate
// "everything added / everything removed" diff. Whitespace-only counts too.
const hasAnyInput = computed(() => text1Content.value.length > 0 || text2Content.value.length > 0)
```

3b. In the template, replace the Compare button's disabled condition:

```html
        <button class="p-button compare-btn" :disabled="!text1Content.trim() || !text2Content.trim()" @click="onCompare">
```

with:

```html
        <button class="p-button compare-btn" :disabled="!hasAnyInput" @click="onCompare">
```

3c. Replace the results gate:

```html
      <div v-if="showDiff && hasBothInputs" class="comparison-results">
```

with:

```html
      <div v-if="showDiff && hasAnyInput" class="comparison-results">
```

(`DiffRenderer.computeDiff` already handles one-empty-side correctly — it only early-returns when **both** are empty.)

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line`
Expected: PASS (the pre-existing test `'should have the main comparison interface'` asserts the Compare button is visible, not enabled-state, so it still passes).

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/components/CompareText.vue tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: allow one-sided and whitespace-only comparisons

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Formatter — no silent success on broken JSON (spec D6)

`{"a":1,` + Beautify currently echoes the input back as a "successful" text format, because JSON detection requires the text to *end* with `}`/`]`, and the `text` fallback always succeeds. Page copy promises error highlighting.

**Files:**
- Modify: `src/composables/useTextProcessor.ts` (the `formatText` default branch)
- Test: `src/composables/__tests__/useTextProcessor.spec.ts` (create), `tests/e2e/correctness-fixes.spec.ts` (append)

- [ ] **Step 1: Failing unit tests**

Create `src/composables/__tests__/useTextProcessor.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { useTextProcessor } from '../useTextProcessor'

describe('useTextProcessor formatText', () => {
  it('surfaces a JSON syntax error for truncated JSON instead of echoing it', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('{"a":1,')

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.formatted).toBe(null)
  })

  it('surfaces a JSON error for array-like broken input', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('[1, 2,')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('still beautifies valid JSON', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('{"a":1}')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('{\n  "a": 1\n}')
  })

  it('still echoes genuine plain text unchanged', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('just a sentence, nothing else')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('just a sentence, nothing else')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/composables/__tests__/useTextProcessor.spec.ts`
Expected: FAIL — truncated-JSON tests get `success: true` (silent echo).

- [ ] **Step 3: Implement**

In `src/composables/useTextProcessor.ts`, replace the `default:` branch of the `switch` in `formatText`:

```ts
        default:
          result = { success: true, formatted: text, type: 'text', error: null }
```

with:

```ts
        default: {
          const trimmed = text.trim()
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // Looks like JSON that failed detection (e.g. truncated) — surface
            // the real parse error instead of silently echoing the input back.
            result = formatJSON(text)
          } else {
            result = { success: true, formatted: text, type: 'text', error: null }
          }
          break
        }
```

- [ ] **Step 4: Append the e2e test**

```ts
test.describe('Formatter honest errors (D6)', () => {
  test('Beautify on truncated JSON shows the parse error, not silent success', async ({ page, devyantra }) => {
    await devyantra.navigateToTool('format-text')
    await page.locator('textarea').first().fill('{"a":1,')
    await page.locator('button', { hasText: 'Beautify' }).first().click()
    await expect(page.locator('.p-message-error .p-message-text')).toBeVisible()
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npm run test:run -- src/composables/__tests__/useTextProcessor.spec.ts` → PASS.
Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "D6"` → PASS.

- [ ] **Step 6: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/composables/useTextProcessor.ts src/composables/__tests__/useTextProcessor.spec.ts tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: formatter surfaces JSON parse errors instead of silently echoing broken input

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Timestamp zero + Base64 stale output (spec D7)

Epoch `0` renders nothing (falsy guard on a `type="number"` v-model, which yields the number `0`); Base64 keeps the previous successful output on screen next to a new error, and logs the raw `atob` exception.

**Files:**
- Modify: `src/components/TimestampTools.vue` (line ~231)
- Modify: `src/components/Base64Tools.vue` (decode/encode catch blocks)
- Test: `tests/e2e/correctness-fixes.spec.ts` (append)

- [ ] **Step 1: Failing e2e tests** — append:

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "Timestamp zero"`
Expected: both FAIL (no result items for 0; stale "hello" output remains).

- [ ] **Step 3: Implement**

3a. `src/components/TimestampTools.vue` — replace the guard and parse in `convertTimestamp`:

```ts
const convertTimestamp = () => {
  if (!inputTimestamp.value) {
```

with:

```ts
const convertTimestamp = () => {
  // v-model on a type="number" input yields a number — 0 is a valid epoch,
  // so only empty/null counts as "no input".
  if (inputTimestamp.value === '' || inputTimestamp.value === null || inputTimestamp.value === undefined) {
```

and two lines below, replace:

```ts
    const ts = parseInt(inputTimestamp.value)
```

with:

```ts
    const ts = Number(inputTimestamp.value)
```

3b. `src/components/Base64Tools.vue` — in `decode`'s catch block, replace:

```ts
  } catch (error) {
    console.error('Decoding error:', error)
    errorMessage.value = 'Invalid Base64 string'
  }
```

with:

```ts
  } catch {
    outputText.value = ''
    errorMessage.value = 'Invalid Base64 string'
  }
```

and in `encode`'s catch block, replace:

```ts
  } catch (error) {
    console.error('Encoding error:', error)
    errorMessage.value = 'Failed to encode text'
  }
```

with:

```ts
  } catch {
    outputText.value = ''
    errorMessage.value = 'Failed to encode text'
  }
```

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line`
Expected: PASS.

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/components/TimestampTools.vue src/components/Base64Tools.vue tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: epoch 0 converts correctly; base64 errors clear stale output

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Upload validation — extensionless files, UTF-16, empty files (spec D7)

`Makefile` is rejected as "File type .makefile is not supported" (the whole name is treated as an extension); UTF-16 text decodes as NUL-laden garbage and is rejected as "binary"; empty files pass a `NaN` check with no feedback.

**Files:**
- Modify: `src/components/CompareText.vue` (`isFileAllowed`, `isBinaryContent`, `loadFile`)
- Test: `tests/e2e/correctness-fixes.spec.ts` (append)

- [ ] **Step 1: Failing e2e tests** — append (file-creation uses Node in the test process):

```ts
import path from 'path'
import fs from 'fs'
import os from 'os'
```

(add these imports at the top of `correctness-fixes.spec.ts` if not already present), then:

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "Upload validation"`
Expected: Makefile rejected toast; UTF-16 "Binary File" toast; empty silent — all three FAIL.

- [ ] **Step 3: Implement in `CompareText.vue`**

3a. Replace the extension check inside `isFileAllowed`:

```ts
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not supported. Use text-based files only.`
  }
```

with:

```ts
  // Only enforce the allowlist when the file actually has an extension.
  // "Makefile" has none; ".gitignore" is a dotfile, not a ".gitignore" type.
  const base = file.name.replace(/^\.+/, '')
  const ext = base.includes('.') ? base.split('.').pop()!.toLowerCase() : null
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not supported. Use text-based files only.`
  }
```

3b. Guard `isBinaryContent` against empty input — replace its last line:

```ts
  return nonPrintable / sample.length > 0.1
```

with:

```ts
  if (sample.length === 0) return false
  return nonPrintable / sample.length > 0.1
```

3c. Replace the body of `loadFile`'s `try` block (currently `const text = await file.text()` …) with BOM-aware decoding and an empty-file path:

```ts
  try {
    if (file.size === 0) {
      toast.add({ severity: 'info', summary: 'Empty file', detail: `"${file.name}" has no content.`, life: 4000 })
      if (side === 'left') {
        text1Content.value = ''
        onText1Input()
      } else {
        text2Content.value = ''
        onText2Input()
      }
      return
    }

    // Decode with BOM awareness — file.text() assumes UTF-8 and turns
    // UTF-16 files into NUL-laden strings that trip the binary sniff.
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let text: string
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      text = new TextDecoder('utf-16le').decode(buffer)
    } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      text = new TextDecoder('utf-16be').decode(buffer)
    } else {
      text = new TextDecoder().decode(buffer)
    }

    if (isBinaryContent(text)) {
      toast.add({
        severity: 'error',
        summary: 'Binary File',
        detail: 'This appears to be a binary file. Only text files are supported.',
        life: 5000
      })
      return
    }

    if (side === 'left') {
      text1Content.value = text
      onText1Input()
    } else {
      text2Content.value = text
      onText2Input()
    }

  } catch {
```

(keep the existing `catch` block unchanged).

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line`
Expected: PASS — including the pre-existing upload tests (6MB rejection, PNG-renamed sniff).

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/components/CompareText.vue tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: upload accepts extensionless/dotfiles and UTF-16 text; empty files get feedback

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Router guard modernization (spec D7)

The guard uses the deprecated `next()` callback, warning twice on every navigation.

**Files:**
- Modify: `src/router/index.ts` (line ~181 and ~229)
- Test: `tests/e2e/correctness-fixes.spec.ts` (append)

- [ ] **Step 1: Failing e2e test** — append:

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line --grep "Router guard"`
Expected: FAIL — deprecation warnings collected.

- [ ] **Step 3: Implement**

In `src/router/index.ts`, change the guard signature and remove the callback — replace:

```ts
router.beforeEach((to, from, next) => {
```

with:

```ts
router.beforeEach((to) => {
```

and delete the final line of the guard body:

```ts
  next()
```

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/e2e/correctness-fixes.spec.ts --project=chromium --reporter=line`
Expected: PASS.

- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/router/index.ts tests/e2e/correctness-fixes.spec.ts
git commit -m "fix: drop deprecated next() callback from router guard

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Dead code and stale-asset cleanup (spec D8)

**Files:**
- Delete: `src/components/DiffView.vue`, `src/components/__tests__/DiffView.spec.ts`, `src/components/TheWelcome.vue`, `src/components/WelcomeItem.vue`, `src/components/icons/` (all 5 files)
- Modify: `src/views/HomeView.vue` (line ~68), `src/composables/useSEO.ts` (line ~61), `src/config/seo.ts` (lines ~48, ~267, ~272), `public/site.webmanifest`

- [ ] **Step 1: Verify the deletions are safe**

```bash
grep -rn "DiffView\|TheWelcome\|WelcomeItem\|components/icons" src --include="*.vue" --include="*.ts" | grep -v "__tests__/DiffView.spec"
```

Expected output: only self-references from the files being deleted (their own `<script>` internals). If any OTHER file imports them, STOP and report.

- [ ] **Step 2: Delete**

```bash
git rm src/components/DiffView.vue src/components/__tests__/DiffView.spec.ts src/components/TheWelcome.vue src/components/WelcomeItem.vue
git rm -r src/components/icons
```

- [ ] **Step 3: Fix missing-asset references and stale branding**

3a. `src/views/HomeView.vue` — replace:

```ts
      twitterImage: `${window.location.origin}/twitter-image.png`
```

with:

```ts
      twitterImage: `${window.location.origin}/og-image.png`
```

3b. `src/composables/useSEO.ts` — replace:

```ts
      url: `${window.location.origin}/logo.png`
```

with:

```ts
      url: `${window.location.origin}/og-image.png`
```

3c. `src/config/seo.ts` — replace:

```ts
    logo: 'https://devyantra.app/logo.png',
```

with:

```ts
    logo: 'https://devyantra.app/og-image.png',
```

and replace:

```ts
    'theme-color': '#3b82f6',
```

with:

```ts
    'theme-color': '#F5F0E8',
```

and replace:

```ts
    'msapplication-TileColor': '#3b82f6',
```

with:

```ts
    'msapplication-TileColor': '#8B4513',
```

3d. `public/site.webmanifest` — replace:

```json
  "background_color": "#fafbff",
  "theme_color": "#3b82f6",
```

with:

```json
  "background_color": "#F5F0E8",
  "theme_color": "#F5F0E8",
```

- [ ] **Step 4: Verify**

```bash
npm run type-check && npm run lint && npm run test:run && npm run build
grep -rn "logo.png\|twitter-image.png\|3b82f6" src public index.html || echo "CLEAN"
```

Expected: gates green (unit test count drops by 23 — the dead DiffView suite), final line prints `CLEAN`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete dead DiffView/scaffolding; fix missing-asset refs and stale blue branding

DiffView.vue (747 lines, unshipped) and its 23-test suite tested dead
code; TheWelcome/WelcomeItem/icons were Vue starter leftovers.
twitter-image.png/logo.png never existed; theme colors still claimed the
pre-rebrand blue.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Full verification sweep + docs truth pass

**Files:**
- Modify: `README.md` (Extras bullet), `CHANGELOG.md` (new Unreleased section)

- [ ] **Step 1: Run everything**

```bash
npm run type-check && npm run lint && npm run test:run
npx playwright test --project=chromium --reporter=line
npm run build
```

Expected: all green. If any pre-existing test now fails, fix forward only if the failure is caused by this plan's changes; otherwise report it.

- [ ] **Step 2: Make the docs tell the truth**

2a. `README.md` — replace the Extras bullet:

```markdown
- **Keyboard shortcuts** throughout the app
```

with:

```markdown
- **Keyboard shortcuts** — ⌘K command palette; in Text Compare: ⌘⇧1/⌘⇧2 copy panes, ⌘⇧X swap, ⌘⇧U sample, Alt+↑/↓ jump between changes
```

2b. `CHANGELOG.md` — add at the top (below the header line, above the latest release section):

```markdown
## [Unreleased]

### Fixed

- Text Compare: "Ignore Whitespace" and "Ignore Case" toggles now actually affect the diff (they were wired to nothing)
- Text Compare: opening a share link no longer overwrites your autosaved work, and the URL hash is cleaned after restore
- Text Compare: Share reports success and failure (including the 8,000-character URL cap) instead of doing nothing silently
- Text Compare: Copy/Export are disabled when no differences are shown (previously exported a stale patch) and always contain the original, unmodified text
- Text Compare: exports/copies now confirm via toast everywhere; clipboard failures are reported
- Text Compare: keyboard shortcuts fire on real keyboards (event.code matching); destructive clear shortcuts removed (⌘⇧R was browser hard-reload), Swap is ⌘⇧X, Sample is ⌘⇧U; all Clear actions are undoable for 10 seconds
- Text Compare: Alt+Arrow diff navigation no longer hijacks word-navigation while typing
- Text Compare: one-sided comparisons allowed (empty vs content = everything added/removed)
- Text Compare: extensionless files (Makefile), dotfiles, and UTF-16 text files upload correctly; empty files give feedback
- Code Formatter: truncated JSON shows the real parse error instead of silently echoing the input
- Timestamp Converter: epoch `0` converts correctly
- Base64: decode errors clear the previous output instead of showing both
- Removed deprecated router `next()` callback (console warnings on every navigation)

### Removed

- Dead code: unshipped `DiffView.vue` and its test suite, Vue starter scaffolding (`TheWelcome`, `WelcomeItem`, icon set)
- References to never-existing assets (`twitter-image.png`, `logo.png`) and stale pre-rebrand blue theme colors
```

- [ ] **Step 3: Final commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: truthful shortcuts list; changelog for correctness fix pack

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Plan Self-Review (completed)

- **Spec coverage:** D1→Task 3; D2→Task 4; D3→Tasks 1, 3, 5; D4→Task 3; D5→Tasks 2, 5; D6→Task 7; D7→Tasks 4 (flush), 6, 8, 9, 10; D8→Task 11; testing policy→every task. No gaps.
- **Deferred by design (per spec):** EOL normalization, context-fidelity of exports, worker/virtualization, grapheme highlighting, hunk dividers.
- **Type consistency check:** `copyWithFeedback(text, label?)` used identically in Tasks 3/5; `ShareResult` union consumed with the same discriminants in Task 4's component code and tests; `diffOptions` name consistent between Tasks 3 and 4; toast `action` shape identical in Tasks 2 and 5.
- **Known interaction:** Task 5's `clearAll` replacement already includes Task 4's `flushSave()` call — executors of Task 5 must preserve it (shown in the code block).
