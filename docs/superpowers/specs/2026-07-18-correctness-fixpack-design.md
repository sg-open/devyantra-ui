# Correctness Fix Pack — Design

**Date:** 2026-07-18
**Scope:** Sub-project 1 of 5 in the 10x initiative (Fix Packs 1–2 from the audit). Fixes every confirmed lying-feature and data-loss bug plus dead-code cleanup. Explicitly **out of scope** (deferred to the Diff Core Rework spec): EOL/newline normalization (№4–6), render-from-structure (№9), Web Worker + virtualization (№14), grapheme-aware highlighting (№18), hunk dividers (№19).

**Source of truth for bug numbers:** the 2026-07-18 audit report (24 findings; static hunt verified in Node against exact deps, dynamic hunt reproduced live in Chromium).

## Goals

1. No control in the app does nothing: every toggle, button, and shortcut either works or is removed.
2. No user data is ever silently lost or silently overwritten.
3. Every clipboard/share/export action gives success or failure feedback.
4. Every fix lands with a behavior-asserting test (the current e2e suite passes 16/16 with all these bugs present because it asserts visibility, not behavior).

## Design decisions

### D1 — Ignore Whitespace / Ignore Case toggles (№1)

Wire `CompareText.vue` to real state: bind `:ignore-whitespace` / `:ignore-case` to refs updated by the renderer's `options-changed` event (restore the wiring that exists in dead `DiffView.vue`).

**Semantics:** ignore options affect *comparison only, never content*. The diff is computed over original text using comparison-level options, not by preprocessing the inputs (today's dead path lowercases/collapses text before diffing, which would corrupt exported patches). Exported/copied patches always contain original text; when active ignore options would make the export contain differences the view hides, the export tooltip states this.

Acceptance: `Hello World` vs `hello world` + Case → renders "No differences found". `a   b` vs `a b` + Whitespace → "No differences found". Patch exported with options off is byte-identical to one exported with options on.

### D2 — Share lifecycle (№2, №3, №10)

New ordering in `useShareState`:

1. Parse URL hash → **strict validation**: known version required, `leftText`/`rightText` must be strings; unknown version or malformed fields = failed load (falls back to localStorage), never a "successful" blank restore.
2. On successful restore: immediately remove the hash via `history.replaceState` (`cleanupUrl()` finally gets called).
3. Autosave watcher registers only after restore completes, and saves only after the first user edit (dirty flag) — opening a link never overwrites the visitor's stored state.

**Share feedback:** success → toast "Link copied" with size; over the 8,000-char URL cap → error toast explaining the limit with the measured size. `onShareClick` consumes the return value it currently ignores.

Acceptance: open share link → edit → reload → edit persists and hash is gone. Open link → Clear All → reload → stays cleared. Garbage/`version:"2.0.0"` hash → own localStorage state restored, no blanking. Oversized share → visible error, clipboard untouched.

### D3 — Clipboard feedback everywhere (№16)

One `copyWithFeedback(text, label)` util in a new `useClipboard` composable: success toast, failure toast with reason, `document.execCommand("copy")` fallback for non-secure contexts. Adopted by all copy paths in CompareText, DiffRenderer, and the other 7 tools' copy buttons.

### D4 — Export honesty, Fix-Pack-1 slice of №7

Clear `lastPatch` on every early return in `computeDiff` (identical inputs / empty inputs), and disable Copy/Export buttons when no current diff exists. (Context-selector fidelity and real filenames ride with the Diff Core Rework.)

Acceptance: show diff → make inputs identical → Compare → Export button disabled; nothing stale downloadable.

### D5 — Keyboard shortcuts (№15)

- Match on `event.code` (`Digit1`, `Digit2`, …) so Shift-modified keys actually fire.
- Rebind away from browser-reserved combos: copy left/right stay `Mod+Shift+1/2`; swap moves `Mod+Shift+S` → `Mod+Shift+X`; load sample moves `Mod+Shift+L` → `Mod+Shift+U`.
- **Clear-left/right lose their shortcuts entirely** (`Mod+Shift+R` hijacked browser hard-reload to destroy data; `Mod+Shift+E` collides in Firefox). Clear remains available as buttons.
- Clear All / Clear buttons get a toast with an **Undo** action (10 s) restoring prior contents — destructive actions become recoverable instead of confirmed.
- Remove the document-level `Alt+ArrowUp/Down` capture (steals macOS word-navigation in textareas); scope diff navigation keys to when focus is outside inputs.
- Update the shortcut tooltips/help to match reality.

### D6 — Formatter: no silent success (№11)

If trimmed input starts with `{` or `[`, auto-detect commits to JSON: run `JSON.parse`, surface its error (message + position) on failure. The generic "text" fallback is only reachable for input that doesn't look like any supported format. Acceptance: `{"a":1,` + Beautify → visible syntax error, output pane cleared.

### D7 — Small correctness fixes (№12, №13, №17, №20, №22)

- Timestamp: empty-string checks instead of falsy checks; `0` renders 1970-01-01T00:00:00.000Z.
- Base64: clear output on decode error; catch `atob` exception (no raw console error).
- Allow one-sided compares (empty vs content = all-added/all-removed); whitespace-only inputs allowed. Compare disabled only when *both* sides are empty.
- Clear All flushes the pending autosave synchronously (kills the 1 s resurrect race).
- Upload: extensionless files and dotfiles validated by content sniff instead of fake extension; UTF-16 BOM detected and decoded; empty-file NaN guard fixed (empty file loads as empty with an info toast).
- Router guards: return navigation results instead of deprecated `next()` callback (kills the 2-warnings-per-navigation noise).

### D8 — Dead code & asset cleanup

Delete: `DiffView.vue` (747 lines, unshipped) + `DiffView.spec.ts` (23 tests exercising dead code), `TheWelcome.vue`, `WelcomeItem.vue`, `components/icons/Icon*.vue` (5 files). Remove references to missing assets (`twitter-image.png`, `logo.png`, `browserconfig.xml`) from `HomeView.vue`, `seo.ts`/`useSEO.ts`, `site.webmanifest`. Fix stale `#3b82f6` theme-color in `site.webmanifest` and `seo.ts` to the real identity colors (`#F5F0E8` light / `#0a0a0a` dark, matching `App.vue`'s runtime sync).

## Testing policy

TDD per fix: failing behavior test first, then the fix. Unit tests (Vitest) for share lifecycle, formatter detection, timestamp/base64 edge cases; e2e (Playwright, chromium project) for toggles-change-output, share round-trip safety, clipboard toasts, shortcut behavior. The existing visibility-only toggle e2e assertion is replaced with an output assertion.

## Error handling

All user-facing failures surface via the existing `useToast`/`AppToast` system — no new UI primitives. No `console.error`-only paths remain for user-initiated actions.

## Risks

- D1 depends on jsdiff comparison options honoring ignore semantics without preprocessing; if library options prove insufficient for whitespace collapse, fallback is preprocess-for-compare + original-for-patch dual-track, preserving the "patch contains original text" invariant either way.
- D5's rebinds change documented shortcuts; tooltips and README updated in the same change.

## Definition of done

`npm run type-check && npm run lint && npm run test:run && npm run build` green; new behavior tests green; every №-referenced bug in scope has a test that fails on `main` and passes on this branch.
