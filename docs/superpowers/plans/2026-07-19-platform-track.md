# Platform Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One tool registry driving every surface, a universal capability layer for all tools, fuzzy+recents command palette, a real offline PWA, and provable zero-egress privacy.

**Architecture:** `src/tools/registry.ts` is pure data imported by the app AND `vite.config.ts`; router/tabs/palette/footer/sitemap derive from it and prerender derives from the generated sitemap. `useToolState` generalizes the fix-pack persistence lessons for all tools. vite-plugin-pwa (the one new dependency, user-approved) provides the service worker; Formspree and Google Fonts egress are removed.

**Tech Stack:** Vue 3.5, TypeScript, vite-plugin-pwa (new devDependency), resvg (existing) for icons, Vitest, Playwright chromium.

**Spec:** `docs/superpowers/specs/2026-07-19-platform-track-design.md`
**Spec amendment (recorded here):** `footerGroup` values are `'text' | 'encoding'` matching the shipped footer headings ("Text Tools" / "Encoding & Security"), not the spec's placeholder `'tools' | 'utilities'`. Registry also carries verbatim `metaTitle/metaDescription/metaKeywords` from today's router metas so SEO output is byte-preserved.

**Code normativity note:** Interfaces, registry data, and test files are normative. Implementation bodies are strong drafts — fix against tests, never weaken a test, document deviations.

## Global Constraints

- Branch `feat/platform-track` in `/Users/shaurya/devyantra-ui`. Node `^20.19.0 || >=22.12.0`.
- New dependencies allowed: ONLY `vite-plugin-pwa` (devDependency, Task 13). Nothing else.
- Gates after every task: `npm run type-check && npm run lint && npm run test:run`. Targeted e2e: `npx playwright test tests/e2e/correctness-fixes.spec.ts tests/e2e/text-compare.spec.ts --project=chromium --reporter=line` after tasks touching shared surfaces; task-specific e2e as listed.
- SEO invariant: per-route `<title>`/description/canonical/sitemap URLs must be byte-identical to today's output (registry carries the verbatim strings).
- Icon canon (resolves today's divergence; HomeView's icons win): text-compare `pi pi-arrows-alt`, delimiter `pi pi-arrows-h`, format-text `pi pi-file-edit`, jwt-decoder `pi pi-shield`, hash-generator `pi pi-lock`, base64-tools `pi pi-arrow-right-arrow-left`, timestamp-converter `pi pi-clock`, character-count `pi pi-hashtag`.
- localStorage keys: `devyantra:<slug>:state` (tool state), `devyantra:palette:recents`.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: The registry (spec D1 data)

**Files:**
- Create: `src/tools/registry.ts`
- Test: `src/tools/__tests__/registry.spec.ts`

**Interfaces (Produces — every later task imports these):**

```ts
export interface ToolDef {
  slug: string
  name: string
  shortName: string
  description: string          // palette subtitle / short marketing line
  icon: string                 // 'pi pi-*'
  category: 'Text' | 'Code' | 'Encoding' | 'Security' | 'Time'
  keywords: string[]
  seoKey: string
  footerGroup: 'text' | 'encoding'
  metaTitle: string            // verbatim from today's router meta
  metaDescription: string      // verbatim
  metaKeywords: string         // verbatim
  toolCategory: string         // verbatim router meta toolCategory
  sitemapPriority: string      // '1.0' | '0.9'
}
export interface PageDef {
  slug: string                 // 'feedback' | 'privacy'
  path: string                 // '/feedback' | '/privacy'
  name: string
  metaTitle: string
  metaDescription: string
  sitemapPriority: string
  changefreq: string
}
export const TOOLS: readonly ToolDef[]
export const PAGES: readonly PageDef[]
export const toolPath = (t: ToolDef) => `/tools/${t.slug}`
```

Data (normative): 8 ToolDefs in TODAY'S HomeView tab order (text-compare, delimiter, format-text, jwt-decoder, hash-generator, base64-tools, timestamp-converter, character-count). `name` from HomeView titles ('Text Compare', 'Delimiter', 'Code Formatter', 'JWT Decoder', 'Hash Generator', 'Base64 Tools', 'Timestamp', 'Character Count'); `shortName` same as name; `description` from the palette descriptions ('Compare & diff text', 'Split & join text', 'JSON, SQL & more', 'Decode & inspect tokens', 'MD5, SHA1, SHA256', 'Encode & decode', 'Unix & ISO converter', 'Text analytics'); icons per the Global Constraints canon; `metaTitle/metaDescription/metaKeywords/toolCategory` copied VERBATIM from `src/router/index.ts`'s current `toolRoutes` metas (read the file; the eight blocks at lines ~6–119); `seoKey`: the keys used by `getToolSEO` in the eight `src/views/tools/*View.vue` files (read one to confirm the key format, then all eight — they match route names); categories: Text (text-compare, delimiter, character-count), Code (format-text), Security (jwt-decoder, hash-generator), Encoding (base64-tools), Time (timestamp-converter); footerGroup: text (text-compare, format-text, delimiter, character-count), encoding (hash-generator, base64-tools, jwt-decoder, timestamp-converter); sitemapPriority '1.0' for text-compare else '0.9'. PAGES: feedback ('/feedback', 'Feedback', verbatim current router meta title/description, '0.3', 'yearly') and privacy ('/privacy', 'Privacy', metaTitle 'Privacy - Nothing Leaves Your Browser | DEVYANTRA', metaDescription 'DevYantra runs entirely in your browser: no backend, no telemetry, no third-party requests. Verify it yourself in devtools.', '0.3', 'yearly').

- [ ] **Step 1: Failing tests** — `src/tools/__tests__/registry.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { TOOLS, PAGES, toolPath } from '../registry'
import { SEO_CONFIG } from '@/config/seo'

describe('tool registry invariants', () => {
  it('has exactly 8 tools with unique slugs and paths', () => {
    expect(TOOLS).toHaveLength(8)
    expect(new Set(TOOLS.map(t => t.slug)).size).toBe(8)
    expect(new Set(TOOLS.map(toolPath)).size).toBe(8)
  })

  it('every seoKey resolves in SEO_CONFIG.tools', () => {
    for (const t of TOOLS) {
      expect(SEO_CONFIG.tools[t.seoKey as keyof typeof SEO_CONFIG.tools], t.seoKey).toBeDefined()
    }
  })

  it('every icon is a PrimeIcons class', () => {
    for (const t of TOOLS) expect(t.icon).toMatch(/^pi pi-[a-z-]+$/)
  })

  it('meta strings are non-empty and titles carry the site suffix', () => {
    for (const t of TOOLS) {
      expect(t.metaTitle).toContain('| DEVYANTRA')
      expect(t.metaDescription.length).toBeGreaterThan(50)
      expect(t.metaKeywords.length).toBeGreaterThan(10)
    }
  })

  it('footer groups partition all tools 4/4', () => {
    expect(TOOLS.filter(t => t.footerGroup === 'text')).toHaveLength(4)
    expect(TOOLS.filter(t => t.footerGroup === 'encoding')).toHaveLength(4)
  })

  it('pages include feedback and privacy', () => {
    expect(PAGES.map(p => p.slug).sort()).toEqual(['feedback', 'privacy'])
  })

  it('module is pure data (no vue imports)', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('../registry.ts', import.meta.url), 'utf8'))
    expect(src).not.toMatch(/from ['"]vue/)
    expect(src).not.toMatch(/import\.meta\.env/)
  })
})
```

- [ ] **Step 2:** run → FAIL. **Step 3:** implement the registry with the data above (copy meta strings verbatim from router — do not paraphrase). **Step 4:** PASS. **Step 5:** Gates + commit `feat(platform): central tool registry`.

---

### Task 2: Router from the registry

**Files:**
- Modify: `src/router/index.ts`
- Test: `src/tools/__tests__/registry-drift.spec.ts` (create)

Replace the hand-written `toolRoutes` array with generation:

```ts
import { TOOLS, PAGES, toolPath } from '@/tools/registry'

const toolComponents: Record<string, () => Promise<unknown>> = {
  'text-compare': () => import('../views/tools/TextCompareView.vue'),
  'delimiter': () => import('../views/tools/DelimiterView.vue'),
  'format-text': () => import('../views/tools/FormatTextView.vue'),
  'jwt-decoder': () => import('../views/tools/JwtDecoderView.vue'),
  'hash-generator': () => import('../views/tools/HashGeneratorView.vue'),
  'base64-tools': () => import('../views/tools/Base64ToolsView.vue'),
  'timestamp-converter': () => import('../views/tools/TimestampConverterView.vue'),
  'character-count': () => import('../views/tools/CharacterCountView.vue')
}

const toolRoutes: RouteRecordRaw[] = TOOLS.map((t) => ({
  path: toolPath(t),
  name: t.slug,
  component: toolComponents[t.slug]!,
  meta: {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.metaKeywords,
    canonical: toolPath(t),
    toolName: t.name,
    toolCategory: t.toolCategory,
    breadcrumb: t.name
  }
}))
```

Route names note: today's route names equal the slugs EXCEPT verify `timestamp-converter` (today's name) vs slug — the slug IS `timestamp-converter`, matches. The `/feedback` route keeps its existing literal registration this task (PAGES-driven pages land in Task 12/14); `/privacy` is NOT added yet.

Drift test (`registry-drift.spec.ts`): imports the real router, asserts for every ToolDef a route exists with name === slug, path === toolPath, meta.title === metaTitle, meta.toolCategory === toolCategory; and no `/tools/*` route exists that isn't in TOOLS.

- [ ] **Step 1:** write drift test → currently PASSES against handwritten routes (it pins today's truth) — run and confirm PASS, then refactor the router to generation, run again → still PASS (refactor-under-test). **Step 2:** targeted e2e (nav across tools in text-compare.spec beforeEach exercises routing) + gates. **Step 3:** commit `refactor(platform): router generated from the registry`.

---

### Task 3: HomeView tabs + AppFooter from the registry

**Files:**
- Modify: `src/views/HomeView.vue` (delete the local `tools` array; derive), `src/components/AppFooter.vue`
- Test: modify `src/components/__tests__/AppFooter.spec.ts` (append), create `src/components/__tests__/HomeView.spec.ts`? — NO: HomeView needs router context; cover via the existing e2e (tab count/labels) + a light mount is optional. Normative: append registry-parity tests to AppFooter.spec.

HomeView: replace the `tools` array with

```ts
import { TOOLS, toolPath } from '@/tools/registry'
const tools = TOOLS.map(t => ({ title: t.name, subtitle: t.description, icon: t.icon, route: toolPath(t) }))
```

(Template unchanged — same keys.) AppFooter: replace the two hardcoded tool `<nav>` groups with `v-for` over `textTools`/`encodingTools` computed from TOOLS by footerGroup (headings and aria-labels unchanged: "Text Tools"/"Encoding & Security"; the third "DevYantra" section stays hardcoded). Preserve link TEXT exactly as today ('Text Compare', 'Code Formatter', 'Delimiter Tool', 'Character Counter', 'Hash Generator', 'Base64 Tools', 'JWT Decoder', 'Timestamp Converter') — today's footer uses LONGER names for two tools (Delimiter Tool, Character Counter, Timestamp Converter): add `footerName?: string` to ToolDef in registry.ts (falls back to name) with those three values, update registry.spec if needed.

AppFooter.spec additions:

```ts
  describe('Registry parity', () => {
    it('renders every tool exactly once across the two tool navs', () => {
      const links = wrapper.findAll('.footer-section nav a[href^="/tools/"]')
      expect(links).toHaveLength(8)
      const hrefs = links.map(l => l.attributes('href'))
      expect(new Set(hrefs).size).toBe(8)
    })
  })
```

(Mount with a router stub if router-link warns — use `global: { stubs: { RouterLink: { template: '<a :href="to"><slot/></a>', props: ['to'] } } }`; adjust the existing mount accordingly if needed.)

- [ ] **Step 1:** append parity test (fails only if rendering breaks — refactor-under-test again). **Step 2:** implement both derivations. **Step 3:** gates + targeted e2e + the accessibility e2e file (`npx playwright test tests/e2e/accessibility.spec.ts --project=chromium`) since footer/tabs are landmark surfaces. **Step 4:** commit `refactor(platform): tabs and footer generated from the registry`.

---

### Task 4: Sitemap + prerender from the registry

**Files:**
- Modify: `vite.config.ts` (sitemap plugin reads TOOLS/PAGES; delete SITE_ROUTES), `scripts/prerender.js` (derive ROUTES from dist/sitemap.xml)

vite.config.ts: `import { TOOLS, PAGES, toolPath } from './src/tools/registry'` (esbuild bundles config-TS; registry is dependency-free — enforced by Task 1's purity test). Generate entries: tools → `{ path: toolPath(t), priority: t.sitemapPriority, changefreq: 'monthly' }`; pages → `{ path: p.path, priority: p.sitemapPriority, changefreq: p.changefreq }`. IMPORTANT: `/privacy` is in PAGES but has no route until Task 14 — filter: emit only pages whose slug !== 'privacy' until the route exists? NO — forward-declare: sitemap MAY NOT list unrouted URLs. Add `routed: boolean` to PageDef (feedback true, privacy false initially; Task 14 flips it) and filter `PAGES.filter(p => p.routed)` in both sitemap and prerender-relevant outputs. Update registry + its spec accordingly in THIS task (documented rider).

prerender.js: replace the hardcoded ROUTES array with parsing dist/sitemap.xml:

```js
const sitemap = readFileSync(resolve(distDir, 'sitemap.xml'), 'utf8')
const ROUTES = [...sitemap.matchAll(/<loc>https:\/\/devyantra\.app([^<]+)<\/loc>/g)].map(m => m[1])
if (ROUTES.length === 0) { console.error('No routes parsed from sitemap.xml'); process.exit(1) }
```

- [ ] **Step 1:** capture today's baseline: `npm run build 2>/dev/null && cp dist/sitemap.xml /tmp/sitemap-before.xml`. **Step 2:** implement both changes. **Step 3:** `npm run build && diff <(grep -o '<loc>[^<]*' /tmp/sitemap-before.xml | sort) <(grep -o '<loc>[^<]*' dist/sitemap.xml | sort)` → IDENTICAL (9 URLs). Then `npm run build:seo` end-to-end → prerender reports the same 9 routes rendered. **Step 4:** gates + commit `refactor(platform): sitemap and prerender derive from the registry`.

---

### Task 5: Fuzzy scorer

**Files:**
- Create: `src/lib/fuzzy.ts`
- Test: `src/lib/__tests__/fuzzy.spec.ts`

**Interface:** `export function fuzzyScore(query: string, target: string): number` — 0 = no match; higher = better. Rules (normative): case-insensitive; diacritic-insensitive (NFD strip `\p{M}`); every query char must appear in order in target (else 0); +3 per char matched at a word boundary (start or after space/-/_), +2 per char consecutive with the previous match, +1 otherwise; final score divided by `target.length` then ×100 (shorter targets win ties). Also `export function fuzzyFilter<T>(query: string, items: T[], key: (t: T) => string): T[]` — scores against `key(t)`, filters score > 0, sorts descending, stable for equal scores.

Test table (write exactly):

```ts
import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzyFilter } from '../fuzzy'

const TOOL_NAMES = ['Text Compare', 'Delimiter', 'Code Formatter', 'JWT Decoder', 'Hash Generator', 'Base64 Tools', 'Timestamp', 'Character Count']
const top = (q: string) => fuzzyFilter(q, TOOL_NAMES, s => s)[0]

describe('fuzzyScore', () => {
  it('returns 0 when chars are missing or out of order', () => {
    expect(fuzzyScore('xyz', 'Text Compare')).toBe(0)
    expect(fuzzyScore('ct', 'Text Compare')).toBeGreaterThan(0) // C..t in order? C(ompare)->no t after... 
  })
  it('ranks initials at word boundaries first', () => {
    expect(top('tc')).toBe('Text Compare')
    expect(top('cf')).toBe('Code Formatter')
    expect(top('cc')).toBe('Character Count')
  })
  it('finds abbreviations', () => {
    expect(top('b64')).toBe('Base64 Tools')
    expect(top('jwt')).toBe('JWT Decoder')
    expect(top('ts')).toBe('Timestamp')
  })
  it('substring queries beat scattered matches', () => {
    expect(top('hash')).toBe('Hash Generator')
    expect(top('form')).toBe('Code Formatter')
  })
  it('is case and diacritic insensitive', () => {
    expect(fuzzyScore('CAFE', 'café menu')).toBeGreaterThan(0)
  })
  it('empty query returns 0 (caller shows defaults)', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
  })
})
```

NOTE on the `'ct'` case: verify against your implementation's semantics — 'c','t' must both appear in order in 'Text Compare' ('C' at index 5, then 't'? no lowercase t after index 5 — there is none; adjust the assertion to the true expectation after implementing honestly (do NOT force it; document the resolved expectation). All other cases are firm.

- [ ] **Steps:** test → fail → implement → pass → gates → commit `feat(platform): dependency-free fuzzy scorer`.

---

### Task 6: Command palette v2

**Files:**
- Modify: `src/components/CommandPalette.vue`
- Test: create `src/components/__tests__/CommandPalette.spec.ts`; modify `tests/e2e/command-palette.spec.ts` ONLY if an assertion depends on the old substring filter (list changes in report)

Rebuild the `commands` computed from the registry + actions, and the filter on `fuzzyFilter`:

```ts
import { TOOLS, toolPath } from '@/tools/registry'
import { fuzzyFilter } from '@/lib/fuzzy'

const RECENTS_KEY = 'devyantra:palette:recents'
const recents = ref<string[]>([])
const loadRecents = () => { try { recents.value = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]').slice(0, 5) } catch { recents.value = [] } }
const pushRecent = (id: string) => {
  recents.value = [id, ...recents.value.filter(r => r !== id)].slice(0, 5)
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.value)) } catch { /* quota — non-fatal */ }
}

const commands = computed<Command[]>(() => [
  ...TOOLS.map(t => ({ id: t.slug, label: t.name, description: t.description, icon: t.icon, action: () => router.push(toolPath(t)) })),
  { id: 'toggle-theme', label: 'Toggle Theme', description: themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode', icon: themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon', action: () => themeStore.toggleTheme() },
  { id: 'copy-url', label: 'Copy Current URL', description: 'Copy this page link', icon: 'pi pi-link', action: () => { copyWithFeedback(window.location.href, 'Link') } },
  { id: 'open-feedback', label: 'Feedback', description: 'Report a bug or request a feature', icon: 'pi pi-comment', action: () => router.push('/feedback') }
])

const filteredCommands = computed(() => {
  const q = query.value.trim()
  if (!q) {
    const recentCmds = recents.value.map(id => commands.value.find(c => c.id === id)).filter((c): c is Command => !!c)
    const rest = commands.value.filter(c => !recents.value.includes(c.id))
    return [...recentCmds, ...rest]
  }
  return fuzzyFilter(q, commands.value, c => `${c.label} ${c.description}`)
})
const recentCount = computed(() => (query.value.trim() ? 0 : recents.value.filter(id => commands.value.some(c => c.id === id)).length))
```

`executeCommand` calls `pushRecent(cmd.id)` before `cmd.action()`. Template: when `recentCount > 0`, render a `.palette-section-label` "Recent" row above the first `recentCount` items and "All" above the rest (plain divs, aria-hidden — the buttons remain the focusable list; keep the existing keyboard model over the flat filtered list). `loadRecents()` on open (in the existing `watch(open)` handler). `useClipboard` import for copy-url.

Component tests (mount with router stub + fresh localStorage): fuzzy filter renders ranked results ('tc' → first item Text Compare); recents: seed localStorage `["hash-generator","jwt-decoder"]` → open state (prop) → first two items are Hash then JWT with a "Recent" label present; executing a command persists it to recents (spy on localStorage.setItem or read back).

- [ ] **Steps:** component tests → fail → implement → pass → run `npx playwright test tests/e2e/command-palette.spec.ts --project=chromium` (update only substring-dependent assertions; list each in report) → gates → commit `feat(platform): command palette v2 — registry-driven, fuzzy, recents`.

---

### Task 7: `useToolState` (spec D2 core)

**Files:**
- Create: `src/composables/useToolState.ts`
- Test: `src/composables/__tests__/useToolState.spec.ts`

**Interface (normative):** per spec D2 (`useToolState(toolSlug, fields, opts?) → { flushSave, clearSaved, restored }`); storage envelope `{ v: 1, fields: Record<string, unknown> }`; only string/number/boolean field values persisted (validate on load: reject envelope if `v !== 1` or `fields` not an object; per-field: apply only when typeof matches the ref's current value's typeof); restore synchronously at call time BEFORE registering the debounced (default 800ms) deep watcher — the fix-pack ordering lesson; `flushSave` cancels the timer and writes now; `clearSaved` removes the key AND suppresses the next debounced save (so a clear isn't immediately overwritten by the pending timer — cancel the timer in clearSaved).

Unit tests (write fully — mirror the useShareState.spec mock style: mock localStorage): restore happens at init and does not trigger a save (advance timers, setItem not called); post-restore edit saves after debounce; type-mismatched field in storage is skipped; wrong version rejected wholly; flushSave immediate; clearSaved removes and cancels pending timer; non-persistable field types (object ref) are ignored with a dev console.warn once.

- [ ] **Steps:** tests → fail → implement → pass → gates → commit `feat(platform): useToolState per-tool persistence`.

---

### Task 8: `ToolActions` component (spec D2 UI)

**Files:**
- Create: `src/components/tool/ToolActions.vue`
- Test: `src/components/__tests__/ToolActions.spec.ts`

Props: `{ copyText?: string; copyLabel?: string; clearLabel?: string; sample?: () => void }`; emits `clear` (parent owns actual clearing so it can bundle related refs) — the component renders: Copy button (disabled when `!copyText?.trim()`, calls `copyWithFeedback(copyText, copyLabel ?? 'Result')`), Clear button (emits `clear`; the PARENT is responsible for the undo toast — document in a comment; keeps state ownership with the tool), Sample button only when `sample` prop passed. Slot `extra` for tool-specific buttons. Classes: `tool-actions`, `p-button p-button-sm p-button-outlined` per button (match the existing quick-action look; reuse the `.quick-actions` styles by using the same classes — copy the minimal CSS from CompareText's `.quick-actions` block into this component, scoped).

Component tests: copy disabled/enabled + toast on click (messages via useToast, reset in beforeEach like AppToast.spec); clear emits; sample renders conditionally.

- [ ] **Steps:** tests → fail → implement → pass → gates → commit `feat(platform): ToolActions standard action row`.

---

### Task 9: Adopt state+actions — Formatter, Hash, Base64

**Files:**
- Modify: `src/components/FormatText.vue`, `src/components/HashGenerator.vue`, `src/components/Base64Tools.vue`
- Test: append e2e `tests/e2e/platform.spec.ts` (create this file with the standard imports + `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })`)

Pattern (normative, worked example = Base64):

```ts
// Base64Tools.vue <script setup> additions
import { useToolState } from '@/composables/useToolState'
useToolState('base64-tools', { input: inputText, urlSafe })
```

— that's the whole persistence adoption: name the fields that define a session. Per tool: FormatText → `{ input: inputText }` (detectedType recomputes; formattedText derived — do NOT persist derived output); HashGenerator → `{ input: <the input ref> }` plus any algorithm-selection refs found in the file (read it; persist selection refs of type string/boolean); Base64 → `{ input: inputText, urlSafe }`.

ToolActions adoption: replace/augment each tool's existing ad-hoc result-area buttons with `<ToolActions :copy-text="<output ref>" copy-label="<Result label>" @clear="clearAll_-like handler with undo toast per the established pattern" :sample="<loadSample if the tool has one>">` — where a tool already has copy buttons with useClipboard (Base64 `copyOutput` predates useClipboard — migrate it), consolidate rather than duplicate; keep tool-specific controls (encode/decode toggles etc.) untouched. Clear handlers get the standard 10s undo toast (capture previous input(s)).

E2E (`platform.spec.ts`, describe 'Tool persistence (D2)'): for each of the three tools: navigate, fill distinctive input, wait 1000ms (debounce 800), reload, assert input restored. Plus one undo check on Base64: fill, Clear, toast Undo click, input back.

- [ ] **Steps:** e2e RED (no persistence today) → implement three adoptions → GREEN → gates + targeted e2e → commit `feat(platform): persistence and standard actions — formatter, hash, base64`.

---

### Task 10: Adopt state+actions — JWT, Timestamp, Character Count, Delimiter

**Files:**
- Modify: `src/components/JwtDecoder.vue`, `src/components/TimestampTools.vue`, `src/components/CharacterCount.vue`, `src/components/DelimiterTool.vue`
- Test: append to `tests/e2e/platform.spec.ts`

Same pattern. Fields: JWT → `{ input: <token ref> }`; Timestamp → `{ timestamp: inputTimestamp, datetime: inputDatetime, unit: tsUnit }` (note inputTimestamp may hold number|'' — persist as-is, number and string both allowed by useToolState's typeof check: on restore into a ref currently '' (string) a stored number would be skipped by strict typeof matching — acceptable; document in report); CharacterCount → `{ input: <text ref> }`; Delimiter → `{ input: <input ref> }` + its option refs (read the file: delimiter selection, custom delimiter, trim/remove-empty toggles — persist string/boolean ones). ToolActions per tool where a result exists (JWT: copy decoded payload; Timestamp: per-value copy already exists via copyValue — migrate copyValue to useClipboard, skip ToolActions if it fights the layout, note the call; CharacterCount: no output to copy — state-only adoption OK; Delimiter: copy output + clear-undo + keep its option controls).

E2E: persistence reload check per tool (4 more tests in the same describe).

- [ ] **Steps:** e2e RED → implement → GREEN → gates → commit `feat(platform): persistence and standard actions — jwt, timestamp, charcount, delimiter`.

---

### Task 11: Self-hosted fonts (spec D5.2)

**Files:**
- Create: `public/fonts/*.woff2` (vendored), `docs/fonts-license-note.md` (OFL notice + source URLs)
- Modify: `src/assets/theme.css` (line 1 @import → @font-face block), `index.html` (delete the two Google Fonts preconnects)

Procedure: read theme.css line 1 to get the EXACT families/weights currently imported. Fetch the css2 URL with a woff2-capable UA (`curl -sA "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36" "<the import URL>"`), extract the LATIN-subset woff2 URLs (the block whose unicode-range covers U+0000-00FF), download each to `public/fonts/jetbrains-mono-<weight><-italic?>.woff2`. Replace the @import with @font-face declarations (one per weight/style, `font-family: 'JetBrains Mono'; font-display: swap; src: url('/fonts/...woff2') format('woff2'); unicode-range: <the latin range from the css>`). Delete both preconnect links in index.html.

Verification: `npm run build && grep -ri "fonts.googleapis\|fonts.gstatic" dist/ index.html src/ || echo CLEAN` → CLEAN; dev-server visual smoke via e2e: append to platform.spec.ts a test asserting `document.fonts.check('13px "JetBrains Mono"')` is true after load and that no request URL matched `fonts.g` (page.on('request') recorder).

- [ ] **Steps:** implement → verify → gates + the font e2e → commit `feat(platform): self-host JetBrains Mono — no third-party font egress`.

---

### Task 12: Feedback goes static (spec D5.1)

**Files:**
- Modify: `src/views/FeedbackView.vue` (static links layout), `src/components/FeedbackForm.vue` → DELETE (and its imports)
- Test: append to `tests/e2e/platform.spec.ts`

FeedbackView: replace `<FeedbackForm />` with a `.feedback-links` section of three link cards (classes `feedback-link-card`): "Report a bug" → `https://github.com/sg-open/devyantra-ui/issues/new?template=bug_report.yml`, "Request a feature" → `.../issues/new?template=feature_request.yml`, "Ask a question" → `.../discussions` — each `target="_blank" rel="noopener"`, icon + title + one-line description, styled with existing tokens (simple bordered cards). Keep the hero + the existing open-source note. Delete `src/components/FeedbackForm.vue` entirely (`git rm`); grep for other importers first (expect none beyond FeedbackView).

E2E: feedback page renders 3 links with correct hrefs; a page.on('request') recorder during visit asserts no request to formspree.io (and no POST at all); repo-wide grep in the task: `grep -rn "formspree" src tests` → empty.

- [ ] **Steps:** e2e (link assertions RED against the form page) → implement → GREEN → gates → commit `feat(platform): feedback is static GitHub links — Formspree egress removed`.

---

### Task 13: Real PWA (spec D4)

**Files:**
- Modify: `package.json` (+`vite-plugin-pwa` devDependency), `vite.config.ts` (plugin), `src/main.ts` (registerSW + offline-ready toast), `src/App.vue` (offline pill + install prompt handling), `src/components/AppFooter.vue` (Install entry), `public/site.webmanifest` (icon entries)
- Create: `scripts/generate-icons.js`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `playwright.pwa.config.ts`, `tests/e2e/pwa-offline.spec.ts`

Steps (normative):
1. `npm install -D vite-plugin-pwa` (the approved dependency).
2. `scripts/generate-icons.js` (resvg, mirroring generate-og-image.js): render favicon.svg at 192 and 512; maskable = 512 canvas with the icon at 80% centered on `#F5F0E8`. Add manifest `icons` entries (`purpose: 'any'` ×2, `'maskable'` ×1) keeping the existing svg/ico entries.
3. vite.config.ts: `VitePWA({ registerType: 'autoUpdate', manifest: false, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'], navigateFallback: '/index.html' } })`.
4. main.ts: `import { registerSW } from 'virtual:pwa-register'` + `registerSW({ onOfflineReady() { useToast().add({ severity: 'success', summary: 'DevYantra works offline now', life: 4000 }) } })` — guard the whole call in `if (!import.meta.env.DEV)`. TS: add `"vite-plugin-pwa/client"` to tsconfig.app.json types (or a d.ts reference) so the virtual module typechecks.
5. App.vue: `online` ref driven by window online/offline listeners → header pill `.offline-pill` "Offline — everything still works" when false; `beforeinstallprompt` captured to `deferredPrompt` ref, exposed via provide('pwa-install') consumed by AppFooter's conditional "Install app" button (click → `prompt()`; hide after choice).
6. `playwright.pwa.config.ts`: copy of the main config's shape with `testMatch: 'tests/e2e/pwa-offline.spec.ts'`, `webServer: { command: 'npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: false }`, baseURL 4173, chromium only. Main `playwright.config.ts`: add `testIgnore: '**/pwa-offline.spec.ts'`.
7. `tests/e2e/pwa-offline.spec.ts`: load `/tools/hash-generator`, wait for SW ready (`await page.evaluate(() => navigator.serviceWorker.ready)`), `context.setOffline(true)`, `page.reload()`, assert the app shell renders (tab bar visible) AND hashing works offline (type 'hello' → SHA-256 output `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824` visible).
8. Run: `npm run build && npx playwright test --config playwright.pwa.config.ts --reporter=line` → PASS. Full gates; also confirm `npm run test:run` unaffected and dev server still runs cleanly (SW guarded out of dev).

- [ ] **Commit:** `feat(platform): real offline PWA — service worker, icons, install prompt, offline pill`.

---

### Task 14: CSP + /privacy + zero-egress proof (spec D5.3–5.5)

**Files:**
- Modify: `vercel.json` (CSP header), `src/tools/registry.ts` (privacy `routed: true`), `src/router/index.ts` (privacy route from PAGES or literal — match Task 2's page handling), `src/App.vue` (header privacy badge links to /privacy), `src/components/AppFooter.vue` (Privacy link in the DevYantra section)
- Create: `src/views/PrivacyView.vue`
- Test: append to `tests/e2e/platform.spec.ts`

CSP (add to the existing headers array in vercel.json for `/(.*)`):
`{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'" }`

PrivacyView content (write it fully): hero "Nothing leaves your browser"; sections: How it works (no backend — static files; all compute in your tab/worker), What we don't do (no telemetry, no analytics, no cookies, no third-party requests — fonts self-hosted, feedback is a link to GitHub), Verify it yourself (numbered steps: open devtools → Network → clear → use any tool → observe zero rows; mention the CSP header as the enforced guarantee), Open source (repo link). Register the route + sitemap flip (`routed: true` — Task 4's filter picks it up; run a build to confirm sitemap now has 10 URLs and prerender covers it).

Zero-egress e2e (the capstone): recorder collects every request URL across a session — load /, use hash (type+result), format JSON, run a small text-compare, open palette and navigate — assert every URL's origin === the dev server origin. Plus: /privacy renders with the verify section; footer + header badge link to it.

- [ ] **Steps:** e2e (privacy-page assertions RED) → implement → GREEN → `npm run build:seo` sanity (10 URLs) → gates → commit `feat(platform): CSP, /privacy proof page, zero-egress e2e`.

---

### Task 15: Full sweep + docs

**Files:** `README.md`, `CHANGELOG.md`

- [ ] **Step 1:** `npm run type-check && npm run lint && npm run test:run && npm run build`; full chromium e2e (`npx playwright test --project=chromium --reporter=line`); PWA config e2e once more; `npm run build:seo` full pipeline. Triage per the established rule (intentional-change test updates documented; real regressions → BLOCKED).
- [ ] **Step 2:** README: Extras section gains "Works offline — installable PWA"; privacy paragraph mentions the /privacy page and self-hosted fonts; CONTRIBUTING pointer for adding a tool now references the registry (one entry + one component). CHANGELOG `[Unreleased]`: Added — offline PWA + install prompt, /privacy page, command palette fuzzy search + recents, per-tool session persistence for all 8 tools, standard copy/clear-undo actions across tools; Changed — tool registry now drives router/tabs/palette/footer/sitemap/prerender (adding a tool is one entry + one component), fonts self-hosted (removes Google Fonts requests), feedback form replaced by GitHub links (removes the app's last third-party request); Security — CSP locks the app to same-origin requests.
- [ ] **Step 3:** commit `docs: changelog + readme for platform track`.

---

## Plan Self-Review (completed)

- **Spec coverage:** D1→T1–T4; D2→T7–T10; D3→T5–T6; D4→T13; D5→T11 (fonts), T12 (Formspree), T14 (CSP+/privacy+proof); D6→no-analytics stance stated in T14's privacy copy. No gaps.
- **Placeholder scan:** T9/T10 field lists name every ref (two require reading the target file for exact ref names — bounded, enumerated); T5's one honest-uncertainty assertion ('ct') is explicitly flagged for resolution-with-documentation, not hand-waved. No TBDs.
- **Type consistency:** ToolDef fields referenced in T2/T3/T4/T6 all exist in T1 (+`footerName` added in T3, `routed` in T4 — both documented as riders with registry.spec updates); `useToolState` signature identical in T7 def and T9/T10 usage; `fuzzyFilter` signature matches T6's call.
- **Sequencing check:** privacy page's sitemap entry gated by `routed` flag (T4 filter, T14 flip) — no dead sitemap URL in between; PWA e2e isolated in its own config so the main suite stays dev-server-based.
