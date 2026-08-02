<!--
  UrlParser.vue — UI for the URL Parser tool (spec D6), consuming the pure
  engine in src/lib/urlparse.ts (parseUrl/buildUrl — see that file's header
  for the engine's own design notes, especially the hostUnicode and
  "+" -> "%20" policies pinned there).

  Layout, top to bottom:
    1. URL input, with an optional base-URL input that appears only when it's
       actually needed (see `showBaseInput` below).
    2. A read-only "parts" table (scheme/host/port/path/hash) — host shows
       its unicode form alongside the punycode form when the input typed a
       non-ASCII host.
    3. An editable param grid (key/value rows + delete + trailing add-row).
       Every edit rebuilds the URL live via buildUrl(); the rebuilt URL shows
       in a read-only field with ToolActions copy.
    4. An independent Encode/Decode helper: one shared textarea,
       transformed in place by encodeURIComponent/decodeURIComponent.

  No debounce anywhere in this component: `new URL()` and encodeURIComponent/
  decodeURIComponent are all sub-millisecond, unlike the regex-worker/cron-scan/
  JSON-tree-build work RegexTester/CronParser/JsonExplorer debounce.

  Only `input` is persisted (component contract) — base URL, the editable
  param grid, and the encode/decode textarea are all deliberately excluded:
  a reload re-derives the param grid fresh from the persisted `input` string,
  so an in-progress (unsaved) param edit does NOT survive a reload, by design.
-->
<template>
  <div class="tool-panel url-parser">
    <header class="tool-hero">
      <h1>URL Parser</h1>
      <p>Paste any URL to break it into scheme, host, port, path, hash, and an editable query-parameter table that rebuilds the URL live as you edit it — all parsed locally in your browser.</p>
    </header>

    <div class="url-container">
      <div class="url-input-row">
        <div class="url-field">
          <label class="input-label" for="url-input">URL</label>
          <input
            id="url-input"
            v-model="input"
            type="text"
            class="p-inputtext url-text-input"
            :class="{ 'p-invalid': result.kind === 'error' }"
            placeholder="https://example.com/path?query=1#hash"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-describedby="url-input-error"
          />
        </div>

        <div v-if="showBaseInput" class="url-field">
          <label class="input-label" for="url-base-input">Base URL (for relative input)</label>
          <input
            id="url-base-input"
            v-model="baseInput"
            type="text"
            class="p-inputtext url-text-input"
            placeholder="https://example.com"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </div>
      </div>

      <div class="results-section">
        <div v-if="result.kind === 'empty'" class="empty-state">
          <i class="pi pi-link"></i>
          <p>Paste a URL above to see its parts and edit its query parameters.</p>
        </div>

        <p v-else-if="result.kind === 'needs-base'" class="url-needs-base-hint">
          <i class="pi pi-info-circle"></i>
          <span>This looks like a relative URL — enter a base URL above to resolve it.</span>
        </p>

        <p v-else-if="result.kind === 'error'" id="url-input-error" class="field-error" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ result.message }}</span>
        </p>

        <template v-else>
          <div class="url-parts-wrap">
            <table class="url-parts-table">
              <tbody>
                <tr>
                  <th scope="row">Scheme</th>
                  <td class="part-scheme">{{ result.parsed.scheme }}</td>
                </tr>
                <tr>
                  <th scope="row">Host</th>
                  <td class="part-host">
                    {{ result.parsed.host }}
                    <span v-if="result.parsed.hostUnicode" class="host-unicode">({{ result.parsed.hostUnicode }})</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Port</th>
                  <td class="part-port">{{ result.parsed.port || '—' }}</td>
                </tr>
                <tr>
                  <th scope="row">Path</th>
                  <td class="part-path">{{ result.parsed.path }}</td>
                </tr>
                <tr>
                  <th scope="row">Hash</th>
                  <td class="part-hash">{{ result.parsed.hash || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="param-grid-section">
            <div class="param-grid-header">
              <span class="input-label">Query Parameters</span>
            </div>

            <div v-if="editableParams.length === 0" class="param-grid-empty">No query parameters.</div>

            <div v-else class="param-grid">
              <div class="param-grid-labels" aria-hidden="true">
                <span>Key</span>
                <span>Value</span>
              </div>
              <div v-for="(param, i) in editableParams" :key="i" class="param-row">
                <input
                  v-model="param.key"
                  type="text"
                  class="p-inputtext param-key"
                  :aria-label="`Parameter ${i + 1} key`"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                />
                <input
                  v-model="param.value"
                  type="text"
                  class="p-inputtext param-value"
                  :aria-label="`Parameter ${i + 1} value`"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                />
                <button
                  type="button"
                  class="param-delete"
                  :aria-label="`Delete parameter ${i + 1}`"
                  @click="deleteParam(i)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <button type="button" class="param-add-row" @click="addParam">
              <i class="pi pi-plus"></i>
              Add parameter
            </button>
          </div>

          <div class="rebuilt-url-field">
            <label class="input-label" for="rebuilt-url">Rebuilt URL</label>
            <input id="rebuilt-url" type="text" readonly class="p-inputtext url-text-input rebuilt-url-input" :value="rebuiltUrl" />
          </div>

          <ToolActions
            :copy-text="rebuiltUrl"
            copy-label="Rebuilt URL"
            @clear="clearAll"
          />
        </template>
      </div>

      <section class="encode-decode-section">
        <h2 class="section-heading">Encode / Decode Helper</h2>
        <textarea
          id="encode-decode-input"
          v-model="encodeText"
          class="p-inputtextarea encode-decode-textarea"
          rows="3"
          placeholder="Paste text or a URL-encoded string…"
          spellcheck="false"
        ></textarea>
        <div class="encode-decode-actions">
          <button id="encode-btn" type="button" class="p-button p-button-sm" @click="runEncode">
            <i class="pi pi-arrow-right"></i>
            Encode
          </button>
          <button id="decode-btn" type="button" class="p-button p-button-sm p-button-secondary p-button-outlined" @click="runDecode">
            <i class="pi pi-arrow-left"></i>
            Decode
          </button>
        </div>
        <p v-if="encodeError" class="field-error encode-decode-error" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ encodeError }}</span>
        </p>
      </section>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a URL Parser?</h2>
      <p>A URL parser breaks a web address down into its component parts — scheme, host, port, path, hash, and query parameters — instead of leaving you to count slashes and ampersands by hand. DevYantra also rebuilds the URL live as you edit its query parameters, and can resolve relative URLs (like <code>/a?b=1</code>) against a base URL you supply.</p>
      <p>Everything runs locally: parsing uses the browser's own <code>URL</code> and <code>URLSearchParams</code> APIs entirely in your browser tab. Nothing is sent to a server.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Decompose any URL into scheme, host, port, path, hash, and query parameters</li>
        <li>Editable query-parameter grid that rebuilds the URL live as you type</li>
        <li>Full support for repeated keys (e.g. <code>tag=a&amp;tag=b</code>) — order and duplicates preserved</li>
        <li>Encode or decode text with <code>encodeURIComponent</code>/<code>decodeURIComponent</code></li>
        <li>Base-URL resolution for relative inputs (e.g. <code>/path?x=1</code>)</li>
        <li>International domain names shown in both punycode and unicode</li>
      </ul>

      <h2>How to Use the URL Parser</h2>
      <ol>
        <li>Paste a URL into the field above.</li>
        <li>Read its parts — scheme, host, port, path, and hash — in the table below.</li>
        <li>Edit, add, or delete query parameters in the table; the rebuilt URL updates live.</li>
        <li>Copy the rebuilt URL with the copy button.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>Why did my + turn into %20?</h3>
        <p>Both <code>+</code> and <code>%20</code> mean a literal space inside a URL's query string — but <code>+</code> only means that by convention inside a query string, while <code>%20</code> means it everywhere and can never be confused with a literal plus sign. The rebuilt URL always uses the unambiguous <code>%20</code> form, even if the original URL you pasted used <code>+</code>.</p>

        <h3>Can I edit query parameters?</h3>
        <p>Yes. Every key and value in the query-parameter table is editable — change a value, delete a row, or add a new one — and the rebuilt URL field below updates immediately to match, preserving repeated keys and their order.</p>

        <h3>Does this handle international domains?</h3>
        <p>Yes. A host with non-ASCII characters (like <code>bücher.example</code>) is shown in both its punycode form (<code>xn--bcher-kva.example</code>, the form actually used on the wire) and its original unicode spelling, side by side.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/base64-tools">Base64 Tools</router-link>
        <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
        <router-link to="/tools/hash-generator">Hash Generator</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { parseUrl, buildUrl, type UrlParam, type ParsedUrl } from '@/lib/urlparse'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

const toast = useToast()

const input = ref('')
const baseInput = ref('')

// Per-tool persistence (D2) — { input } only, per the component contract.
// baseInput, the editable param grid, and the encode/decode textarea are all
// derived/scratch state that a reload deliberately does NOT resurrect.
const toolState = useToolState('url-parser', { input })

// Does the raw text contain a ':' before any '/', '?', or '#'? If so, the
// user appears to be attempting an ABSOLUTE URL (valid scheme grammar or
// not — 'ht!tp:/x' still counts, since 'ht!tp' precedes the ':'), so a parse
// failure is a genuine error, never the "needs a base" hint. If there's no
// such colon at all, the text has no scheme-like prefix whatsoever and is
// unambiguously a relative reference — a standalone parse failure there
// just means "no base was given yet".
const looksLikeAbsoluteAttempt = (raw: string): boolean => /^[^/?#:]*:/.test(raw)

type UrlParseState =
  | { kind: 'empty' }
  | { kind: 'needs-base' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; parsed: ParsedUrl }

const result = computed<UrlParseState>(() => {
  const raw = input.value.trim()
  if (!raw) return { kind: 'empty' }

  const base = baseInput.value.trim() || undefined
  try {
    return { kind: 'success', parsed: parseUrl(raw, base) }
  } catch {
    if (!base && !looksLikeAbsoluteAttempt(raw)) return { kind: 'needs-base' }
    return { kind: 'error', message: `Invalid URL: "${raw}"` }
  }
})

// Revealed once genuinely needed, AND stays visible once the user has typed
// into it (so it never vanishes out from under them mid-edit just because
// the URL now happens to resolve) — a judgment call the brief's e2e matrix
// doesn't pin either way.
const showBaseInput = computed(() => result.value.kind === 'needs-base' || baseInput.value.trim() !== '')

// The live-editable grid backing the rebuilt-URL field. Reset to a fresh
// deep copy of the freshly parsed params EVERY time `result` lands on a NEW
// successful parse (i.e. whenever input/base change) — never on a param
// edit itself, since editing this array doesn't touch `input`/`baseInput`
// and therefore never re-triggers `result`. Registered with `immediate:
// true` so it picks up a useToolState-restored `input` on mount, mirroring
// every other tool's restore-before-watch ordering.
const editableParams = ref<UrlParam[]>([])
watch(
  result,
  (r) => {
    editableParams.value = r.kind === 'success' ? r.parsed.params.map((p) => ({ ...p })) : []
  },
  { immediate: true }
)

const addParam = (): void => {
  editableParams.value.push({ key: '', value: '' })
}

const deleteParam = (index: number): void => {
  editableParams.value.splice(index, 1)
}

// Blank/in-progress rows (no key typed yet) are excluded from the rebuild —
// an "Add parameter" row shouldn't inject a bare "=value" into the URL
// before the user has typed a key for it.
const rebuiltUrl = computed(() => {
  if (result.value.kind !== 'success') return ''
  const params = editableParams.value.filter((p) => p.key.trim() !== '')
  return buildUrl({ ...result.value.parsed, params })
})

const clearAll = (): void => {
  const previousInput = input.value
  const previousBase = baseInput.value

  input.value = ''
  baseInput.value = ''

  if (previousInput.trim()) {
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          input.value = previousInput
          baseInput.value = previousBase
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared URL.
  toolState.flushSave()
}

// ---------------------------------------------------------------------------
// Encode / Decode helper — independent of the URL parser above (mirrors the
// UUID Generator tool's "two independent sections" precedent). One shared
// textarea, transformed in place by each button; nothing here is persisted.
// ---------------------------------------------------------------------------

const encodeText = ref('')
const encodeError = ref('')

const runEncode = (): void => {
  try {
    encodeText.value = encodeURIComponent(encodeText.value)
    encodeError.value = ''
  } catch {
    encodeError.value = 'Could not encode this text.'
  }
}

const runDecode = (): void => {
  try {
    encodeText.value = decodeURIComponent(encodeText.value)
    encodeError.value = ''
  } catch {
    encodeError.value = 'Could not decode: malformed percent-encoding (e.g. "%" not followed by two hex digits).'
  }
}
</script>

<style scoped>
.url-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.url-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.url-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.url-text-input {
  width: 100%;
  font-family: var(--font-mono);
}

.rebuilt-url-input {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
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
  min-height: 120px;
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

.url-needs-base-hint,
.field-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.url-needs-base-hint {
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  color: var(--dt-text-secondary);
}

.field-error {
  background: var(--dt-danger-light);
  border: 1px solid rgba(198, 40, 40, 0.2);
  color: var(--dt-danger);
}

.url-parts-wrap {
  overflow-x: auto;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
}

.url-parts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.url-parts-table th,
.url-parts-table td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--dt-border);
  vertical-align: top;
}

.url-parts-table th {
  width: 6rem;
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.url-parts-table td {
  font-family: var(--font-mono);
  word-break: break-all;
}

.url-parts-table tbody tr:last-child th,
.url-parts-table tbody tr:last-child td {
  border-bottom: none;
}

.host-unicode {
  color: var(--dt-text-secondary);
  margin-left: var(--space-xs);
}

.param-grid-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.param-grid-header {
  display: flex;
  align-items: center;
}

.param-grid-empty {
  padding: var(--space-lg);
  text-align: center;
  color: var(--dt-text-secondary);
  font-size: var(--text-sm);
  border: 1px dashed var(--dt-border);
  border-radius: var(--radius-md);
}

.param-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.param-grid-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 2.25rem;
  gap: var(--space-sm);
  padding: 0 var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.param-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2.25rem;
  gap: var(--space-sm);
  align-items: center;
}

.param-key,
.param-value {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.param-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  background: var(--dt-surface-2);
  color: var(--dt-danger);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.param-delete:hover {
  background: var(--dt-danger-light);
  border-color: var(--dt-danger);
}

.param-add-row {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  align-self: flex-start;
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--dt-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--dt-brand);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.param-add-row:hover {
  background: var(--dt-brand-light);
}

.rebuilt-url-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.encode-decode-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--dt-border);
}

.section-heading {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  margin: 0;
}

.encode-decode-textarea {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.encode-decode-actions {
  display: flex;
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .url-input-row {
    grid-template-columns: 1fr;
  }

  .param-grid-labels,
  .param-row {
    grid-template-columns: 1fr 1fr 2.25rem;
  }
}
</style>
