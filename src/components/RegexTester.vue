<!--
  RegexTester.vue — flagship of the New Tools track (spec D2 UI).

  Every evaluation runs through useRegexWorker() (a dedicated Worker + 2s
  watchdog — see src/composables/useRegexWorker.ts), so a catastrophic-
  backtracking pattern can only ever hang that disposable worker thread, never
  this tab. Highlighting is built as a plain array of {text, className}
  segments over testString from the model's matches[].index/match.length —
  interpolated in the template only, no v-html anywhere.
-->
<template>
  <div class="tool-panel regex-tester">
    <header class="tool-hero">
      <h1>Regex Tester Online</h1>
      <p>Test and debug regular expressions with live match highlighting, capture groups, and a replace preview. Every pattern runs in an isolated worker with a 2-second budget, so a runaway pattern can never freeze this tab.</p>
    </header>

    <div class="regex-container">
      <div class="pattern-row">
        <div class="pattern-field">
          <label class="input-label" for="regex-pattern">Pattern</label>
          <div class="pattern-input-wrap">
            <span class="pattern-delim" aria-hidden="true">/</span>
            <input
              id="regex-pattern"
              v-model="pattern"
              type="text"
              class="p-inputtext pattern-input"
              :class="{ 'p-invalid': regexWorker.state.value === 'error' }"
              placeholder="Enter a regular expression…"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :aria-describedby="regexWorker.state.value === 'error' ? 'regex-pattern-error' : undefined"
            />
            <span class="pattern-delim pattern-delim--flags" aria-hidden="true">/{{ flags }}</span>
          </div>
          <p v-if="regexWorker.state.value === 'error'" id="regex-pattern-error" class="field-error" role="alert">
            {{ regexWorker.errorDetail.value }}
          </p>
        </div>

        <div class="library-field">
          <label class="input-label" for="regex-library">Pattern library</label>
          <select id="regex-library" class="p-inputtext library-select" @change="onLibrarySelect">
            <option value="" selected>Insert a common pattern…</option>
            <option
              v-for="entry in PATTERN_LIBRARY"
              :key="entry.name"
              :value="entry.name"
              :title="entry.caveat"
            >{{ entry.name }}</option>
          </select>
        </div>
      </div>

      <fieldset class="flags-field">
        <legend class="input-label">Flags</legend>
        <label class="flag-checkbox" title="Global — find all matches, not just the first">
          <input id="flag-g" v-model="flagG" type="checkbox" />
          <span>g</span>
        </label>
        <label class="flag-checkbox" title="Case-insensitive">
          <input id="flag-i" v-model="flagI" type="checkbox" />
          <span>i</span>
        </label>
        <label class="flag-checkbox" title="Multiline — ^ and $ match at line breaks">
          <input id="flag-m" v-model="flagM" type="checkbox" />
          <span>m</span>
        </label>
        <label class="flag-checkbox" title="Dotall — . also matches newlines">
          <input id="flag-s" v-model="flagS" type="checkbox" />
          <span>s</span>
        </label>
        <label class="flag-checkbox" title="Unicode mode">
          <input id="flag-u" v-model="flagU" type="checkbox" />
          <span>u</span>
        </label>
        <label class="flag-checkbox" title="Sticky — match only at lastIndex">
          <input id="flag-y" v-model="flagY" type="checkbox" />
          <span>y</span>
        </label>
      </fieldset>

      <div class="test-field">
        <label class="input-label" for="regex-test-string">Test string</label>
        <textarea
          id="regex-test-string"
          v-model="testString"
          rows="6"
          class="p-inputtextarea test-textarea"
          placeholder="Paste the text you want to test the pattern against…"
        ></textarea>
      </div>

      <div class="replace-row">
        <label class="replace-toggle">
          <input v-model="replaceMode" type="checkbox" />
          <span>Replace mode</span>
        </label>
      </div>

      <div v-if="replaceMode" class="replace-field">
        <label class="input-label" for="regex-replacement">Replacement</label>
        <input
          id="regex-replacement"
          v-model="replacement"
          type="text"
          class="p-inputtext replacement-input"
          placeholder="e.g. $1, $<name>, or plain text"
        />
      </div>

      <!-- Results -->
      <div class="results-section">
        <div v-if="regexWorker.state.value === 'idle'" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>Enter a pattern above to see live matches.</p>
        </div>

        <div v-else-if="regexWorker.state.value === 'computing'" class="rx-computing" role="status" aria-live="polite">
          <span class="rx-spinner"></span>
          Evaluating…
        </div>

        <div v-else-if="regexWorker.state.value === 'timeout'" class="rx-timeout" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Pattern timed out after 2 s — likely catastrophic backtracking. Edit the pattern to try again.</span>
        </div>

        <template v-else-if="regexWorker.state.value === 'done' && regexWorker.result.value">
          <div class="rx-summary">
            <span class="rx-chip">{{ regexWorker.result.value.matches.length }} match<span v-if="regexWorker.result.value.matches.length !== 1">es</span></span>
            <span class="rx-chip rx-chip--time">{{ regexWorker.result.value.elapsedMs.toFixed(2) }} ms</span>
          </div>

          <div v-if="regexWorker.result.value.truncated" class="rx-truncated-banner">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Showing only the first 10,000 matches — the pattern matched more than that in this test string.</span>
          </div>

          <div class="rx-highlight-pane" aria-label="Test string with matches highlighted">
            <span v-for="(segment, i) in highlightSegments" :key="i" :class="segment.className">{{ segment.text }}</span>
          </div>

          <p v-if="regexWorker.result.value.matches.length === 0" class="rx-no-matches">No matches found.</p>
          <div v-else class="rx-matches-table-wrap">
            <table class="rx-matches-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Match</th>
                  <th scope="col">Groups</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in regexWorker.result.value.matches" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td class="rx-match-value"><code>{{ m.match.length > 0 ? m.match : '(empty match)' }}</code></td>
                  <td class="rx-groups-cell">
                    <span v-if="m.groups.length === 0" class="rx-no-groups">–</span>
                    <span v-for="(g, gi) in m.groups" :key="gi" class="rx-group-chip">
                      <strong>{{ g.name ?? gi + 1 }}:</strong> {{ g.value ?? '(no match)' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="replaceMode" class="rx-replace-preview">
            <label class="input-label">Replace preview</label>
            <pre class="rx-replace-output">{{ regexWorker.result.value.replaced }}</pre>
          </div>

          <!-- Single ToolActions row (M10): replace mode's "copy replaced
               text" action lives in the main row's extra slot instead of a
               second full ToolActions instance (which duplicated Clear). -->
          <ToolActions
            :copy-text="matchesJSON"
            copy-label="Matches (JSON)"
            @clear="clearAll"
          >
            <template v-if="replaceMode" #extra>
              <button
                type="button"
                class="p-button p-button-sm p-button-outlined"
                :disabled="!regexWorker.result.value.replaced?.trim()"
                @click="copyReplaced"
              >
                <i class="pi pi-copy"></i>
                Copy replaced text
              </button>
            </template>
          </ToolActions>
        </template>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Regex Tester?</h2>
      <p>A regex tester lets you write a regular expression and immediately see which parts of a piece of text it matches, without switching to a script or REPL. DevYantra highlights every match inline, breaks out named and positional capture groups into a table, and can preview a find-and-replace before you apply it anywhere.</p>
      <p>Every pattern is evaluated inside a dedicated Web Worker with a 2-second time budget. Some patterns — nested quantifiers like <code>(a+)+</code> against the wrong input — cause catastrophic backtracking and would otherwise freeze a browser tab indefinitely. Here, the worst case is a worker getting terminated after 2 seconds; the page itself never stops responding.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Live match highlighting with a capture-group table</li>
        <li>Replace preview with $1 and $&lt;name&gt; support</li>
        <li>g/i/m/s/u/y flag toggles</li>
        <li>Curated common-pattern library (email, URL, UUID, and more)</li>
        <li>Worker-isolated execution that can never freeze the page</li>
      </ul>

      <h2>How to Use the Regex Tester</h2>
      <ol>
        <li>Type or paste a regular expression into the Pattern field — a syntax error appears inline underneath it.</li>
        <li>Check g, i, m, s, u, or y to control matching behavior.</li>
        <li>Paste the text you want to test the pattern against into the Test string area.</li>
        <li>Read the highlighted matches and the groups table below, or switch on Replace mode to preview a substitution.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>Why did my pattern time out?</h3>
        <p>Some patterns (for example, nested quantifiers like (a+)+) can cause catastrophic backtracking, where the regex engine tries an exponential number of ways to match and effectively never finishes. DevYantra runs every pattern in a dedicated Web Worker with a 2-second budget — if a pattern does not finish in time, the worker is terminated and a timeout message appears instead of a frozen tab. Editing the pattern runs it again immediately, and the tab stays responsive throughout.</p>

        <h3>Does my text leave the browser?</h3>
        <p>No. The pattern and test string are evaluated entirely inside a Web Worker running in your own browser tab. Nothing is uploaded anywhere — this tool makes zero network requests.</p>

        <h3>Which regex dialect is this?</h3>
        <p>DevYantra uses the native JavaScript RegExp engine built into your browser, including named capture groups and lookbehind assertions where supported. Behavior matches exactly what new RegExp() produces in your own browser, since that is exactly what runs under the hood.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/format-text">Code Formatter</router-link>
        <router-link to="/tools/text-compare">Text Compare</router-link>
        <router-link to="/tools/character-count">Character Counter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from 'vue'
import { useRegexWorker } from '@/composables/useRegexWorker'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import { useClipboard } from '@/composables/useClipboard'
import ToolActions from '@/components/tool/ToolActions.vue'

interface LibraryPattern {
  name: string
  pattern: string
  caveat: string
}

// Pragmatic, common patterns — each caveat is surfaced via the <option>'s
// title attribute rather than pretending these are fully spec-compliant
// validators (real-world RFC 5322 / calendar / octet-range validation needs
// far more than a single regex).
const PATTERN_LIBRARY: LibraryPattern[] = [
  {
    name: 'Email',
    pattern: '[^@\\s]+@[^@\\s]+\\.[^@\\s]+',
    caveat: 'Pragmatic match — accepts many invalid addresses and rejects some valid quoted-string forms. Not RFC 5322 validation.'
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/[^\\s]+',
    caveat: 'Pragmatic match — matches http(s) URLs up to the next whitespace; does not validate the hostname or percent-encoding.'
  },
  {
    name: 'UUID',
    pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
    caveat: 'Matches the 8-4-4-4-12 hex shape (lowercase). Add the i flag for uppercase; does not check version/variant nibbles.'
  },
  {
    name: 'ISO date',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    caveat: 'Matches the YYYY-MM-DD shape only — does not validate real calendar dates (e.g. 2024-13-40 matches).'
  },
  {
    name: 'IPv4',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    caveat: 'Matches the dotted-quad shape; does not enforce 0-255 per octet (e.g. 999.999.999.999 matches).'
  },
  {
    name: 'Semver',
    pattern: '\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?',
    caveat: 'Covers MAJOR.MINOR.PATCH plus an optional pre-release tag; does not validate build metadata or full semver precedence.'
  },
  {
    name: 'Slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    caveat: 'Anchored, lowercase-only slug shape (e.g. my-post-title); add the i flag if you need case-insensitive matching.'
  }
]

const toast = useToast()
const regexWorker = useRegexWorker()
const { copyWithFeedback } = useClipboard()

const pattern = ref('')
const testString = ref('')
const replaceMode = ref(false)
const replacement = ref('')

// g is on by default (brief); the rest start off.
const flagG = ref(true)
const flagI = ref(false)
const flagM = ref(false)
const flagS = ref(false)
const flagU = ref(false)
const flagY = ref(false)

// Flags persist (and feed the worker) as a single string, per spec — a
// writable computed so useToolState's restore path (`fieldRef.value = stored`)
// can set it directly and have that fan back out to the six checkboxes.
const flags = computed<string>({
  get: () => {
    let value = ''
    if (flagG.value) value += 'g'
    if (flagI.value) value += 'i'
    if (flagM.value) value += 'm'
    if (flagS.value) value += 's'
    if (flagU.value) value += 'u'
    if (flagY.value) value += 'y'
    return value
  },
  set: (value: string) => {
    flagG.value = value.includes('g')
    flagI.value = value.includes('i')
    flagM.value = value.includes('m')
    flagS.value = value.includes('s')
    flagU.value = value.includes('u')
    flagY.value = value.includes('y')
  }
})

// Per-tool persistence (D2) — matches, errorDetail, etc. are derived output
// and recomputed by the watcher below rather than persisted.
const toolState = useToolState('regex-tester', { pattern, flags, testString })

interface HighlightSegment {
  text: string
  className: string
}

// Model-driven highlight spans built directly from matches[].index/match —
// plain/highlight segments over testString, interpolated in the template
// only (no v-html anywhere in this component).
//
// Built from result.testString (the ECHOED string the worker actually
// matched against), never the live testString ref directly (M7): evaluation
// is 250ms-debounced, so there's a window after a fresh keystroke where
// `regexWorker.result` still holds the previous run's matches while
// `testString.value` already reflects the new text — slicing stale
// match.index/match.length against the NEW text would transiently
// misalign every highlight span until the next run lands.
const highlightSegments = computed<HighlightSegment[]>(() => {
  const result = regexWorker.result.value
  const text = result ? result.testString : testString.value
  if (!text) return []

  if (!result || result.matches.length === 0) {
    return [{ text, className: 'rx-hl-plain' }]
  }

  const segments: HighlightSegment[] = []
  let cursor = 0
  result.matches.forEach((m, i) => {
    if (m.index > cursor) {
      segments.push({ text: text.slice(cursor, m.index), className: 'rx-hl-plain' })
    }
    const variant = i % 2 === 0 ? 'rx-hl--a' : 'rx-hl--b'
    segments.push({ text: m.match, className: `rx-hl ${variant}` })
    cursor = m.index + m.match.length
  })
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), className: 'rx-hl-plain' })
  }
  return segments
})

const matchesJSON = computed(() => JSON.stringify(regexWorker.result.value?.matches ?? [], null, 2))

// M10: replace mode's copy action, folded into the main ToolActions row's
// extra slot instead of a second ToolActions instance (which duplicated the
// Clear button). Mirrors ToolActions' own handleCopy — same guard (no-op on
// blank text) and the same copyWithFeedback/toast plumbing.
const copyReplaced = (): void => {
  const replaced = regexWorker.result.value?.replaced
  if (replaced?.trim()) void copyWithFeedback(replaced, 'Replaced text')
}

// 250ms-debounced run() on any change to pattern/flags/testString/replace
// settings — a single shared timer, so several rapid changes (e.g. a flag
// click immediately followed by a pattern edit) coalesce into one run()
// using the latest values, rather than each queuing its own worker request.
let debounceHandle: ReturnType<typeof setTimeout> | null = null

const runRegex = (): void => {
  if (!pattern.value) {
    regexWorker.cancel()
    return
  }
  regexWorker.run({
    pattern: pattern.value,
    flags: flags.value,
    testString: testString.value,
    replacement: replaceMode.value ? replacement.value : null
  })
}

const scheduleRun = (): void => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => {
    debounceHandle = null
    runRegex()
  }, 250)
}

onScopeDispose(() => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
})

// immediate: true covers the restored-on-mount case too (useToolState's
// restore runs synchronously above, before this watch is registered).
watch([pattern, flags, testString, replaceMode, replacement], scheduleRun, { immediate: true })

const onLibrarySelect = (event: Event): void => {
  const select = event.target as HTMLSelectElement
  const entry = PATTERN_LIBRARY.find((p) => p.name === select.value)
  if (entry) pattern.value = entry.pattern
  select.value = '' // reset to the placeholder so it can insert again
}

const clearAll = (): void => {
  const previous = {
    pattern: pattern.value,
    flags: flags.value,
    testString: testString.value,
    replaceMode: replaceMode.value,
    replacement: replacement.value
  }

  pattern.value = ''
  testString.value = ''
  flags.value = 'g'
  replaceMode.value = false
  replacement.value = ''
  regexWorker.cancel()

  if (previous.pattern || previous.testString) {
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          pattern.value = previous.pattern
          flags.value = previous.flags
          testString.value = previous.testString
          replaceMode.value = previous.replaceMode
          replacement.value = previous.replacement
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared pattern/text.
  toolState.flushSave()
}
</script>

<style scoped>
.regex-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.pattern-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.pattern-field,
.library-field,
.test-field,
.replace-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.pattern-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.pattern-delim {
  font-family: var(--font-mono);
  color: var(--dt-text-tertiary);
  font-size: var(--text-base);
  flex-shrink: 0;
}

.pattern-delim--flags {
  color: var(--dt-brand);
  font-weight: var(--font-weight-semibold);
}

.pattern-input,
.replacement-input,
.library-select {
  width: 100%;
  font-family: var(--font-mono);
}

.field-error {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--dt-danger);
}

.flags-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-lg);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  margin: 0;
}

.flags-field legend {
  padding: 0 var(--space-xs);
}

.flag-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  cursor: pointer;
  margin-bottom: 0;
  text-transform: none;
}

.flag-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--dt-brand);
  cursor: pointer;
}

.test-textarea {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.replace-row {
  display: flex;
}

.replace-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
  cursor: pointer;
  margin-bottom: 0;
}

.replace-toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--dt-brand);
  cursor: pointer;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  color: var(--dt-text-secondary);
  border: 1px dashed var(--dt-border);
  border-radius: var(--radius-lg);
  min-height: 160px;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--text-sm);
}

.rx-computing {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--dt-text-secondary);
  font-size: var(--text-sm);
}

.rx-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--dt-border);
  border-top: 2px solid var(--dt-brand);
  border-radius: 50%;
  animation: rx-spin 1s linear infinite;
}

@keyframes rx-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.rx-timeout {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--dt-danger-light);
  border: 1px solid rgba(198, 40, 40, 0.2);
  border-radius: var(--radius-md);
  color: var(--dt-danger);
  font-size: var(--text-sm);
}

.rx-summary {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.rx-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: 20px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  color: var(--dt-text-secondary);
}

.rx-chip--time {
  color: var(--dt-brand);
}

.rx-truncated-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--dt-warning-light);
  border: 1px solid rgba(212, 130, 10, 0.2);
  border-radius: var(--radius-md);
  color: var(--dt-warning);
  font-size: var(--text-sm);
}

.rx-highlight-pane {
  padding: var(--space-lg);
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
}

.rx-hl-plain {
  color: var(--dt-text-primary);
}

.rx-hl {
  border-radius: 3px;
  padding: 1px 2px;
  margin: -1px -2px;
}

.rx-hl--a {
  background: var(--diff-added-word-bg);
  box-shadow: 0 0 0 1px var(--diff-added-border);
}

.rx-hl--b {
  background: rgba(var(--dt-brand-rgb), 0.25);
  box-shadow: 0 0 0 1px rgba(var(--dt-brand-rgb), 0.35);
}

.rx-no-matches {
  margin: 0;
  padding: var(--space-lg);
  text-align: center;
  color: var(--dt-text-secondary);
  font-size: var(--text-sm);
}

.rx-matches-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
}

.rx-matches-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.rx-matches-table th,
.rx-matches-table td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--dt-border);
  vertical-align: top;
}

.rx-matches-table th {
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rx-matches-table tbody tr:last-child td {
  border-bottom: none;
}

.rx-match-value code {
  font-family: var(--font-mono);
}

.rx-groups-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rx-group-chip {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
}

.rx-group-chip strong {
  color: var(--dt-text-primary);
}

.rx-no-groups {
  color: var(--dt-text-tertiary);
}

.rx-replace-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.rx-replace-output {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .pattern-row {
    grid-template-columns: 1fr;
  }

  .flags-field {
    gap: var(--space-md);
  }
}
</style>
