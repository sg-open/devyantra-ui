# New Tools Track — Design

**Date:** 2026-08-01
**Scope:** Sub-project 4 of 5. Five demand-ranked tools, each a full citizen of the platform from day one (registry entry, useToolState persistence, ToolActions, SEO content, tests). This is also the proving run for the registry's "one entry + one component" promise — the count-pinning specs (registry 8-count, footer 4/4 partition, palette 11-command) get restructured once, properly, in the first task.

**The demand case (from the verified research):** a regex tester is the single largest gap (regex101 alone draws ~0.6–1.1M visits/month); JSON tooling is table stakes; cron/UUID/URL are high-frequency dev chores with weak incumbent UX.

**Out of scope:** WASM heavies (SQLite/image/media — sub-project 5 territory), tool chaining, smart paste.

## Goals

1. Five new tools shipped: **Regex Tester, JSON Explorer, Cron Parser, UUID/ULID Generator, URL Parser**.
2. Zero new dependencies — every engine is hand-rolled or platform-API-based.
3. The regex tester must be unfreezeable: pathological patterns (ReDoS) run in a worker with a timeout, never on the main thread. "Never hangs your tab" is the differentiator over every incumbent.
4. Registry scalability debt paid: adding tool #9 must not require editing eight test files.

## Design decisions

### D1 — Count-pinning test restructure (first task, one-time)

The platform track deliberately pinned counts (registry "exactly 8", footer "4/4", palette "11"). Restructure before adding tools: registry spec asserts uniqueness/shape invariants over `TOOLS.length` rather than literals, plus `TOOLS.length >= 8`; footer parity asserts every `footerGroup` renders all its members (derived, not 4/4); palette e2e derives expected count from `TOOLS.length + ACTION_COUNT`. CONTRIBUTING's "bump the pinned counts" caveat (flagged in the last review) then deletes itself — update it.

### D2 — Regex Tester (`/tools/regex-tester`, category Code, footerGroup text)

The flagship of this track.

- **Layout:** pattern input (with flag toggles g/i/m/s/u/y as checkboxes), test-string textarea, live results. Persist `{ pattern, flags, testString }` via useToolState.
- **Execution model:** every evaluation runs in a dedicated worker (`src/workers/regex.worker.ts`) reusing the diff worker's protocol shape (id, supersede, 2s timeout → "Pattern timed out — likely catastrophic backtracking" state with the offending pattern kept editable). Main thread never runs user regexes. Debounce 250ms.
- **Results:** (a) test string rendered with match highlights (alternating tint for adjacent matches, model-driven spans — same no-v-html discipline as DiffRows); (b) a matches table: index, full match, per-group values with group names when present; (c) match count + timing chip.
- **Replace mode:** replacement-string input with `$1`/`$<name>` support; live preview pane; copy result via ToolActions.
- **Library:** a small curated pattern list (email, URL, UUID, ISO date, IPv4, semver, slug — each with a one-line caveat like "pragmatic, not RFC-complete") inserted via a dropdown; NOT a regex-explainer (out of scope, honest about it).
- **Errors:** invalid pattern → the browser's SyntaxError message displayed inline under the pattern input (never a toast for a live-typing state).
- **Worker protocol result:** `{ matches: Array<{ index: number; match: string; groups: Array<{ name: string | null; value: string | null }> }>, replaced: string | null, elapsedMs: number } | { error: string } | { timeout: true }`.

### D3 — JSON Explorer (`/tools/json-explorer`, category Code, footerGroup text)

Complements (not replaces) the formatter: paste JSON → collapsible tree.

- Tree nodes: key, type badge, value preview; expand/collapse (default: depth 2 expanded); arrays show length, objects show key count. Rendered from a parsed model (recursive component), virtualization NOT needed (cap: parse rejects inputs > 2MB with the published-limit message pattern; typical JSON explorer usage is small payloads).
- Node interactions: click a key → its **JSON path** (`$.users[3].email`) copies via useClipboard; hover shows the path.
- Stats bar: total keys, max depth, size in bytes.
- Search: substring filter that expands and highlights matching keys/values (simple, synchronous — the 2MB cap keeps it safe).
- Invalid JSON → same inline-error presentation as the formatter (position + message). Persist `{ input }`.

### D4 — Cron Parser (`/tools/cron-parser`, category Time, footerGroup encoding)

- Input: standard 5-field cron (minute hour day-of-month month day-of-week); support lists, ranges, steps, names (JAN-DEC/SUN-SAT), `*`. Explicitly reject 6/7-field (seconds/year) variants with a clear message naming the limitation — honesty over silent misparse.
- Output: (a) a human-readable description assembled from parsed fields ("At 09:30 on Monday through Friday in March"); (b) the **next 10 run times** in local time + UTC (hand-rolled iterator: minute-resolution scan bounded to 4 years with the standard DOM/DOW OR-semantics rule when both are restricted — the classic cron subtlety, unit-tested explicitly); (c) per-field breakdown table.
- Presets dropdown (hourly, daily midnight, weekdays 9am, monthly 1st, every 15 min). Persist `{ expression }`.
- Engine is a pure module `src/lib/cron.ts` — exhaustively unit-tested (field parsing matrix, DOM/DOW OR rule, month lengths/leap years, DST boundaries documented as local-time-iterator behavior).

### D5 — UUID / ULID Generator (`/tools/uuid-generator`, category Security, footerGroup encoding)

- Generate: UUID v4 (`crypto.randomUUID`), UUID v7 (timestamp-ordered, hand-rolled per RFC 9562 using crypto.getRandomValues), ULID (hand-rolled, Crockford base32, monotonic within-ms increment). Count selector 1–100, one per line, uppercase toggle (ULID default upper, UUID lower).
- **Inspect mode:** paste any UUID/ULID → version/variant detection; for v7/ULID extract and display the embedded timestamp (ISO + relative).
- Copy-all via ToolActions; regenerate button. Persist `{ kind, count, uppercase }` (never the generated values — they're meant to be fresh).
- Engines in `src/lib/ident.ts`, unit-tested (format regexes, v7 timestamp round-trip, ULID monotonicity, inspect edge cases).

### D6 — URL Parser (`/tools/url-parser`, category Encoding, footerGroup encoding)

- Paste a URL → decomposed table: scheme, host, port, path, hash, plus a **query-param table** (decoded keys/values, repeated keys shown as rows) with per-row edit/delete/add — edits rebuild the URL live (two-way via the URL API).
- Encode/decode helpers: encodeURIComponent/decodeURIComponent text boxes (the perennial chore).
- Malformed URL → inline error; relative URLs resolved against a base-URL input (optional field, default empty = require absolute).
- Copy rebuilt URL via ToolActions. Persist `{ input }`. Logic in `src/lib/urlparse.ts` (thin over the URL API; unit tests cover repeated params, plus-vs-%20 display policy — display decoded-with-%20, edit round-trips exactly, IDN hosts shown as punycode with the unicode form alongside).

### D7 — Shared integration contract (every tool)

Registry entry (with real metaTitle/description/keywords authored per tool — SEO strings written in this spec's plan, not improvised), `toolComponents` loader line, `src/config/seo.ts` entry (features/FAQs/HowTo — 3 FAQs each, authored in the plan), View wrapper (getToolSEO pattern), useToolState, ToolActions where a result exists, e2e per tool (functional happy path + persistence + one edge case), a11y pass (labels on all inputs, tables with proper headers). Tab bar: 13 tools will crowd it — the platform's seg-track already scrolls horizontally; acceptable for this sub-project, with a note that the landing/dashboard redesign belongs to a later track (do NOT redesign navigation here).

## Error handling

Live-typing tools (regex, JSON, cron, URL) show inline errors under the input, never toasts; action failures (copy) keep the toast pattern. Worker timeout state is recoverable by editing the pattern.

## Testing

- Pure engines (cron.ts, ident.ts, urlparse.ts, regex worker protocol) carry the bulk: exhaustive unit matrices as listed per decision.
- Per-tool e2e: happy path, persistence reload, one hostile input (ReDoS pattern times out without hanging — assert the timeout message appears AND the page stays responsive via a click during evaluation; 6-field cron rejected; 3MB JSON rejected with the limit message; malformed URL inline error).
- Registry drift/parity suites keep passing with 13 tools (D1 makes them count-agnostic).
- Full sweep + build:seo (sitemap grows to 15 URLs: 13 tools + feedback + privacy).

## Risks

- Cron next-run correctness across DST: the iterator works in local wall-clock time via the Date API; DST-skipped/repeated times follow Date semantics — documented in the tool's FAQ rather than fought.
- Regex worker timeout can't abort a hung `RegExp.exec` mid-flight (JS has no preemption) — the worker is terminated and respawned on timeout (the diff worker's cancel-terminate pattern, verified there).
- Five tools is the largest single-track surface so far; the per-tool tasks are independent by design so a stall on one never blocks the others.

## Definition of done

Gates + full chromium e2e + PWA e2e green; sitemap 15 URLs, prerender 15/15; every new tool passes the zero-egress recorder (no new network paths); README/CHANGELOG updated; the drift test proves each tool is registered on every surface.
