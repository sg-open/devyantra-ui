<!--
  JsonExplorer.vue — flagship UI for spec D3 (see src/lib/jsonModel.ts for the
  pure engine: parseJsonModel/computeStats/searchJsonTree).

  Parsing runs 300ms after the last keystroke (scheduleParse below) against a
  SEPARATE `debouncedInput` ref, never on every keystroke directly — mirrors
  RegexTester's single shared-timer debounce. Search, by contrast, re-walks
  the already-parsed tree on every keystroke with no debounce: searchJsonTree
  is a cheap walk over in-memory JsonNode objects, not a re-parse of raw text.

  "Copy formatted JSON" needs the exact original value, but JsonNode.preview
  truncates strings at 40 chars — so `parsedValue` below re-runs JSON.parse
  on the identical (already-validated) debouncedInput itself, rather than
  trying to reconstruct data from the display tree. See jsonModel.ts's header
  comment for why that field was kept out of JsonNode's normative shape.
-->
<template>
  <div class="tool-panel json-explorer">
    <header class="tool-hero">
      <h1>JSON Explorer</h1>
      <p>Paste any JSON and browse it as a collapsible tree. Click a key to copy its exact path, search to jump straight to a value, and read structure stats at a glance — all entirely in your browser.</p>
    </header>

    <div class="jx-container">
      <div class="jx-input-field">
        <label class="input-label" for="json-input">JSON input</label>
        <textarea
          id="json-input"
          v-model="input"
          rows="10"
          class="p-inputtextarea jx-input"
          placeholder="Paste JSON here…"
          spellcheck="false"
        ></textarea>
      </div>

      <div v-if="!input.trim()" class="empty-state">
        <i class="pi pi-sitemap"></i>
        <p>Paste JSON above to explore it as a tree.</p>
      </div>

      <div v-else-if="parseError" class="jx-error" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ parseError.message }}</span>
      </div>

      <template v-else-if="root">
        <div class="jx-toolbar">
          <div class="jx-search-field">
            <label class="input-label" for="json-search">Search</label>
            <div class="jx-search-wrap">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                id="json-search"
                v-model="searchQuery"
                type="text"
                class="p-inputtext jx-search"
                placeholder="Search keys and string values…"
                autocomplete="off"
              />
            </div>
          </div>

          <div class="jx-stats" role="status">
            <span class="jx-stat"><strong>{{ stats.keys }}</strong> keys</span>
            <span class="jx-stat"><strong>{{ stats.maxDepth }}</strong> max depth</span>
            <span class="jx-stat"><strong>{{ formattedBytes }}</strong></span>
          </div>
        </div>

        <div class="jx-tree" role="group" aria-label="JSON tree">
          <JsonTreeNode
            :node="root"
            :depth="0"
            :is-array-item="false"
            :search-matches="searchResult.matches"
            :search-expand="searchResult.expand"
          />
        </div>

        <ToolActions
          :copy-text="formattedJSON"
          copy-label="Formatted JSON"
          @clear="clearAll"
        />
      </template>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a JSON Explorer?</h2>
      <p>A JSON explorer turns a raw JSON document into a collapsible tree you can actually navigate, instead of a wall of brackets and quotes. DevYantra shows a type badge for every value, lets you click any key to copy the exact path to that value, and highlights matches as you search — all computed locally, with nothing ever leaving your browser.</p>
      <p>Paths are written in a familiar dot/bracket form — <code>$.users[1].name</code> for a normal key, or <code>$["weird key"]</code> when a property name isn't a valid identifier — so you can paste them straight into JavaScript, a JSONPath expression, or a bug report.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Collapsible tree with type badges for every value</li>
        <li>Click any key to copy its JSON path</li>
        <li>Search that expands and highlights matches</li>
        <li>Structure stats: keys, max depth, and size</li>
        <li>2 MB published limit, entirely synchronous and private</li>
      </ul>

      <h2>How to Use the JSON Explorer</h2>
      <ol>
        <li>Paste your JSON into the input above — it parses automatically as you stop typing.</li>
        <li>Expand or collapse nodes with the arrow next to each object or array.</li>
        <li>Click any key to copy its full JSON path to the clipboard.</li>
        <li>Type in the search box to expand and highlight matching keys or values.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I get the path to a value?</h3>
        <p>Click the key of any value in the tree. Its JSON path — for example <code>$.users[1].name</code> — is copied to your clipboard immediately, with a toast confirming the copy. Hovering over a key also shows its path as a tooltip.</p>

        <h3>Why is there a 2 MB limit?</h3>
        <p>Parsing and building the tree happens synchronously on the main thread so results feel instant — no spinner, no worker round-trip. Keeping that snappy requires a size limit; 2 MB comfortably covers real-world API responses and config files. Larger payloads are better explored in a dedicated editor.</p>

        <h3>Is my JSON uploaded anywhere?</h3>
        <p>No. Parsing, path generation, and search all run locally in your browser tab. DevYantra makes zero network requests with your data.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/format-text">Code Formatter</router-link>
        <router-link to="/tools/text-compare">Text Compare</router-link>
        <router-link to="/tools/regex-tester">Regex Tester</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from 'vue'
import { parseJsonModel, computeStats, searchJsonTree, type JsonNode, type JsonParseError } from '@/lib/jsonModel'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import JsonTreeNode from '@/components/JsonTreeNode.vue'
import ToolActions from '@/components/tool/ToolActions.vue'

const toast = useToast()

const input = ref('')
const searchQuery = ref('')

// Per-tool persistence (D2) — restores synchronously, BEFORE the debounce
// watcher below is registered, so the immediate:true first parse below sees
// the restored text rather than racing it (mirrors useToolState's own
// restore-before-watch ordering, and RegexTester's identical pattern).
const toolState = useToolState('json-explorer', { input })

// Parsing runs 300ms after the last edit, against this separate ref — never
// directly off `input`, so rapid typing never re-parses (and re-walks a
// potentially large tree) on every keystroke.
const debouncedInput = ref('')
let debounceHandle: ReturnType<typeof setTimeout> | null = null

const scheduleParse = (): void => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => {
    debounceHandle = null
    debouncedInput.value = input.value
  }, 300)
}

onScopeDispose(() => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
})

watch(input, scheduleParse, { immediate: true })

const parsedResult = computed(() => {
  if (!debouncedInput.value.trim()) return null
  return parseJsonModel(debouncedInput.value)
})

const root = computed<JsonNode | null>(() => {
  const result = parsedResult.value
  return result && 'root' in result ? result.root : null
})

const parseError = computed<JsonParseError | null>(() => {
  const result = parsedResult.value
  return result && 'error' in result ? result.error : null
})

// Re-parses the SAME string parseJsonModel just validated, purely to get the
// exact original value for "copy formatted JSON" (see the file-header
// comment for why `root` alone can't be used for this). Gated on `root`
// being non-null, so this can never succeed when parseJsonModel itself
// rejected the input (oversized or malformed) — no bypass of that gate.
const parsedValue = computed<unknown>(() => {
  if (!root.value) return undefined
  try {
    return JSON.parse(debouncedInput.value)
  } catch {
    return undefined
  }
})

const formattedJSON = computed(() => (parsedValue.value === undefined ? '' : JSON.stringify(parsedValue.value, null, 2)))

const stats = computed(() => (root.value ? computeStats(root.value) : { keys: 0, maxDepth: 0, bytes: 0 }))

const formattedBytes = computed(() => {
  const bytes = stats.value.bytes
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
})

const searchResult = computed(() => (root.value ? searchJsonTree(root.value, searchQuery.value) : { matches: new Set<string>(), expand: new Set<string>() }))

const clearAll = (): void => {
  const previous = input.value

  input.value = ''
  searchQuery.value = ''

  if (previous.trim()) {
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          input.value = previous
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared input.
  toolState.flushSave()
}
</script>

<style scoped>
.jx-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.jx-input-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.jx-input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
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

.jx-error {
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

.jx-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-lg);
}

.jx-search-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 1 1 260px;
  min-width: 200px;
}

.jx-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.jx-search-wrap i {
  position: absolute;
  left: 10px;
  color: var(--dt-text-tertiary);
  font-size: 0.85rem;
  pointer-events: none;
}

.jx-search {
  width: 100%;
  padding-left: 2rem;
}

.jx-stats {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.jx-stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  border-radius: 20px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  color: var(--dt-text-secondary);
  white-space: nowrap;
}

.jx-stat strong {
  color: var(--dt-brand);
}

.jx-tree {
  padding: var(--space-md);
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
}

@media (max-width: 768px) {
  .jx-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
