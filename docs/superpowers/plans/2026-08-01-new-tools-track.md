# New Tools Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five demand-ranked tools (Regex Tester, JSON Explorer, Cron Parser, UUID/ULID Generator, URL Parser) as full platform citizens, with zero new dependencies and count-agnostic test suites.

**Architecture:** Each tool = one registry entry + one loader line + one component + one view wrapper + one seo.ts entry (the platform-track promise, now exercised). Engines are pure modules in `src/lib/` (cron.ts, ident.ts, urlparse.ts) or worker-isolated (regex — reusing the diff worker's supersede/terminate pattern). Every tool adopts `useToolState` + `ToolActions` + inline-error conventions from day one.

**Tech Stack:** Existing only — Vue 3.5, TS, Vitest, Playwright chromium. NO new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-01-new-tools-track-design.md`

**Code normativity note:** Interfaces, registry/SEO data strings, engine algorithms, and test matrices are normative. Author test files from the enumerated cases in the established styles (pure-lib specs like `src/lib/__tests__/fuzzy.spec.ts`; worker composable specs like `useDiffWorker.spec.ts` with FakeWorker + `vi.resetModules`; e2e in `tests/e2e/platform.spec.ts` conventions). Implementation bodies not shown are yours to write against the tests — never weaken a test; document deviations.

## Global Constraints

- Branch `feat/new-tools` in `/Users/shaurya/devyantra-ui`. Node `^20.19.0 || >=22.12.0`.
- Zero new npm dependencies.
- Gates after every task: `npm run type-check && npm run lint && npm run test:run`. Tool tasks also run their own e2e file additions + `npx playwright test tests/e2e/platform.spec.ts --project=chromium --reporter=line`.
- Every new tool: registry entry (Task data below, verbatim), loader line in `src/router/index.ts`'s `toolComponents`, view wrapper copying the `getToolSEO` pattern from `src/views/tools/CharacterCountView.vue`, `SEO_CONFIG.tools` entry, `useToolState('<slug>', ...)`, ToolActions where a result exists, inline errors for live-typing states (never toasts), labels on every input (a11y).
- New tool e2e lives in a new `tests/e2e/new-tools.spec.ts` (standard imports + clipboard permissions header, created in Task 3, appended by later tasks).
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Count-agnostic test restructure (spec D1)

**Files:** Modify `src/tools/__tests__/registry.spec.ts`, `src/components/__tests__/AppFooter.spec.ts`, `tests/e2e/command-palette.spec.ts`, `CONTRIBUTING.md`.

Make the suites derive instead of pin:
- registry.spec: "exactly 8" → `TOOLS.length >= 8` plus uniqueness over `TOOLS.length`; footer partition 4/4 → every tool's `footerGroup` is `'text' | 'encoding'` and both groups non-empty (drop exact counts).
- AppFooter parity: expected link count = `TOOLS.length` (import the registry in the spec), uniqueness derived.
- command-palette e2e: expected command count = import TOOLS? e2e can't import app TS cleanly — instead count via the registry length exposed through the DOM: assert `palette items count === (await page.locator('.palette-item').count())` equals tools+actions by computing from a page-side import? Simplest robust form: replace `toHaveCount(11)` with `expect(count).toBeGreaterThanOrEqual(11)` PLUS a dedicated parity assertion in a unit/component test (CommandPalette.spec already mounts with the real registry — add `expect(items.length).toBe(TOOLS.length + 3)` there, which stays correct automatically). Document this split (exact parity unit-side, floor e2e-side).
- CONTRIBUTING.md: delete/replace any "bump the pinned counts" caveat with "the suites derive counts from the registry".

- [ ] Steps: adjust tests (all must still pass at 8 tools) → gates + `npx playwright test tests/e2e/command-palette.spec.ts --project=chromium` → commit `test: derive tool counts from the registry (unpin for tool growth)`.

---

### Task 2: Regex worker + composable (spec D2 engine)

**Files:** Create `src/workers/regex.worker.ts`, `src/composables/useRegexWorker.ts`, `src/composables/__tests__/useRegexWorker.spec.ts`.

**Protocol (normative):**

```ts
export interface RegexRequest { id: number; pattern: string; flags: string; testString: string; replacement: string | null }
export interface RegexMatch { index: number; match: string; groups: Array<{ name: string | null; value: string | null }> }
export type RegexResponse =
  | { id: number; result: { matches: RegexMatch[]; truncated: boolean; replaced: string | null; elapsedMs: number } }
  | { id: number; error: string }   // SyntaxError message from RegExp construction
```

Worker: construct `new RegExp(pattern, flags)` (catch → error response). Match collection: manual `exec` loop on a `g`-forced copy of flags (original flags respected for the replace step), zero-length-match guard (`if (m.index === re.lastIndex) re.lastIndex++`), cap 10,000 matches → `truncated: true`. Named groups: `m.groups` merged with positional (positional entries name: null). `replaced` = `replacement !== null ? testString.replace(new RegExp(pattern, flags.includes('g') ? flags : flags), replacement) : null` — replace uses the ORIGINAL flags (no forcing; single-replace without g is correct behavior).

**Composable (mirror `useDiffWorker`'s shape — read it first):** `useRegexWorker(): { state: Ref<'idle'|'computing'|'done'|'error'|'timeout'>, result, errorDetail, run(req omitting id), cancel(), usingFallback }`. Supersede by id; **2,000ms timeout**: timer started per run; on fire → `worker.terminate()`, worker = null (fresh construction next run), state 'timeout'. `onScopeDispose` → terminate + clear timer (the I4 lesson). Fallback when Worker construction throws: synchronous run WITHOUT timeout protection (document inline: degraded mode for non-worker environments).

**Test matrix (FakeWorker + fake-timer style of useDiffWorker.spec):** simple match with positional groups; named groups (`(?<year>\d{4})`) surface name+value; zero-length pattern `a*` on `'bb'` terminates with finite matches; invalid pattern → state error with the SyntaxError text; supersede (two runs, second wins); timeout (FakeWorker that never responds + `vi.advanceTimersByTime(2000)` → state 'timeout' AND a new Worker constructed on the next run — constructor counter); replacement `$<name>` works; fallback path (throwing Worker → sync result, usingFallback true).

- [ ] Steps: tests → fail → implement → green → gates → commit `feat(tools): ReDoS-safe regex worker with supersede, timeout, respawn`.

---

### Task 3: Regex Tester tool (spec D2 UI)

**Files:** Create `src/components/RegexTester.vue`, `src/views/tools/RegexTesterView.vue`, `tests/e2e/new-tools.spec.ts`; modify `src/tools/registry.ts`, `src/router/index.ts` (loader), `src/config/seo.ts`.

**Registry entry (verbatim):** slug `regex-tester`, name/shortName `Regex Tester`, description `Test & debug patterns`, icon `pi pi-asterisk`, category `Code`, footerGroup `text`, seoKey `regex-tester`, toolCategory `Code Testing`, sitemapPriority `0.9`, metaTitle `Regex Tester Online - Live Match Highlighting | DEVYANTRA`, metaDescription `Test regular expressions online with live match highlighting, named groups, and replace preview. ReDoS-safe: patterns run in a worker and can never freeze your browser.`, metaKeywords `regex tester, regular expression tester, regex online, regex match, regex replace, redos safe regex`.

**SEO_CONFIG.tools['regex-tester'] (author with this content):** name `Regex Tester`; description = metaDescription; category `Code Testing`; features: live match highlighting with group capture table; replace preview with $1 and $<name> support; g/i/m/s/u/y flag toggles; curated common-pattern library; worker-isolated execution that can never freeze the page. FAQs (3): "Why did my pattern time out?" (catastrophic backtracking explanation, 2-second worker budget, tab stays responsive); "Does my text leave the browser?" (no — worker in your tab, zero egress); "Which regex dialect is this?" (JavaScript RegExp — named groups, lookbehind per your browser). HowTo (4 steps): enter pattern, toggle flags, paste test text, read matches/replace preview.

**Component contract:** pattern input (label 'Pattern', inline `.field-error` under it for SyntaxError text from state error); flag checkboxes g i m s u y (g default ON); test textarea (label 'Test string'); 250ms debounced `run()` on any change; results when state done: highlight pane (model-driven spans over testString from `matches[].index/length` — class `rx-hl` alternating `rx-hl--a/b`, no v-html), matches table (# / match / named+positional groups, `<th scope="col">`), count+`elapsedMs` chip, truncated banner when true; timeout state → `.rx-timeout` message "Pattern timed out after 2 s — likely catastrophic backtracking. Edit the pattern to try again." (pattern stays editable — proven by e2e); replace mode: toggle reveals replacement input + preview pane + ToolActions copy of replaced text. Pattern library `<select>` (options exactly: Email, URL, UUID, ISO date, IPv4, Semver, Slug — pragmatic patterns, each option title-attribute carries the caveat) inserting into the pattern field. Persist `{ pattern, flags, testString }` (flags as string via computed ref). ToolActions: copy matches as JSON; clear-with-undo.

**E2E (create tests/e2e/new-tools.spec.ts):** happy path (pattern `(?<word>w\w+)` flags gi, text 'Hello World Wide Web' → 3 highlighted matches, groups table shows named group); persistence reload; **the ReDoS test**: pattern `(a+)+$` against `'a'.repeat(40) + 'b'` → within ~2.5s the timeout message appears AND a click on the flags checkbox succeeds during/after (responsiveness proof), then editing the pattern to `a+` recovers to done-state matches.

- [ ] Steps: e2e RED → implement (registry/seo/view/component/loader) → GREEN → gates + platform.spec still green (registry parity) → commit `feat(tools): regex tester — worker-isolated, ReDoS-safe`.

---

### Task 4: JSON Explorer (spec D3, complete tool)

**Files:** Create `src/lib/jsonModel.ts` (+spec), `src/components/JsonExplorer.vue`, `src/components/diff/…`-style child `src/components/JsonTreeNode.vue`, `src/views/tools/JsonExplorerView.vue`; registry/loader/seo entries; e2e append.

**Registry (verbatim):** slug `json-explorer`, name `JSON Explorer`, description `Tree view & JSON paths`, icon `pi pi-sitemap`, category `Code`, footerGroup `text`, seoKey `json-explorer`, toolCategory `Data Inspection`, sitemapPriority `0.9`, metaTitle `JSON Explorer - Tree Viewer & Path Finder | DEVYANTRA`, metaDescription `Explore JSON as a collapsible tree with click-to-copy JSON paths, search, and structure stats. Free, private, and entirely in your browser.`, metaKeywords `json viewer, json tree viewer, json explorer, json path finder, json parser online`.

**SEO entry:** features: collapsible tree with type badges; click any key to copy its JSON path; search that expands matches; structure stats (keys, depth, size); 2 MB published limit. FAQs: "How do I get the path to a value?" / "Why is there a 2 MB limit?" (kept snappy + synchronous; larger payloads belong in an editor) / "Is my JSON uploaded anywhere?" (no). HowTo: paste JSON, expand nodes, click a key to copy its path, search to jump.

**jsonModel.ts (normative):** `parseJsonModel(input: string): { root: JsonNode } | { error: { message: string; position: number | null } }` where `JsonNode = { key: string | null; path: string; type: 'object'|'array'|'string'|'number'|'boolean'|'null'; children?: JsonNode[]; preview: string; size: number }`; paths in `$.a.b[3]` form (bracket form `$["weird key"]` when key isn't a valid identifier); input > 2 MB (TextEncoder bytes) → error "Input is X MB; the limit is 2 MB". Unit matrix: nested paths incl. bracket-escaped keys, array indices, previews (string truncation at 40 chars + ellipsis, object `{3 keys}`, array `[5 items]`), stats derivable (walk count/depth), position from JSON.parse error when extractable (regex on the message; null otherwise), limit rejection.

**Component:** textarea input (persist `{ input }`); parse on 300ms debounce; tree rendered by recursive `JsonTreeNode` (expand/collapse buttons `aria-expanded`, default expanded depth ≤ 2); key click → `copyWithFeedback(path, 'Path')`; hover title = path; search box filters (expand ancestors of matches, `.jx-match` highlight class, case-insensitive substring over keys+string values); stats bar (keys / max depth / bytes); inline error with position. ToolActions: copy formatted JSON (2-space stringify of the parsed value); clear-with-undo.

**E2E:** paste `{"users":[{"name":"Ada"},{"name":"Lin"}]}` → tree shows users[1].name; clicking the `name` key under index 1 puts `$.users[1].name` on the clipboard; search 'Lin' highlights; 3 MB input shows the limit message; persistence reload.

- [ ] Steps: engine spec → fail → engine → component+registration → e2e GREEN → gates → commit `feat(tools): JSON explorer with copyable paths`.

---

### Task 5: Cron engine (spec D4 core)

**Files:** Create `src/lib/cron.ts`, `src/lib/__tests__/cron.spec.ts`.

**Interface (normative):**

```ts
export class CronError extends Error { field: string | null }
export interface ParsedCron {
  minute: Set<number>; hour: Set<number>; dom: Set<number>; month: Set<number>; dow: Set<number>
  domRestricted: boolean; dowRestricted: boolean
}
export function parseCron(expr: string): ParsedCron
export function describeCron(expr: string): string
export function nextRuns(expr: string, from: Date, count: number): Date[]
```

Grammar: exactly 5 whitespace-separated fields (else CronError `Expected 5 fields, got N. Six- and seven-field variants (seconds/years) aren't supported.`); per field: comma list of items; item = `*`, `*/step`, `value`, `value-value`, `value-value/step`; names JAN-DEC (months), SUN-SAT (dow), case-insensitive; dow 7 ≡ 0. Bounds enforced with field-named errors. `domRestricted`/`dowRestricted` = raw field ≠ `*` (a `*/2` IS restricted).

`nextRuns`: start at the next whole minute after `from`; iterate minutes (skip-ahead optimizations allowed); a minute matches when minute/hour/month sets contain it AND day matches: if both dom+dow restricted → dom-match OR dow-match (the classic vixie rule); else each restricted field must match. Bound: 4 years of minutes → CronError `No matching times in the next 4 years`. Local wall-clock via the Date API (DST semantics follow Date — documented).

`describeCron`: deterministic template composition. Pin EXACTLY five canonical outputs in tests: `30 9 * * 1-5` → `At 09:30, Monday through Friday`; `*/15 * * * *` → `Every 15 minutes`; `0 0 1 * *` → `At 00:00, on day 1 of the month`; `0 12 * JAN,JUL *` → `At 12:00, in January and July`; `45 23 * * SUN` → `At 23:45, on Sunday`. All other expressions: assert key substrings only (e.g. contains `09:30`).

**Test matrix additionally:** parse matrix (lists/ranges/steps/names/7≡0/bounds errors with field names/6-field rejection); nextRuns: `30 9 * * 1-5` from a known Friday 10:00 → next is Monday 09:30 (construct dates explicitly); `*/15` sequence spacing 900s; **the vixie OR rule**: `0 0 13 * FRI` from a fixed date → next runs include BOTH the 13th (any weekday) and every Friday — assert the first 5 against hand-computed dates; `0 0 31 2 *` → CronError (no Feb 31); leap year `0 0 29 2 *` from 2026-03-01 → next is 2028-02-29; count honored (exactly N ascending unique minutes).

- [ ] Steps: spec → fail → implement → green → gates → commit `feat(tools): cron engine — parse, describe, next-runs with the vixie DOM/DOW rule`.

---

### Task 6: Cron Parser tool (spec D4 UI)

**Files:** Create `src/components/CronParser.vue`, `src/views/tools/CronParserView.vue`; registry/loader/seo; e2e append.

**Registry (verbatim):** slug `cron-parser`, name `Cron Parser`, description `Explain & preview schedules`, icon `pi pi-stopwatch`, category `Time`, footerGroup `encoding`, seoKey `cron-parser`, toolCategory `Date & Time`, sitemapPriority `0.9`, metaTitle `Cron Expression Parser - Next Runs & Plain English | DEVYANTRA`, metaDescription `Parse cron expressions into plain English and preview the next 10 run times in local time and UTC. Supports ranges, steps, lists, and day names.`, metaKeywords `cron parser, cron expression, crontab explained, next cron run, cron schedule`.

**SEO entry:** features: plain-English description; next 10 runs local+UTC; per-field breakdown table; presets; 5-field standard syntax with names/ranges/steps. FAQs: "Why isn't my 6-field expression accepted?" (seconds-field variants are non-standard; named limitation); "Which timezone are the run times in?" (your local timezone, with UTC alongside; DST follows your system clock); "What does the day-of-month/day-of-week OR rule mean?" (when both are restricted, either matches — vixie cron behavior). HowTo: type or pick a preset, read the description, check the next runs.

**Component:** expression input (mono, persist `{ expression }`, default `30 9 * * 1-5`); presets select (Hourly `0 * * * *`, Daily at midnight `0 0 * * *`, Weekdays 9am `0 9 * * 1-5`, Monthly 1st `0 0 1 * *`, Every 15 min `*/15 * * * *`); 300ms debounce → description line, next-10 table (Local | UTC | relative via the existing relative-time helper if importable, else omit relative), per-field breakdown (field / raw / resolved-count or list ≤10 values); CronError → inline `.field-error` with the message. ToolActions: copy the next-runs table as text; clear-with-undo.

**E2E:** default expression renders `At 09:30, Monday through Friday` + 10 rows; preset switch updates; `1 2 3` shows the 5-field error inline; `0 0 31 2 *` shows the no-match error; persistence reload.

- [ ] Steps: e2e RED → implement → GREEN → gates + platform.spec → commit `feat(tools): cron parser with next-run preview`.

---

### Task 7: ident engine + UUID/ULID tool (spec D5)

**Files:** Create `src/lib/ident.ts` (+spec), `src/components/UuidGenerator.vue`, `src/views/tools/UuidGeneratorView.vue`; registry/loader/seo; e2e append.

**ident.ts (normative):**

```ts
export function uuidV4(): string                       // crypto.randomUUID()
export function uuidV7(now?: number): string           // RFC 9562
export function ulid(now?: number): string             // Crockford base32, monotonic within same ms
export interface IdentInfo { kind: 'uuid' | 'ulid' | 'unknown'; version?: number; variant?: string; timestamp?: Date }
export function inspect(id: string): IdentInfo
```

uuidV7 byte layout (16 bytes → hex with dashes): bytes 0-5 = unix-ms big-endian; byte 6 = `0x70 | (rand & 0x0f)`; byte 7 = rand; byte 8 = `0x80 | (rand & 0x3f)`; bytes 9-15 = rand (crypto.getRandomValues). ulid: 48-bit time → 10 Crockford chars (alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`), 80-bit random → 16 chars; monotonicity: module-level `lastMs/lastRandom` — same-ms call increments the 80-bit value by 1 (carry). inspect: UUID regex → version = hex digit 13, variant from digit 17 (`8/9/a/b` → 'RFC 4122'); v7 → timestamp from first 12 hex digits; v1 timestamp deliberately NOT decoded (report version only); ULID regex (26 Crockford chars) → timestamp from first 10; else unknown.

**Test matrix:** v4/v7 format regexes; v7 version nibble `7` + variant `[89ab]` + `inspect(uuidV7(T)).timestamp.getTime() === T`; ULID alphabet excludes I L O U; same-ms ULIDs strictly increasing lexicographically (loop 50 with fixed `now`); carry case (force lastRandom = all-max via generating until… instead: export internal `__setLastForTest` guarded test hook? NO — test carry by calling `ulid(T)` repeatedly and asserting strict increase only; drop the explicit carry pin); inspect: v4 no timestamp, garbage/empty → unknown, case-insensitive UUID accept, ULID accepts lowercase input by uppercasing.

**Registry (verbatim):** slug `uuid-generator`, name `UUID Generator`, shortName `UUID / ULID`, description `Generate & inspect IDs`, icon `pi pi-id-card`, category `Security`, footerGroup `encoding`, seoKey `uuid-generator`, toolCategory `Identifiers`, sitemapPriority `0.9`, metaTitle `UUID & ULID Generator - v4, v7, Inspector | DEVYANTRA`, metaDescription `Generate UUID v4, timestamp-ordered UUID v7, and ULIDs in bulk — and inspect any identifier to reveal its version, variant, and embedded timestamp.`, metaKeywords `uuid generator, uuid v4, uuid v7, ulid generator, guid generator, uuid decoder`.

**SEO entry:** features (bulk generation 1-100; v4/v7/ULID; timestamp extraction; uppercase toggle; copy all). FAQs: "What's the difference between UUID v4 and v7?" / "What is a ULID?" / "Are these IDs generated securely?" (crypto.getRandomValues, in your browser). HowTo: pick a kind, set count, generate, copy.

**Component:** kind radio (UUID v4 default / UUID v7 / ULID), count number input 1-100, uppercase toggle (auto-switches default per kind: ULID→on, UUID→off, user override sticks for the session), Generate button → `<ol>` mono list; ToolActions copy-all (newline-joined) + regenerate as the sample slot? No — regenerate is the primary button; ToolActions carries copy + clear. Inspect section: input + result card (kind/version/variant/timestamp ISO + relative). Persist `{ kind, count, uppercase }` — never generated values.

**E2E:** generate 5 v7 → 5 rows matching the UUID regex; inspect the first row → shows version 7 + a timestamp within the last minute; ULID mode + uppercase produces 26-char Crockford rows; persistence of kind/count on reload (values regenerate fresh).

- [ ] Steps: engine spec → fail → engine → tool → e2e GREEN → gates → commit `feat(tools): UUID/ULID generator with inspector`.

---

### Task 8: urlparse engine + URL Parser tool (spec D6)

**Files:** Create `src/lib/urlparse.ts` (+spec), `src/components/UrlParser.vue`, `src/views/tools/UrlParserView.vue`; registry/loader/seo; e2e append.

**urlparse.ts (normative):**

```ts
export interface UrlParam { key: string; value: string }
export interface ParsedUrl { scheme: string; host: string; port: string; path: string; hash: string; params: UrlParam[]; hostUnicode: string | null }
export function parseUrl(input: string, base?: string): ParsedUrl          // throws TypeError from URL on invalid
export function buildUrl(p: ParsedUrl): string
```

Params via URLSearchParams iteration (order + repeats preserved; `+` decodes as space — policy pinned); buildUrl reassembles with URLSearchParams (so `+`→`%20` normalization is expected and pinned in a test as documented round-trip behavior); `hostUnicode`: when host contains `xn--`, decode via `new URL` trick unavailable — implement punycode display as: keep null unless `host !== host normalized`… simplest honest approach: `hostUnicode = null` always EXCEPT when the INPUT contained non-ASCII (compare input host chars) — then input-form is the unicode form, URL.host is punycode: store the input's authority substring. Pin with test `parseUrl('https://bücher.example/x')` → host `xn--bcher-kva.example`, hostUnicode `bücher.example`. Port: as URL gives it (default ports elide — pinned). Test matrix additionally: repeated keys ordered; empty values; hash+query together; base resolution (`parseUrl('/a?b=1', 'https://x.dev')`); invalid → throws; build(parse(u)) idempotent for a normalized fixture set.

**Registry (verbatim):** slug `url-parser`, name `URL Parser`, description `Decompose & edit URLs`, icon `pi pi-link`, category `Encoding`, footerGroup `encoding`, seoKey `url-parser`, toolCategory `Encoding`, sitemapPriority `0.9`, metaTitle `URL Parser & Query String Editor | DEVYANTRA`, metaDescription `Break any URL into scheme, host, path, and an editable query-parameter table that rebuilds the URL live. Encode or decode components instantly.`, metaKeywords `url parser, query string parser, url decoder, url encoder, parse url online, query params editor`.

**SEO entry:** features (component table; editable param grid with live rebuild; repeated-key support; encode/decode helpers; base-URL resolution for relative inputs). FAQs: "Why did my + turn into %20?" (both mean space; the rebuilt URL uses the unambiguous form); "Can I edit query parameters?" (yes — table edits rebuild live); "Does this handle international domains?" (punycode + unicode shown together). HowTo: paste URL, read the parts, edit params, copy the rebuilt URL.

**Component:** URL input + optional base input (revealed when input is relative and parse failed with base empty — hint text); component table (scheme/host/port/path/hash — host row shows unicode alongside when present); param grid: rows key/value inputs + delete button + trailing add row; edits → rebuild via buildUrl → rebuilt-URL readonly field with ToolActions copy; encode/decode helper: one textarea + Encode/Decode buttons (encodeURIComponent/decodeURIComponent, decode failures inline). Inline error for invalid URL. Persist `{ input }`.

**E2E:** paste `https://example.com/search?q=hello+world&tag=a&tag=b#top` → table shows q `hello world`, two tag rows, hash `top`; edit q to `bye`, rebuilt URL contains `q=bye` and both tags; delete a tag row → rebuilt drops it; invalid `ht!tp:/x` → inline error; persistence reload.

- [ ] Steps: engine spec → fail → engine → tool → e2e GREEN → gates → commit `feat(tools): URL parser with live query editor`.

---

### Task 9: Full sweep + docs

**Files:** `README.md`, `CHANGELOG.md`.

- [ ] Step 1: full gates; full chromium e2e; PWA e2e (`npm run build && npx playwright test --config playwright.pwa.config.ts`); `npm run build:seo` → sitemap 15 URLs, prerender 15/15; zero-egress recorder still green (new tools make no network calls — platform.spec capstone). Triage per the established rule.
- [ ] Step 2: README Features gains the five tools (one bullet each, matching the existing checklist style); CHANGELOG [Unreleased] Added lists the five with one-line descriptions (regex bullet mentions the worker-isolation differentiator).
- [ ] Step 3: commit `docs: changelog + readme for the new tools track`.

---

## Plan Self-Review (completed)

- **Spec coverage:** D1→T1; D2→T2+T3; D3→T4; D4→T5+T6; D5→T7; D6→T8; D7 woven through every tool task (registry/seo/view/persist/actions/a11y contract in Global Constraints); testing section→T9. No gaps.
- **Placeholder scan:** all registry/SEO strings authored verbatim; engine algorithms bit-level where risky (v7 layout, vixie rule, zero-length guard); the one dropped test (ULID carry pin) is replaced by the strict-increase loop with rationale inline. No TBDs.
- **Type consistency:** worker protocol types in T2 match T3's state usage; ParsedCron in T5 matches T6's consumption via the three exported functions; ident/urlparse interfaces match their tools' bindings; new-tools.spec.ts created in T3 and appended by T4/T6/T7/T8.
- **Sequencing:** T1 first so every tool task lands against derive-not-pin suites; engines precede their UIs (T5→T6); T3 creates the shared e2e file.
