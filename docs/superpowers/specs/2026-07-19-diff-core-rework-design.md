# Diff Core Rework — Design

**Date:** 2026-07-19
**Scope:** Sub-project 2 of 5 in the 10x initiative. Rebuilds the Text Compare computation/rendering core to be truthful, fast, and unfreezable — the foundation the best-diff-tool roadmap (structural diff, moved blocks, syntax highlighting) builds on. Covers audit bugs №4–6 (EOL/newline truth), №7b/c (export fidelity), №8 (navigation misses insertions), №9 (patch-reparse file-splitting), №14 (main-thread freezes + double-compute), №17 (literal marker stripped), №18 (grapheme splitting), №19 (hidden hunk boundaries), plus four small carried follow-ups from the fix-pack review.

**Explicitly out of scope** (later sub-projects): syntax highlighting, histogram/patience + semantic-cleanup readability pipeline, moved-block detection, structural/AST diff, 3-way merge — the new data model must not preclude them, but none are built here.

## Goals

1. Nothing renders from re-parsed patch text — one structured model feeds view, stats, navigation, and export.
2. No input freezes the tab: compute off the main thread, progress feedback, published limits, virtualized rendering.
3. Invisible differences become visible: EOL, trailing-newline, and BOM mismatches get explicit indicators instead of phantom all-changed rows.
4. Exports tell the truth: what you download matches what you chose to see, built from original bytes.

## Design decisions

### D1 — Render from a structured model, not patch text

Today's pipeline is `createTwoFilesPatch` → unified-diff **string** → `diff2html` re-parse → HTML string → `v-html`. The string round-trip is the root cause of an entire bug class: SQL `--`/`++` content lines split the render into two "files" at Context 0 (№9), a literal `\ No newline at end of file` in user content is deleted (№17), and CR-only content corrupts the parse (№5).

**New pipeline (all pure functions, unit-testable):**

```
normalize(left, right)             → { left, right, indicators }   (D3)
diffLines via jsdiff               → change runs
buildDiffModel(runs, context)      → DiffModel                     (below)
refinePairs(model)                 → intra-line segments           (D4)
```

```ts
interface DiffModel {
  rows: DiffRow[]                  // ordered; drives view, nav, stats
  stats: { added: number; removed: number; modified: number }
  indicators: Indicator[]          // eol-differs | no-trailing-newline-left/right | bom-left/right
  truncated: boolean               // input exceeded hard limits (D5)
}
type DiffRow =
  | { kind: 'context';  leftNo: number; rightNo: number; text: string }
  | { kind: 'removed';  leftNo: number; text: string; segments?: Segment[] }
  | { kind: 'added';    rightNo: number; text: string; segments?: Segment[] }
  | { kind: 'gap';      hiddenCount: number }                       // replaces hidden hunk headers (№19)
type Segment = { text: string; changed: boolean }
```

Vue components (`DiffRows.vue` split/unified renderers) render the model directly with normal template interpolation — **no `v-html`**, which also structurally eliminates the escaping-bug class. `diff2html` and its CSS are dropped from the compare path (dependency removed unless the delimiter/format tools use it — they don't). The existing diff design tokens in `theme.css` are reused; visual appearance stays intentionally close to today's.

Considered and rejected: (a) keeping diff2html with sanitized inputs — preserves the fragile reparse; (b) adopting monaco's diff editor — ~4–5MB dependency, fights the design system and the no-bloat ethos; its moved-block feature is re-evaluated in the later roadmap phase.

### D2 — Web Worker compute with progress, cancellation, and fallback

- Diff computation (normalize → diffLines → model → refine) runs in a dedicated module Worker (`src/workers/diff.worker.ts`, Vite `new Worker(new URL(...), { type: 'module' })`).
- Protocol: `{ id, left, right, options }` in; `{ id, model }` or `{ id, error }` out. A new request supersedes the previous `id`; superseded responses are dropped (cancellation).
- Progress: if compute exceeds 300 ms, the UI shows the existing spinner plus an elapsed-time note; the Compare button becomes "Cancel".
- Fallback: if Worker construction throws (unsupported environment), compute synchronously on the main thread with the same functions (shared module import — zero duplication).
- Fixes the double/triple compute on mount (audit №14, review follow-up): computation is triggered by one watcher on `[texts, options, context]` with `{ immediate: true }`; the redundant `onMounted` call is removed. Mode toggling (split↔unified) re-renders from the cached model without recomputing.

### D3 — Normalization and the invisible-difference indicators (№4, №5, №6)

- Before diffing: strip UTF-8 BOM per side; normalize `\r\n` and lone `\r` to `\n`. Detection results become `Indicator`s.
- Indicator pills render above the diff: "Line endings differ: left CRLF, right LF", "No newline at end of left file", "BOM present in right file". Identical-after-normalization inputs with indicator differences show "No content differences" plus the pills — never phantom all-changed rows.
- Trailing-newline difference renders as an indicator, not a fake modified last line.
- The exported patch (D6) is still built from **original, unnormalized** text, so `git apply` fidelity is preserved; the `\ No newline at end of file` marker is emitted correctly by jsdiff and no longer stripped from display (the model never contains it as content — №17 dies with the reparse).
- No strict-bytes comparison mode in this sub-project (YAGNI; the indicators carry the information).

### D4 — Grapheme-safe intra-line refinement (№18)

For each adjacent removed/added pair inside a hunk (pairing rule: consecutive removed run aligned index-wise with the following added run), compute word-level segments using `Intl.Segmenter(undefined, { granularity: 'word' })`, falling back to grapheme-level segments (`granularity: 'grapheme'`) when a line pair is one "word" (e.g. minified code, CJK already works). ZWJ emoji families and combining marks stay whole. Refinement is skipped for lines longer than 5,000 chars (render plain removed/added — matches diff2html's old guard) and for pairs with more than 60% length disparity (treated as full replace, avoiding confetti).

### D5 — Virtualized rendering and published limits (№14)

- A minimal hand-rolled row virtualizer (~100 lines, fixed row height, overscan 20; no new dependency) renders only visible rows in both split and unified modes when the model exceeds 500 rows. Below that, plain `v-for` (keeps DOM-simple for the common case).
- Hard input limits, stated in the UI: 5 MB per side (matches the existing upload cap), 200,000 model rows. Beyond limits: refuse with a clear message ("Inputs over 5 MB per side aren't supported yet"), never a frozen tab; `truncated` never silently drops content — it only occurs with an explicit banner.
- Row hover, nav highlight, and gap rows all work identically under virtualization (state lives in the model, not DOM classes — nav highlight is `activeRowIndex` driven).

### D6 — Export fidelity (№7b/c)

- Copy/Export generate a unified patch from the **original texts** at the **currently displayed context depth** (Context selector finally affects the artifact). "All" context exports full context.
- Filenames: when a side was loaded from an upload, its real filename is used (`a/<name> b/<name>`); typed/pasted sides fall back to `original`/`modified`. Filenames surface in the export tooltip.
- Copy and Export produce byte-identical content; both disabled when the model has no changes (invariant from the fix pack carries over).

### D7 — Model-driven navigation (№8)

`useDiffNavigation` is rewritten to iterate the model: a "change block" is a maximal run of non-context rows. Prev/Next moves `activeRowIndex` to the block's first row and scrolls it into view (virtualizer exposes `scrollToRow`). Pure insertions and deletions are both blocks in both view modes — the split-view blindness dies with the DOM scraping, as does the MutationObserver machinery. Counter reads `currentBlock/totalBlocks` from the model.

### D8 — Gap rows instead of hidden hunk headers (№19)

Between hunks, a `gap` row renders "⋯ 13 unchanged lines" as a styled divider (design-token colors, not `display:none`). No `:has()` selector remains (old-Safari rendering bug dies). Click-to-expand is deliberately out of scope; the divider is static.

### D9 — Carried follow-ups from the fix-pack review (one small task)

- `clearText1`/`clearText2` flush the autosave debounce like `clearAll` does.
- `loadSampleData` captures previous pane contents and offers the standard 10 s Undo toast.
- `onShareClick` gains an info toast for the (currently unreachable) `reason: 'empty'` arm.
- Delete the dead `SEO_CONFIG.meta` block in `src/config/seo.ts` (removes the phantom `browserconfig.xml` reference; the block is consumed by nothing — verified in the fix-pack review).

## Component/file structure

```
src/lib/diff/            # pure, worker-safe, no Vue imports
  normalize.ts           # EOL/BOM normalization + indicator detection
  model.ts               # DiffModel types + buildDiffModel(runs, context)
  refine.ts              # Intl.Segmenter segment refinement
  patch.ts               # export patch generation from originals (context-aware, filenames)
  index.ts               # computeDiffModel(left, right, options) — the one entry point
src/workers/diff.worker.ts
src/composables/useDiffWorker.ts   # request/supersede/fallback/progress state
src/components/diff/
  DiffRows.vue           # virtualized split/unified row renderer (model-driven)
  DiffIndicators.vue     # EOL/newline/BOM pills
DiffRenderer.vue         # becomes a thin orchestrator: toolbar + useDiffWorker + DiffRows
```

`CompareText.vue` keeps its existing props/events to DiffRenderer (`left-text`, `right-text`, `mode`, `ignore-whitespace`, `ignore-case`, `options-changed`, `mode-changed`) and adds two optional ones for D6: `left-filename` / `right-filename` (set on upload, cleared on manual edit/clear). Ignore options fold inside the pipeline exactly as the fix pack established (fold for compare/display, originals for export).

## Error handling

Worker errors surface as a visible error state with a retry button (never a silent empty diff). Worker construction failure logs once and falls back synchronously. Limit violations show the published-limit message. No `console.error`-only paths for user-initiated actions.

## Testing

- **Unit (bulk of coverage — the pipeline is pure):** normalize (CRLF/CR/BOM matrices, the audit's verified CR-only corruption repro), model building (hunk boundaries at context 0/3/∞, the SQL `--`/`++` repro must yield one coherent model, pure-insert/pure-delete blocks, literal `\ No newline at end of file` as content survives), refine (ZWJ family, combining marks, CJK, 60%-disparity full-replace), patch (git-apply-valid output at each context depth, real filenames, original bytes with folds active).
- **E2E:** toggles/indicators visible for CRLF-vs-LF upload pair (the audit's headline invisible-diff case now shows a pill and zero phantom rows); large-input responsiveness (paste two ~2 MB texts with heavy changes: UI stays interactive — assert a button click succeeds during compute — and a result or progress state appears); export honors the Context selector; split-view Prev/Next reaches a pure-append change (№8 regression test); virtualized long diff scrolls with correct line numbers at both ends.
- **Perf budget test (e2e, chromium):** 10,000-line inputs with ~30% changed lines must render with main-thread blocks under 200 ms (measured via PerformanceObserver longtask entries) — this is the case that took 9.4 s of blocking compute in the audit.
- All existing correctness-fixes + text-compare e2e tests must pass unchanged except selectors that referenced diff2html's `.d2h-*` classes, which are updated to the new component's classes with assertions preserved.

## Risks

- Dropping diff2html changes DOM/CSS classes several e2e tests target — mitigated by updating selectors in the same tasks that change the renderer, assertions intact.
- jsdiff `diffLines` on pathological inputs can still be slow in the Worker; the limits + cancel affordance bound the damage, and the Myers-alternative (histogram) belongs to the readability sub-project.
- Fixed-row-height virtualization assumes no wrapping: long lines scroll horizontally within panels (today's behavior, verified fine in the audit's 200 KB-line test). If a future wrap mode lands, the virtualizer needs variable heights — out of scope.

## Definition of done

`npm run type-check && npm run lint && npm run test:run && npm run build` green; full chromium e2e green including the new perf-budget test; `diff2html` removed from `package.json`; every №-referenced bug in scope has a test that fails on current `main` and passes on this branch.
