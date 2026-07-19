# Diff Core Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the patch-string→diff2html→v-html pipeline with a structured, worker-computed, virtualized diff core that makes invisible differences visible and exports truthful.

**Architecture:** Pure functions in `src/lib/diff/` (worker-safe, no Vue) build a `DiffModel`; a dedicated Worker computes it with supersede-cancellation and a synchronous fallback; Vue components render the model directly (no `v-html`); navigation, stats, and export all read the same model. `diff2html` is removed.

**Tech Stack:** Vue 3.5 Composition API, TypeScript, `diff@9` (jsdiff: `diffLines`, `diffArrays`, `createTwoFilesPatch`), `Intl.Segmenter`, Vitest 4 (jsdom), Playwright chromium.

**Spec:** `docs/superpowers/specs/2026-07-19-diff-core-rework-design.md`

**Code normativity note:** Type definitions, function signatures, file paths, and TEST files in this plan are normative — implement them verbatim. Implementation bodies shown are strong drafts: if a body fails its task's tests, fix the implementation (never weaken a test) and document the deviation in your report.

## Global Constraints

- Branch `feat/diff-core-rework` in `/Users/shaurya/devyantra-ui`. Node `^20.19.0 || >=22.12.0` (`source ~/.nvm/nvm.sh && nvm use` if needed).
- **No new npm dependencies.** `diff2html` is REMOVED in Task 12; until then it stays for the untouched legacy path.
- Gates after every task: `npm run type-check && npm run lint && npm run test:run`.
- E2E chromium-only: `npx playwright test <files> --project=chromium --reporter=line` (Playwright auto-starts the dev server).
- TDD per task: failing test first, then implementation.
- Spec invariants: exports ALWAYS from original unnormalized/unfolded text; ignore options fold compare/display only (carried from fix pack); no `v-html` anywhere in the new render path; `truncated`/limits never silently drop content.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: `normalize.ts` — EOL/BOM normalization + indicators (spec D3)

**Files:**
- Create: `src/lib/diff/normalize.ts`
- Test: `src/lib/diff/__tests__/normalize.spec.ts`

**Interfaces (Produces — later tasks import these exactly):**

```ts
export type IndicatorKind =
  | 'eol-differs'
  | 'no-trailing-newline-left'
  | 'no-trailing-newline-right'
  | 'bom-left'
  | 'bom-right'
export interface Indicator { kind: IndicatorKind; detail: string }
export type EolStyle = 'lf' | 'crlf' | 'cr' | 'mixed' | 'none'
export interface NormalizeResult {
  left: string
  right: string
  indicators: Indicator[]
}
export function detectEol(text: string): EolStyle
export function normalizePair(left: string, right: string): NormalizeResult
```

- [ ] **Step 1: Write the failing tests** — create `src/lib/diff/__tests__/normalize.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { detectEol, normalizePair } from '../normalize'

describe('detectEol', () => {
  it.each([
    ['a\nb\n', 'lf'],
    ['a\r\nb\r\n', 'crlf'],
    ['a\rb\r', 'cr'],
    ['a\r\nb\n', 'mixed'],
    ['single line', 'none'],
    ['', 'none']
  ])('detects %j as %s', (text, expected) => {
    expect(detectEol(text)).toBe(expected)
  })
})

describe('normalizePair', () => {
  it('normalizes CRLF and lone CR to LF', () => {
    const r = normalizePair('a\r\nb\r\nc', 'a\nb\nc')
    expect(r.left).toBe('a\nb\nc')
    expect(r.right).toBe('a\nb\nc')
  })

  it('emits eol-differs with named styles when sides disagree', () => {
    const r = normalizePair('a\r\nb', 'a\nb')
    const eol = r.indicators.find(i => i.kind === 'eol-differs')
    expect(eol).toBeDefined()
    expect(eol!.detail).toBe('Line endings differ: left CRLF, right LF')
  })

  it('emits no eol indicator when styles match or either side has none', () => {
    expect(normalizePair('a\r\nb', 'c\r\nd').indicators).toEqual([])
    expect(normalizePair('one line', 'a\nb').indicators).toEqual([])
  })

  it('audit repro: CR-only file no longer corrupts — normalizes to 3 clean lines', () => {
    const r = normalizePair('one\rtwo\rthree', 'one\ntwo\nthree')
    expect(r.left).toBe('one\ntwo\nthree')
    expect(r.left.split('\n')).toHaveLength(3)
  })

  it('strips UTF-8 BOM and reports the side', () => {
    const r = normalizePair('﻿hello', 'hello')
    expect(r.left).toBe('hello')
    expect(r.indicators).toContainEqual({ kind: 'bom-left', detail: 'Byte-order mark present in left input' })
    expect(r.indicators.find(i => i.kind === 'bom-right')).toBeUndefined()
  })

  it('reports missing trailing newline per side only when the other side has one', () => {
    const r = normalizePair('a\nb', 'a\nb\n')
    expect(r.indicators).toContainEqual({
      kind: 'no-trailing-newline-left',
      detail: 'No newline at end of left input'
    })
    // identical trailing state → no indicator
    expect(normalizePair('a\nb', 'c\nb').indicators).toEqual([])
  })

  it('mixed endings are named in the indicator', () => {
    const r = normalizePair('a\r\nb\nc', 'a\nb\nc\n')
    const eol = r.indicators.find(i => i.kind === 'eol-differs')
    expect(eol!.detail).toBe('Line endings differ: left mixed, right LF')
  })
})
```

- [ ] **Step 2:** `npm run test:run -- src/lib/diff/__tests__/normalize.spec.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/diff/normalize.ts`:

```ts
export type IndicatorKind =
  | 'eol-differs'
  | 'no-trailing-newline-left'
  | 'no-trailing-newline-right'
  | 'bom-left'
  | 'bom-right'
export interface Indicator { kind: IndicatorKind; detail: string }
export type EolStyle = 'lf' | 'crlf' | 'cr' | 'mixed' | 'none'
export interface NormalizeResult { left: string; right: string; indicators: Indicator[] }

const EOL_NAMES: Record<EolStyle, string> = {
  lf: 'LF', crlf: 'CRLF', cr: 'CR', mixed: 'mixed', none: 'none'
}

export function detectEol(text: string): EolStyle {
  const crlf = (text.match(/\r\n/g) || []).length
  const loneCr = (text.match(/\r(?!\n)/g) || []).length
  const loneLf = (text.match(/(?<!\r)\n/g) || []).length
  const kinds = [crlf > 0, loneCr > 0, loneLf > 0].filter(Boolean).length
  if (kinds === 0) return 'none'
  if (kinds > 1) return 'mixed'
  if (crlf > 0) return 'crlf'
  if (loneCr > 0) return 'cr'
  return 'lf'
}

const stripBom = (text: string): { text: string; hadBom: boolean } =>
  text.startsWith('﻿') ? { text: text.slice(1), hadBom: true } : { text, hadBom: false }

const toLf = (text: string): string => text.replace(/\r\n?/g, '\n')

export function normalizePair(left: string, right: string): NormalizeResult {
  const indicators: Indicator[] = []
  const l = stripBom(left)
  const r = stripBom(right)
  if (l.hadBom) indicators.push({ kind: 'bom-left', detail: 'Byte-order mark present in left input' })
  if (r.hadBom) indicators.push({ kind: 'bom-right', detail: 'Byte-order mark present in right input' })

  const leftEol = detectEol(l.text)
  const rightEol = detectEol(r.text)
  if (leftEol !== rightEol && leftEol !== 'none' && rightEol !== 'none') {
    indicators.push({
      kind: 'eol-differs',
      detail: `Line endings differ: left ${EOL_NAMES[leftEol]}, right ${EOL_NAMES[rightEol]}`
    })
  }

  const leftNorm = toLf(l.text)
  const rightNorm = toLf(r.text)
  const leftTrail = leftNorm.endsWith('\n')
  const rightTrail = rightNorm.endsWith('\n')
  if (leftTrail !== rightTrail) {
    if (!leftTrail) indicators.push({ kind: 'no-trailing-newline-left', detail: 'No newline at end of left input' })
    if (!rightTrail) indicators.push({ kind: 'no-trailing-newline-right', detail: 'No newline at end of right input' })
  }

  return { left: leftNorm, right: rightNorm, indicators }
}
```

- [ ] **Step 4:** rerun the spec → PASS.
- [ ] **Step 5: Gates + commit**

```bash
npm run type-check && npm run lint && npm run test:run
git add src/lib/diff
git commit -m "feat(diff-core): normalization layer with EOL/BOM/trailing-newline indicators

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `model.ts` — DiffModel + buildDiffModel + toSplitRows (spec D1, D8)

**Files:**
- Create: `src/lib/diff/model.ts`
- Test: `src/lib/diff/__tests__/model.spec.ts`

**Interfaces (Produces):**

```ts
import type { Indicator } from './normalize'

export type Segment = { text: string; changed: boolean }
export type DiffRow =
  | { kind: 'context'; leftNo: number; rightNo: number; text: string }
  | { kind: 'removed'; leftNo: number; text: string; segments?: Segment[] }
  | { kind: 'added'; rightNo: number; text: string; segments?: Segment[] }
  | { kind: 'gap'; hiddenCount: number }
export interface DiffStats { added: number; removed: number; modified: number }
export interface DiffModel {
  rows: DiffRow[]
  stats: DiffStats
  indicators: Indicator[]
  truncated: boolean
}
// runs come from jsdiff diffLines(left, right): { value, count?, added?, removed? }
export interface ChangeRun { value: string; count?: number; added?: boolean; removed?: boolean }
export function buildDiffModel(runs: ChangeRun[], context: number, indicators?: Indicator[]): DiffModel
// split-view pairing for the renderer: context pairs with itself; removed/added runs pair index-wise
export type SplitCell = { row: DiffRow; } | null   // null = placeholder cell
export type SplitRow = { left: SplitCell; right: SplitCell }
export function toSplitRows(rows: DiffRow[]): SplitRow[]
```

Algorithm for `buildDiffModel` (normative):
1. Split each run's `value` into lines (`value.split('\n')`; drop a final `''` element when the value ends with `\n`). Walk runs maintaining `leftNo`/`rightNo` (1-based). Context lines advance both; removed advance left; added advance right. Produce a flat `all: DiffRow[]` with NO gaps yet.
2. Stats: walk `all`; a maximal removed-run immediately followed by an added-run contributes `min(r,a)` to `modified`, `r-min` to `removed`, `a-min` to `added`; lone runs count fully.
3. Context filtering: if `context === Infinity`, `rows = all`. Otherwise mark every non-context row and every context row within `context` rows of a non-context row as kept; replace each maximal dropped stretch with `{ kind: 'gap', hiddenCount }`. A gap never appears when nothing is hidden; leading/trailing stretches also become gaps.
4. `truncated` is always `false` here (set by the caller in Task 4's entry point when limits trip).

- [ ] **Step 1: Write the failing tests** — create `src/lib/diff/__tests__/model.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { diffLines } from 'diff'
import { buildDiffModel, toSplitRows, type DiffRow } from '../model'

const model = (l: string, r: string, ctx: number) => buildDiffModel(diffLines(l, r), ctx)

const kinds = (rows: DiffRow[]) => rows.map(r => r.kind)

describe('buildDiffModel', () => {
  it('builds context/removed/added rows with correct 1-based line numbers', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\n', Infinity)
    expect(kinds(m.rows)).toEqual(['context', 'removed', 'added', 'context'])
    expect(m.rows[0]).toEqual({ kind: 'context', leftNo: 1, rightNo: 1, text: 'a' })
    expect(m.rows[1]).toMatchObject({ kind: 'removed', leftNo: 2, text: 'b' })
    expect(m.rows[2]).toMatchObject({ kind: 'added', rightNo: 2, text: 'X' })
    expect(m.rows[3]).toEqual({ kind: 'context', leftNo: 3, rightNo: 3, text: 'c' })
  })

  it('counts paired removed+added as modified in stats', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\nd\n', Infinity)
    expect(m.stats).toEqual({ added: 1, removed: 0, modified: 1 })
  })

  it('audit repro №9: SQL -- / ++ content lines stay ONE coherent model at context 0', () => {
    const left = 'SELECT 1;\n-- old comment\nl3\nl4\nl5\nEND;\n'
    const right = 'SELECT 1;\n++ new note\nl3\nl4\nl5\nFINISH;\n'
    const m = model(left, right, 0)
    // both changes present, nothing dropped, no phantom file split possible (no reparse)
    const removed = m.rows.filter(r => r.kind === 'removed').map(r => (r as { text: string }).text)
    const added = m.rows.filter(r => r.kind === 'added').map(r => (r as { text: string }).text)
    expect(removed).toEqual(['-- old comment', 'END;'])
    expect(added).toEqual(['++ new note', 'FINISH;'])
    expect(m.stats.modified).toBe(2)
  })

  it('audit repro №17: literal "\\ No newline at end of file" as CONTENT survives', () => {
    const marker = '\\ No newline at end of file'
    const m = model(`${marker}\nsame\n`, `CHANGED\nsame\n`, Infinity)
    expect(m.rows[0]).toMatchObject({ kind: 'removed', text: marker })
  })

  it('pure insertion and pure deletion are both represented (№8 basis)', () => {
    const ins = model('a\nb\n', 'a\nb\nc\nd\n', Infinity)
    expect(kinds(ins.rows)).toEqual(['context', 'context', 'added', 'added'])
    const del = model('a\nb\nc\n', 'a\n', Infinity)
    expect(kinds(del.rows)).toEqual(['context', 'removed', 'removed'])
  })

  it('context filtering inserts gap rows with exact hidden counts', () => {
    const left = Array.from({ length: 21 }, (_, i) => `l${i + 1}`).join('\n') + '\n'
    const right = left.replace('l11', 'CHANGED')
    const m = model(left, right, 3)
    expect(kinds(m.rows)).toEqual([
      'gap', 'context', 'context', 'context', 'removed', 'added', 'context', 'context', 'context', 'gap'
    ])
    expect(m.rows[0]).toEqual({ kind: 'gap', hiddenCount: 7 })
    expect(m.rows[9]).toEqual({ kind: 'gap', hiddenCount: 7 })
    // line numbers still correct after the gap
    expect(m.rows[1]).toMatchObject({ leftNo: 8, rightNo: 8 })
  })

  it('context 0 keeps only changed rows and gaps', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\n', 0)
    expect(kinds(m.rows)).toEqual(['gap', 'removed', 'added', 'gap'])
  })

  it('no gap rows when nothing is hidden', () => {
    const m = model('a\nb\n', 'a\nX\n', 3)
    expect(kinds(m.rows)).toEqual(['context', 'removed', 'added'])
  })

  it('identical inputs produce zero-change stats and only context rows', () => {
    const m = model('a\nb\n', 'a\nb\n', 3)
    expect(m.stats).toEqual({ added: 0, removed: 0, modified: 0 })
    expect(m.rows.every(r => r.kind === 'context')).toBe(true)
  })
})

describe('toSplitRows', () => {
  it('pairs removed/added runs index-wise with placeholders for the excess', () => {
    const m = model('a\nb\nc\n', 'a\nX\nY\nc\n', Infinity)
    // removed: [b]; added: [X, Y]
    const split = toSplitRows(m.rows)
    expect(split).toHaveLength(4)
    expect(split[1]!.left!.row).toMatchObject({ kind: 'removed', text: 'b' })
    expect(split[1]!.right!.row).toMatchObject({ kind: 'added', text: 'X' })
    expect(split[2]!.left).toBeNull()
    expect(split[2]!.right!.row).toMatchObject({ kind: 'added', text: 'Y' })
  })

  it('gap rows span both sides', () => {
    const m = model('a\nb\nc\nd\ne\nf\ng\nh\ni\n', 'a\nb\nc\nd\nX\nf\ng\nh\ni\n', 1)
    const split = toSplitRows(m.rows)
    expect(split[0]!.left!.row.kind).toBe('gap')
    expect(split[0]!.right!.row.kind).toBe('gap')
  })
})
```

- [ ] **Step 2:** run → FAIL. 
- [ ] **Step 3: Implement** `src/lib/diff/model.ts` per the interfaces + algorithm above. Draft:

```ts
import type { Indicator } from './normalize'

export type Segment = { text: string; changed: boolean }
export type DiffRow =
  | { kind: 'context'; leftNo: number; rightNo: number; text: string }
  | { kind: 'removed'; leftNo: number; text: string; segments?: Segment[] }
  | { kind: 'added'; rightNo: number; text: string; segments?: Segment[] }
  | { kind: 'gap'; hiddenCount: number }
export interface DiffStats { added: number; removed: number; modified: number }
export interface DiffModel { rows: DiffRow[]; stats: DiffStats; indicators: Indicator[]; truncated: boolean }
export interface ChangeRun { value: string; count?: number; added?: boolean; removed?: boolean }
export type SplitCell = { row: DiffRow } | null
export type SplitRow = { left: SplitCell; right: SplitCell }

const runLines = (value: string): string[] => {
  const lines = value.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

export function buildDiffModel(runs: ChangeRun[], context: number, indicators: Indicator[] = []): DiffModel {
  const all: DiffRow[] = []
  let leftNo = 1
  let rightNo = 1
  for (const run of runs) {
    const lines = runLines(run.value)
    if (run.removed) {
      for (const text of lines) all.push({ kind: 'removed', leftNo: leftNo++, text })
    } else if (run.added) {
      for (const text of lines) all.push({ kind: 'added', rightNo: rightNo++, text })
    } else {
      for (const text of lines) all.push({ kind: 'context', leftNo: leftNo++, rightNo: rightNo++, text })
    }
  }

  const stats: DiffStats = { added: 0, removed: 0, modified: 0 }
  let i = 0
  while (i < all.length) {
    const row = all[i]!
    if (row.kind === 'removed') {
      let r = 0
      while (i + r < all.length && all[i + r]!.kind === 'removed') r++
      let a = 0
      while (i + r + a < all.length && all[i + r + a]!.kind === 'added') a++
      const paired = Math.min(r, a)
      stats.modified += paired
      stats.removed += r - paired
      stats.added += a - paired
      i += r + a
    } else if (row.kind === 'added') {
      stats.added += 1
      i++
    } else {
      i++
    }
  }

  let rows: DiffRow[]
  if (context === Infinity) {
    rows = all
  } else {
    const keep = new Array<boolean>(all.length).fill(false)
    for (let j = 0; j < all.length; j++) {
      if (all[j]!.kind === 'removed' || all[j]!.kind === 'added') {
        for (let k = Math.max(0, j - context); k <= Math.min(all.length - 1, j + context); k++) keep[k] = true
      }
    }
    rows = []
    let hidden = 0
    for (let j = 0; j < all.length; j++) {
      if (keep[j]) {
        if (hidden > 0) { rows.push({ kind: 'gap', hiddenCount: hidden }); hidden = 0 }
        rows.push(all[j]!)
      } else {
        hidden++
      }
    }
    if (hidden > 0) rows.push({ kind: 'gap', hiddenCount: hidden })
  }

  return { rows, stats, indicators, truncated: false }
}

export function toSplitRows(rows: DiffRow[]): SplitRow[] {
  const out: SplitRow[] = []
  let i = 0
  while (i < rows.length) {
    const row = rows[i]!
    if (row.kind === 'context' || row.kind === 'gap') {
      out.push({ left: { row }, right: { row } })
      i++
      continue
    }
    let r = 0
    while (i + r < rows.length && rows[i + r]!.kind === 'removed') r++
    let a = 0
    while (i + r + a < rows.length && rows[i + r + a]!.kind === 'added') a++
    const span = Math.max(r, a)
    for (let k = 0; k < span; k++) {
      out.push({
        left: k < r ? { row: rows[i + k]! } : null,
        right: k < a ? { row: rows[i + r + k]! } : null
      })
    }
    i += r + a
  }
  return out
}
```

- [ ] **Step 4:** run → PASS. **Step 5: Gates + commit** (`feat(diff-core): structured DiffModel with gap rows, stats, and split pairing`).

---

### Task 3: `refine.ts` — grapheme-safe intra-line segments (spec D4)

**Files:**
- Create: `src/lib/diff/refine.ts`
- Test: `src/lib/diff/__tests__/refine.spec.ts`

**Interfaces (Produces):**

```ts
import type { DiffRow, Segment } from './model'
export function refineSegments(removedText: string, addedText: string): { removed: Segment[]; added: Segment[] } | null
export function refineRows(rows: DiffRow[]): DiffRow[]   // mutates paired removed/added rows' .segments in place, returns rows
```

Rules (normative): return `null` (no refinement — render whole-line) when either text exceeds 5,000 chars, or when `min(len)/max(len) < 0.4` (60% disparity). Tokenize with `Intl.Segmenter(undefined, { granularity: 'word' })`; if the pair yields ≤1 token on either side, retokenize both with `granularity: 'grapheme'`. Diff token arrays with jsdiff `diffArrays`; merge adjacent same-flag tokens into segments. `refineRows` pairs consecutive removed-run/added-run index-wise (same pairing as `toSplitRows`) and sets `.segments` only on paired rows where `refineSegments` returned non-null.

- [ ] **Step 1: Write the failing tests** — `src/lib/diff/__tests__/refine.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { refineSegments, refineRows } from '../refine'
import type { DiffRow } from '../model'

const joined = (segs: { text: string }[]) => segs.map(s => s.text).join('')
const changed = (segs: { text: string; changed: boolean }[]) => segs.filter(s => s.changed).map(s => s.text)

describe('refineSegments', () => {
  it('segments word-level change', () => {
    const r = refineSegments('the quick brown fox', 'the slow brown fox')!
    expect(joined(r.removed)).toBe('the quick brown fox')
    expect(joined(r.added)).toBe('the slow brown fox')
    expect(changed(r.removed)).toEqual(['quick'])
    expect(changed(r.added)).toEqual(['slow'])
  })

  it('audit repro №18: ZWJ emoji family stays one unit', () => {
    const r = refineSegments('family 👨‍👩‍👧', 'family 👨‍👩‍👦')!
    // the whole family glyph is the changed unit — never a bare child glyph with a leftover ZWJ prefix
    expect(changed(r.removed)).toEqual(['👨‍👩‍👧'])
    expect(changed(r.added)).toEqual(['👨‍👩‍👦'])
  })

  it('combining-mark difference never isolates a dangling accent', () => {
    const decomposed = 'café'
    const r = refineSegments(decomposed, 'cafe')!
    for (const seg of [...r.removed, ...r.added]) {
      expect(seg.text.startsWith('́')).toBe(false)
    }
    expect(joined(r.removed)).toBe(decomposed)
  })

  it('CJK single-character change is precise', () => {
    const r = refineSegments('今日は良い天気です', '今日は悪い天気です')!
    expect(changed(r.removed)).toEqual(['良'])
    expect(changed(r.added)).toEqual(['悪'])
  })

  it('returns null over 5000 chars or over 60% length disparity', () => {
    expect(refineSegments('x'.repeat(5001), 'y')).toBeNull()
    expect(refineSegments('short', 'this is a very much longer line of text entirely')).toBeNull()
  })
})

describe('refineRows', () => {
  it('attaches segments only to paired rows', () => {
    const rows: DiffRow[] = [
      { kind: 'context', leftNo: 1, rightNo: 1, text: 'same' },
      { kind: 'removed', leftNo: 2, text: 'the quick fox' },
      { kind: 'added', rightNo: 2, text: 'the slow fox' },
      { kind: 'added', rightNo: 3, text: 'unpaired extra' }
    ]
    refineRows(rows)
    expect((rows[1] as { segments?: unknown }).segments).toBeDefined()
    expect((rows[2] as { segments?: unknown }).segments).toBeDefined()
    expect((rows[3] as { segments?: unknown }).segments).toBeUndefined()
  })
})
```

- [ ] **Step 2:** run → FAIL. **Step 3: Implement** per rules (use `diffArrays` from `'diff'`; `oneSided` disparity check `Math.min(a.length, b.length) / Math.max(a.length, b.length) < 0.4`; tokenize via `[...new Intl.Segmenter(undefined, { granularity }).segment(text)].map(s => s.segment)`; merge diffArrays output runs into `Segment[]` per side: common → `{changed:false}` on both, removed-only → left `{changed:true}`, added-only → right). **Step 4:** PASS. **Step 5: Gates + commit** (`feat(diff-core): grapheme-safe intra-line refinement`).

---

### Task 4: `patch.ts` + `index.ts` — truthful exports and the single entry point (spec D6 + limits from D5)

**Files:**
- Create: `src/lib/diff/patch.ts`, `src/lib/diff/index.ts`
- Test: `src/lib/diff/__tests__/patch.spec.ts`, `src/lib/diff/__tests__/index.spec.ts`

**Interfaces (Produces):**

```ts
// patch.ts — ALWAYS original texts, never normalized/folded
export interface PatchOptions { context: number; leftName?: string; rightName?: string }
export function buildPatch(originalLeft: string, originalRight: string, opts: PatchOptions): string

// index.ts — the one entry point (worker + fallback both call this)
import type { DiffModel } from './model'
export interface DiffOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
  context: number            // Infinity allowed
}
export const LIMITS = { maxBytesPerSide: 5 * 1024 * 1024, maxRows: 200_000 } as const
export type ComputeResult = { ok: true; model: DiffModel } | { ok: false; reason: 'too-large'; detail: string }
export function computeDiffModel(left: string, right: string, options: DiffOptions): ComputeResult
```

`computeDiffModel` (normative): size-check first (`detail` names the limit, e.g. "Left input is 6.1 MB; the limit is 5 MB per side"); `normalizePair`; fold per fix-pack semantics (lowercase when ignoreCase; tab→space, collapse runs, trim line edges when ignoreWhitespace) applied AFTER normalization to both sides for comparison/display; `diffLines(foldedLeft, foldedRight)`; `buildDiffModel(runs, context, indicators)`; row-count check → too-large; `refineRows(model.rows)`; return model. `buildPatch` wraps jsdiff `createTwoFilesPatch(leftName ?? 'original', rightName ?? 'modified', originalLeft, originalRight, '', '', { context })` — Infinity context maps to `Math.max(leftLines, rightLines)`.

- [ ] **Step 1: Failing tests.** `patch.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPatch } from '../patch'

describe('buildPatch', () => {
  it('emits a valid unified patch at the requested context', () => {
    const p = buildPatch('a\nb\nc\nd\ne\n', 'a\nb\nX\nd\ne\n', { context: 1 })
    expect(p).toContain('--- original')
    expect(p).toContain('+++ modified')
    expect(p).toContain('@@ -2,3 +2,3 @@')
    expect(p).toContain('-c')
    expect(p).toContain('+X')
    expect(p).not.toContain(' a\n') // context 1 excludes line a
  })

  it('uses real filenames when provided', () => {
    const p = buildPatch('x\n', 'y\n', { context: 3, leftName: 'config.old.json', rightName: 'config.json' })
    expect(p).toContain('--- config.old.json')
    expect(p).toContain('+++ config.json')
  })

  it('emits the no-newline marker for missing trailing newlines', () => {
    const p = buildPatch('a\nb', 'a\nc', { context: 3 })
    expect(p).toContain('\\ No newline at end of file')
  })

  it('Infinity context includes every line', () => {
    const p = buildPatch('a\nb\nc\n', 'a\nb\nX\n', { context: Infinity })
    expect(p).toContain(' a\n')
    expect(p).toContain(' b\n')
  })
})
```

`index.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeDiffModel, LIMITS } from '../index'

const opts = { ignoreWhitespace: false, ignoreCase: false, context: 3 }

describe('computeDiffModel', () => {
  it('produces a refined model end-to-end', () => {
    const r = computeDiffModel('the quick fox\n', 'the slow fox\n', opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats.modified).toBe(1)
      const removed = r.model.rows.find(row => row.kind === 'removed')
      expect((removed as { segments?: unknown[] }).segments).toBeDefined()
    }
  })

  it('audit headline: CRLF vs LF inputs → zero changed rows + eol indicator', () => {
    const r = computeDiffModel('a\r\nb\r\nc', 'a\nb\nc', opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
      expect(r.model.indicators.some(i => i.kind === 'eol-differs')).toBe(true)
    }
  })

  it('fold semantics carry over: case + whitespace fold for comparison', () => {
    const r = computeDiffModel('Hello   World\n', 'hello world\n', { ...opts, ignoreCase: true, ignoreWhitespace: true })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
  })

  it('rejects oversized input with a named limit, never truncating silently', () => {
    const big = 'x'.repeat(LIMITS.maxBytesPerSide + 1)
    const r = computeDiffModel(big, 'small', opts)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.detail).toMatch(/limit is 5 MB/)
  })
})
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** both files per the normative description (byte size via `new TextEncoder().encode(text).length` is O(n) memory — use `text.length * 1` heuristic? NO: use `Blob` sizing is unavailable in worker-safe pure code paths in jsdom tests — use `TextEncoder` length; it is accurate and acceptable at 5MB scale). **Step 4:** PASS. **Step 5: Gates + commit** (`feat(diff-core): patch builder and computeDiffModel entry point with published limits`).

---

### Task 5: Worker + `useDiffWorker` composable (spec D2)

**Files:**
- Create: `src/workers/diff.worker.ts`, `src/composables/useDiffWorker.ts`
- Test: `src/composables/__tests__/useDiffWorker.spec.ts`

**Interfaces (Produces):**

```ts
// worker protocol
export interface DiffRequest { id: number; left: string; right: string; options: DiffOptions }
export type DiffResponse = { id: number; result: ComputeResult } | { id: number; error: string }

// composable
export function useDiffWorker(): {
  state: Ref<'idle' | 'computing' | 'done' | 'error' | 'too-large'>
  model: Ref<DiffModel | null>
  errorDetail: Ref<string>
  elapsedMs: Ref<number>          // ticks while computing (progress UI trigger at 300ms)
  compute(left: string, right: string, options: DiffOptions): void
  cancel(): void
  usingFallback: boolean          // true when Worker construction failed
}
```

Worker body: `self.onmessage` → run `computeDiffModel` → `postMessage` response (wrap in try/catch → error response). Composable: lazy-construct worker on first `compute` inside try/catch; on failure set `usingFallback = true` and compute synchronously (setTimeout(0) wrap so the UI paints the computing state); requests carry an incrementing `id`; responses with `id !== latestId` are dropped (supersede); `cancel()` bumps the id and sets state `idle`; `elapsedMs` driven by a 100ms interval only while computing.

- [ ] **Step 1: Failing tests** — `useDiffWorker.spec.ts` (jsdom has no real Worker: stub `globalThis.Worker` with a fake that runs `computeDiffModel` on a `setTimeout(0)`; ALSO test the fallback branch by stubbing `Worker` to throw):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { computeDiffModel } from '@/lib/diff'
import type { DiffRequest } from '@/workers/diff.worker'

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage(req: DiffRequest) {
    setTimeout(() => {
      const result = computeDiffModel(req.left, req.right, req.options)
      this.onmessage?.({ data: { id: req.id, result } } as MessageEvent)
    }, 0)
  }
  terminate() {}
}

const flush = () => new Promise(r => setTimeout(r, 5))
const opts = { ignoreWhitespace: false, ignoreCase: false, context: 3 }

describe('useDiffWorker', () => {
  beforeEach(() => vi.resetModules())

  it('computes via the worker and lands in done with a model', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\nb\n', 'a\nX\n', opts)
    expect(w.state.value).toBe('computing')
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.model.value!.stats.modified).toBe(1)
  })

  it('supersede: only the latest request lands', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('1\n', 'one\n', opts)
    w.compute('2\n', 'two\n', opts)
    await flush(); await nextTick()
    const removed = w.model.value!.rows.find(r => r.kind === 'removed') as { text: string }
    expect(removed.text).toBe('2')
  })

  it('too-large results land in the too-large state with detail', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const { LIMITS } = await import('@/lib/diff')
    const w = useDiffWorker()
    w.compute('x'.repeat(LIMITS.maxBytesPerSide + 1), 'y', opts)
    await flush(); await nextTick()
    expect(w.state.value).toBe('too-large')
    expect(w.errorDetail.value).toMatch(/limit/)
  })

  it('falls back to synchronous compute when Worker construction throws', async () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('no workers here') } })
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\n', 'b\n', opts)
    await flush(); await nextTick()
    expect(w.usingFallback).toBe(true)
    expect(w.state.value).toBe('done')
    expect(w.model.value).not.toBeNull()
  })

  it('cancel returns to idle and drops the in-flight result', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\n', 'b\n', opts)
    w.cancel()
    await flush(); await nextTick()
    expect(w.state.value).toBe('idle')
    expect(w.model.value).toBeNull()
  })
})
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** worker + composable per protocol (worker file must import ONLY from `src/lib/diff` — no Vue; the composable creates the worker via `new Worker(new URL('../workers/diff.worker.ts', import.meta.url), { type: 'module' })`). **Step 4:** PASS. **Step 5: Gates + commit** (`feat(diff-core): worker compute with supersede, cancel, progress state, sync fallback`).

---

### Task 6: `useVirtualRows` — minimal fixed-height virtualizer (spec D5)

**Files:**
- Create: `src/composables/useVirtualRows.ts`
- Test: `src/composables/__tests__/useVirtualRows.spec.ts`

**Interfaces (Produces):**

```ts
export const VIRTUALIZE_THRESHOLD = 500
export function useVirtualRows(totalRows: Ref<number>, opts: { rowHeight: number; overscan: number }): {
  containerProps: { onScroll: (e: Event) => void; style: Record<string, string> }  // max-height: 70vh; overflow-y: auto — applied only when active
  active: ComputedRef<boolean>                 // totalRows > VIRTUALIZE_THRESHOLD
  start: ComputedRef<number>                   // first rendered row index
  end: ComputedRef<number>                     // exclusive
  padTop: ComputedRef<number>                  // px spacer above
  padBottom: ComputedRef<number>               // px spacer below
  scrollToRow(index: number): void             // sets scrollTop so row lands ~1/3 from top
  viewportHeight: Ref<number>                  // updated from the scroll container; default 600
}
```

Behavior (normative): inactive (`totalRows <= threshold`) → `start=0`, `end=totalRows`, pads 0, containerProps style empty. Active: `start = clamp(floor(scrollTop/rowHeight) - overscan, 0, …)`, `end = clamp(ceil((scrollTop+viewportHeight)/rowHeight) + overscan, …, totalRows)`, `padTop = start*rowHeight`, `padBottom = (totalRows-end)*rowHeight`. Tests drive it headlessly by invoking `containerProps.onScroll` with a fake event carrying `{ target: { scrollTop, clientHeight } }` — write tests for: inactive passthrough, window math at scrollTop 0 / middle / bottom (exact indices with rowHeight 24, overscan 20, viewport 600, 10,000 rows), `scrollToRow` math, and reactivity when `totalRows` shrinks below threshold. (Author the test file from these cases — same style as Tasks 1–5; every assertion numeric and exact.)

- [ ] **Step 1:** failing tests per above. **Step 2:** FAIL. **Step 3:** implement (~80 lines). **Step 4:** PASS. **Step 5: Gates + commit** (`feat(diff-core): minimal fixed-height row virtualizer`).

---

### Task 7: `DiffRows.vue` + `DiffIndicators.vue` — model-driven rendering (spec D1, D3, D8)

**Files:**
- Create: `src/components/diff/DiffRows.vue`, `src/components/diff/DiffIndicators.vue`
- Test: `src/components/__tests__/DiffRows.spec.ts`

**Interfaces (Produces):**
- `DiffRows` props: `{ rows: DiffRow[]; mode: 'split' | 'unified'; activeRowIndex: number | null }`; renders unified from `rows`, split from `toSplitRows(rows)`; uses `useVirtualRows` internally; class names (normative — e2e + navigation depend on them): `dv-row`, `dv-row--context|removed|added|gap`, `dv-row--active`, `dv-gutter`, `dv-text`, `dv-seg--changed`. Gap rows render `⋯ N unchanged lines`. Segments render via `<span>` interpolation — NO v-html. Line numbers from the row objects.
- `DiffIndicators` props: `{ indicators: Indicator[] }` → one pill per indicator, class `dv-indicator`, text = `detail`.
- Styling: reuse existing `--diff-*` tokens from `theme.css` (added/removed row+word backgrounds, gutter colors) — visual parity with today.

Component tests (author in the established @vue/test-utils style): unified render of a small model asserts row order/classes/gutter numbers/segment marks and absence of any `innerHTML`-set content for a `<script>`-bearing text (assert the rendered textContent contains the literal and the DOM has no script element); split render asserts placeholder cells (`dv-cell--empty`) and paired rows on one line; gap row text; indicator pills.

- [ ] **Step 1:** failing component tests. **Step 2:** FAIL. **Step 3:** implement both SFCs. **Step 4:** PASS. **Step 5: Gates + commit** (`feat(diff-core): model-driven DiffRows and DiffIndicators components`).

---

### Task 8: Rewire `DiffRenderer.vue` as orchestrator (spec D1/D2/D5 integration)

**Files:**
- Modify: `src/components/DiffRenderer.vue` (major rewrite; toolbar/props/events preserved)
- Modify: `tests/e2e/text-compare.spec.ts`, `tests/e2e/correctness-fixes.spec.ts`, `tests/e2e/tools-functional.spec.ts` — ONLY selector updates `.d2h-*` → `dv-*` equivalents (`.d2h-del, .d2h-ins` → `.dv-row--removed, .dv-row--added`; `.d2h-ins` → `.dv-row--added`; etc.), assertions unchanged.

**Consumes:** `useDiffWorker` (Task 5), `DiffRows`/`DiffIndicators` (Task 7), `buildPatch` (Task 4).
**Produces:** DiffRenderer external contract unchanged plus two new optional props `leftFilename?: string`, `rightFilename?: string` (wired in Task 10). Keeps: stats bar (from `model.stats` — now with separate added/removed/modified chips), Split/Unified segmented control, Whitespace/Case toggles (emit `options-changed`, unchanged), Context select, Copy/Export buttons (disabled when no model or zero changes), nav placeholder (Task 9 replaces internals), empty state ("No differences found" + indicators still shown), too-large state (limit message), error state with Retry, computing state (spinner + elapsed + Cancel button appearing at 300ms via `elapsedMs`).

Normative behaviors:
- ONE `watch([leftText, rightText, ignoreWhitespace, ignoreCase, contextLines], compute, { immediate: true })` — no `onMounted` compute call (kills double-compute); mode switch does NOT recompute (render-only change).
- `lastPatch` concept is replaced: Copy/Export call `buildPatch(props.leftText, props.rightText, { context: displayedContext, leftName, rightName })` on click (original texts, displayed context — D6); disabled via `:disabled="!hasChanges"` where `hasChanges = model && (stats.added+stats.removed+stats.modified) > 0`.
- Copy uses `useClipboard().copyWithFeedback(patch, 'Diff')`.
- All diff2html imports/CSS/`v-html`/`computeStatsFromParsed`/`foldText`/`preprocess` code deleted from this file (folding now lives in `computeDiffModel`).
- The diff2html CSS variable-mapping `<style>` block is replaced by ~60 lines styling `dv-*` classes from the same tokens.

- [ ] **Step 1:** Update e2e selectors first and run the targeted e2e to capture the RED state (old renderer can't satisfy `dv-*`): `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line` → failures recorded.
- [ ] **Step 2:** Rewrite DiffRenderer per above.
- [ ] **Step 3:** e2e → GREEN (all previously passing tests pass with new selectors; behavior assertions untouched).
- [ ] **Step 4:** Gates. **Step 5: Commit** (`feat(diff-core): DiffRenderer renders the structured model via worker — no v-html, no reparse`).

---

### Task 9: Model-driven navigation (spec D7, audit №8)

**Files:**
- Modify: `src/composables/useDiffNavigation.ts` (rewrite), `src/components/DiffRenderer.vue` (wire), `src/components/diff/DiffRows.vue` (expose `scrollToRow` via `defineExpose`)
- Test: `src/composables/__tests__/useDiffNavigation.spec.ts` (new unit), e2e append to `correctness-fixes.spec.ts`

**Interfaces (Produces):**

```ts
export function useDiffNavigation(rows: Ref<DiffRow[] | null>): {
  totalBlocks: ComputedRef<number>
  currentBlock: Ref<number>          // 0-based; -1 = none
  activeRowIndex: ComputedRef<number | null>   // first row of current block
  nextChange(): void
  prevChange(): void
}
```

Block = maximal run of `removed`/`added` rows (gaps/context break runs). Unit tests: block counting for modify/insert-only/delete-only models (the №8 case: pure append at end = 1 block), wraparound behavior (next past last stays at last; prev before first stays at 0 — no wrap, matches current UX), activeRowIndex mapping. E2E (append `describe('Navigation reaches insertions (№8)')`): left `a\nb`, right `a\nb\nc\nd` in SPLIT view → nav widget visible with `1` total; click next → `.dv-row--active` visible and scrolled into view; switch unified → counter identical.

- [ ] **Step 1:** failing unit + e2e. **Step 2:** implement rewrite (delete MutationObserver/DOM scanning entirely; DiffRenderer binds `activeRowIndex` into DiffRows and calls `scrollToRow` on change; Alt+Arrow handler keeps its editable-target guard). **Step 3:** green. **Step 4:** Gates + targeted e2e. **Step 5: Commit** (`fix(diff-core): navigation reads the model — split view reaches pure insertions`).

---

### Task 10: Filename plumbing + export-context e2e (spec D6)

**Files:**
- Modify: `src/components/CompareText.vue` (track `leftFilename`/`rightFilename` refs: set in `loadFile` from `file.name`, cleared in `onText1Input`/`onText2Input`/clears/swap swaps them; pass as props), `src/components/DiffRenderer.vue` (already accepts props from Task 8 — use in `buildPatch` call + export download name `diff-<leftName>-<rightName>.patch` when names exist, else `diff.patch`)
- Test: e2e append

E2E (append `describe('Export fidelity (D6)')`): upload two temp files `alpha.txt`/`beta.txt` with a 10-line diff; set Context=0; click Export; read the download; assert it contains `--- alpha.txt`, `+++ beta.txt`, exactly the changed lines ± 0 context (`@@` hunk with no leading space-lines), and matches a second export at Context=All containing context lines. Also assert Copy (clipboard) equals the exported bytes at the same context.

- [ ] **Step 1:** failing e2e. **Step 2:** implement plumbing. **Step 3:** green; gates. **Step 4: Commit** (`feat(diff-core): exports honor displayed context and real filenames`).

---

### Task 11: Carried follow-ups (spec D9)

**Files:**
- Modify: `src/components/CompareText.vue` (`clearText1`/`clearText2` call `shareState.flushSave()` after clearing; `loadSampleData` captures both panes and adds the standard 10s Undo toast; `onShareClick` adds an `else` info toast for `reason: 'empty'`: summary "Nothing to share", detail "Both panes are empty.")
- Modify: `src/config/seo.ts` (delete the entire dead `meta` block — verify nothing imports `SEO_CONFIG.meta` first with grep; if something does, STOP and report)
- Test: e2e append — sample-load Undo restores prior panes; per-pane clear + immediate reload stays cleared.

- [ ] **Step 1:** failing e2e (2 tests). **Step 2:** implement. **Step 3:** green; gates. **Step 4: Commit** (`fix: carried follow-ups — per-pane clear flush, undoable sample, empty-share toast, dead seo meta block`).

---

### Task 12: Remove diff2html + indicator/responsiveness/perf e2e (spec D3/D5 verification, dependency removal)

**Files:**
- Modify: `package.json` (remove `diff2html`), run `npm install` to update lockfile
- Verify: `grep -rn "diff2html" src tests` → only historical mentions in comments allowed; none in code
- Test: e2e append to `correctness-fixes.spec.ts`:

```ts
test.describe('Diff core truth & performance (D3/D5)', () => {
  test.beforeEach(async ({ devyantra }) => {
    await devyantra.navigateToTool('text-compare')
  })

  test('CRLF vs LF upload pair shows an EOL pill and zero phantom changes', async ({ page }) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-'))
    const l = path.join(dir, 'win.txt'); fs.writeFileSync(l, 'a\r\nb\r\nc')
    const r = path.join(dir, 'unix.txt'); fs.writeFileSync(r, 'a\nb\nc')
    await page.locator('input[type="file"]').first().setInputFiles(l)
    await page.locator('input[type="file"]').nth(1).setInputFiles(r)
    await page.locator('.compare-btn').click()
    await expect(page.locator('.dv-indicator', { hasText: 'Line endings differ' })).toBeVisible()
    await expect(page.locator('.diff-empty-message h3')).toHaveText('No differences found')
    await expect(page.locator('.dv-row--removed, .dv-row--added')).toHaveCount(0)
  })

  test('UI stays interactive while a heavy diff computes', async ({ page }) => {
    const mkText = (seed: number) =>
      Array.from({ length: 60000 }, (_, i) => `line-${i}-${(i * seed) % 9973}`).join('\n')
    await page.evaluate(([a, b]) => {
      const tas = document.querySelectorAll('textarea')
      const set = (ta: HTMLTextAreaElement, v: string) => {
        ta.value = v
        ta.dispatchEvent(new Event('input', { bubbles: true }))
      }
      set(tas[0] as HTMLTextAreaElement, a!)
      set(tas[1] as HTMLTextAreaElement, b!)
    }, [mkText(7919), mkText(104729)])
    await page.locator('.compare-btn').click()
    // While computing (or already done — both acceptable), the theme toggle must respond within 500ms
    const t0 = Date.now()
    await page.locator('.theme-toggle button, [aria-label*="theme" i], .cmdk-trigger').first().click({ timeout: 2000 })
    expect(Date.now() - t0).toBeLessThan(1500)
    // And a terminal state must eventually appear
    await expect(page.locator('.dv-row, .diff-empty-message, .dv-limit-message').first()).toBeVisible({ timeout: 30000 })
  })

  test('perf budget: 10k-line 30%-changed diff renders without long main-thread blocks', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-expect-error test instrumentation
      window.__longtasks = []
      new PerformanceObserver((list) => {
        // @ts-expect-error test instrumentation
        window.__longtasks.push(...list.getEntries().map(e => e.duration))
      }).observe({ entryTypes: ['longtask'] })
    })
    const left = Array.from({ length: 10000 }, (_, i) => `l${i}`).join('\n')
    const right = Array.from({ length: 10000 }, (_, i) => (i % 3 === 0 ? `CHANGED${i}` : `l${i}`)).join('\n')
    await page.evaluate(([a, b]) => {
      const tas = document.querySelectorAll('textarea')
      const set = (ta: HTMLTextAreaElement, v: string) => {
        ta.value = v
        ta.dispatchEvent(new Event('input', { bubbles: true }))
      }
      set(tas[0] as HTMLTextAreaElement, a!)
      set(tas[1] as HTMLTextAreaElement, b!)
    }, [left, right])
    await page.locator('.compare-btn').click()
    await expect(page.locator('.dv-row').first()).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(300)
    const longtasks = await page.evaluate(() => {
      // @ts-expect-error test instrumentation
      return (window.__longtasks as number[]).filter(d => d > 200)
    })
    expect(longtasks).toEqual([])
  })
})
```

(Adjust the theme-toggle selector in the interactivity test to the app's real one — check `App.vue`; the assertion is the click succeeding fast, not which control.)

- [ ] **Step 1:** append tests; the truth test should already PASS (D3 landed in Task 8) — run all three; capture results; the perf/interactivity tests are the real verification. If the perf budget fails, that is a BLOCKING finding on the virtualizer/worker integration — investigate and fix within this task, do not relax the budget.
- [ ] **Step 2:** remove diff2html, `npm install`, grep-verify, full gates + build.
- [ ] **Step 3: Commit** (`feat(diff-core): drop diff2html; prove EOL truth, interactivity, and perf budget in e2e`).

---

### Task 13: Full sweep + docs

**Files:** `README.md`, `CHANGELOG.md`

- [ ] **Step 1:** `npm run type-check && npm run lint && npm run test:run && npm run build` and `npx playwright test --project=chromium --reporter=line` (FULL suite — core/accessibility/command-palette/tools-functional included). Triage: failures caused by intentional renderer changes → update selectors/assertions to the new truth and document each; anything else → BLOCKED report.
- [ ] **Step 2:** README: update the Text Compare feature bullet to mention EOL/newline indicators, worker-powered large-file handling, and context-faithful exports. CHANGELOG `[Unreleased] → Changed`: structured diff engine (no HTML reparse), Web Worker compute with cancel/progress, virtualized rendering with published limits (5 MB/side), EOL/BOM/trailing-newline indicators replace phantom diffs, grapheme-safe highlights, exports honor context + real filenames, split-view navigation reaches insertions, diff2html removed (~xx KB bundle drop — read the build output and state the real number).
- [ ] **Step 3: Commit** (`docs: changelog + readme for diff core rework`).

---

## Plan Self-Review (completed)

- **Spec coverage:** D1→T2/T7/T8; D2→T5/T8; D3→T1/T4/T8/T12; D4→T3; D5→T4/T6/T8/T12; D6→T4/T10; D7→T9; D8→T2/T7; D9→T11; testing section→T12/T13. No gaps.
- **Placeholder scan:** Task 6 and Task 7 delegate test-file authoring against enumerated exact cases (numeric windows, named classes, listed assertions) — deliberate, bounded, no "add tests" hand-waving. No TBDs.
- **Type consistency:** `DiffRow`/`DiffModel`/`ComputeResult`/`DiffOptions` defined once (T2/T4) and imported by name everywhere later; class names `dv-*` fixed in T7 and reused in T8/T9/T12 e2e; `useDiffWorker` return shape in T5 matches T8's usage; `buildPatch` signature in T4 matches T8/T10 call sites.
- **Known risk:** T8 is the largest task (renderer rewrite + selector migration). If its implementer reports BLOCKED, split into 8a (renderer) / 8b (selector migration) at dispatch time.
