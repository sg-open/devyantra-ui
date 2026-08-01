<!--
  UuidGenerator.vue — UI for the UUID / ULID Generator & Inspector tool (spec
  D5), consuming the pure engine in src/lib/ident.ts (uuidV4/uuidV7/ulid/
  inspect — see that file's header for the engine's own design notes).

  Two independent sections, matching the component contract literally:
    1. Generate: pick a kind (radio), a count (1-100), and a case (toggle),
       then click Generate to fill the <ol> below. ToolActions carries
       copy-all (newline-joined) + clear for this list.
    2. Inspect: a separate paste-in text field that decodes ANY UUID or ULID
       via inspect(), independent of whatever was just generated above.

  Generated IDs are never persisted (useToolState only carries the 3 settings
  fields) — regenerating a "result" on reload would misrepresent randomness
  as durable data. Instead, `generate()` runs once, unconditionally, at the
  end of setup so the page is never an empty "click a button first" state,
  whether this is a cold visit (defaults) or a post-reload restore (restored
  settings) — either way it's already showing a fresh, live batch.

  Case is a pure DISPLAY transform (`displayIds`) over the canonically-cased
  `generatedIds` — toggling case re-formats the existing batch instantly
  rather than discarding it and drawing fresh randomness just to change how
  it looks.
-->
<template>
  <div class="tool-panel uuid-generator">
    <header class="tool-hero">
      <h1>UUID &amp; ULID Generator</h1>
      <p>Generate UUID v4, UUID v7, or ULID identifiers in bulk, and inspect any identifier to reveal its kind, version, variant, and embedded timestamp — all generated and decoded locally in your browser.</p>
    </header>

    <div class="uuid-container">
      <div class="uuid-controls">
        <fieldset class="kind-fieldset">
          <legend class="input-label">Kind</legend>
          <label class="kind-radio">
            <input id="kind-v4" v-model="kind" type="radio" name="uuid-kind" value="v4" />
            <span>UUID v4</span>
          </label>
          <label class="kind-radio">
            <input id="kind-v7" v-model="kind" type="radio" name="uuid-kind" value="v7" />
            <span>UUID v7</span>
          </label>
          <label class="kind-radio">
            <input id="kind-ulid" v-model="kind" type="radio" name="uuid-kind" value="ulid" />
            <span>ULID</span>
          </label>
        </fieldset>

        <div class="count-field">
          <label class="input-label" for="uuid-count">Count</label>
          <input
            id="uuid-count"
            v-model.number="count"
            type="number"
            min="1"
            max="100"
            class="p-inputtext count-input"
          />
        </div>

        <div class="case-field">
          <span id="uppercase-label" class="input-label">Case</span>
          <div class="toggle-group" role="group" aria-labelledby="uppercase-label">
            <button
              id="uppercase-off"
              type="button"
              :class="['toggle-btn', { active: !uppercase }]"
              @click="setUppercase(false)"
            >
              lowercase
            </button>
            <button
              id="uppercase-on"
              type="button"
              :class="['toggle-btn', { active: uppercase }]"
              @click="setUppercase(true)"
            >
              UPPERCASE
            </button>
          </div>
        </div>

        <button id="uuid-generate" type="button" class="p-button generate-btn" @click="generate">
          <i class="pi pi-refresh"></i>
          Generate
        </button>
      </div>

      <div class="uuid-results-wrap">
        <ol v-if="displayIds.length" class="uuid-results">
          <li v-for="(id, i) in displayIds" :key="i" class="uuid-row">{{ id }}</li>
        </ol>
        <div v-else class="empty-state">
          <i class="pi pi-id-card"></i>
          <p>Click Generate to create identifiers.</p>
        </div>
      </div>

      <ToolActions
        :copy-text="copyText"
        copy-label="Generated IDs"
        @clear="clearAll"
      />

      <section class="inspect-section">
        <h2 class="section-heading">Inspect an Identifier</h2>
        <div class="inspect-field">
          <label class="input-label" for="uuid-inspect-input">Paste a UUID or ULID</label>
          <input
            id="uuid-inspect-input"
            v-model="inspectInput"
            type="text"
            class="p-inputtext inspect-input"
            placeholder="e.g. 018f4d2e-2b3f-7c1a-8e21-abcdef123456 or 01ARZ3NDEKTSV4RRFFQ69G5FAV"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </div>

        <div v-if="inspectDisplay" class="uuid-inspect-result">
          <div class="inspect-row">
            <span class="inspect-label">Kind</span>
            <span class="inspect-value inspect-kind">{{ inspectDisplay.kindLabel }}</span>
          </div>
          <div v-if="inspectDisplay.version !== undefined" class="inspect-row">
            <span class="inspect-label">Version</span>
            <span class="inspect-value inspect-version">{{ inspectDisplay.version }}</span>
          </div>
          <div v-if="inspectDisplay.variant" class="inspect-row">
            <span class="inspect-label">Variant</span>
            <span class="inspect-value inspect-variant">{{ inspectDisplay.variant }}</span>
          </div>
          <div v-if="inspectDisplay.timestampIso" class="inspect-row">
            <span class="inspect-label">Timestamp</span>
            <span class="inspect-value">
              <span class="inspect-timestamp-iso">{{ inspectDisplay.timestampIso }}</span>
              <span class="inspect-timestamp-relative">({{ inspectDisplay.timestampRelative }})</span>
            </span>
          </div>
        </div>
        <p v-else class="inspect-empty-hint">Paste an identifier above to inspect it.</p>
      </section>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a UUID / ULID Generator?</h2>
      <p>A UUID (Universally Unique Identifier) or ULID (Universally Unique Lexicographically Sortable Identifier) is a 128-bit value used to uniquely identify records, requests, and objects without a central coordinator. DevYantra generates UUID v4 (fully random), UUID v7 (timestamp-ordered, per RFC 9562), and ULID (Crockford Base32, sortable) identifiers in bulk, and can also decode any identifier you paste in to reveal its version, variant, and embedded creation timestamp.</p>
      <p>Everything runs locally: generation uses <code>crypto.getRandomValues()</code>, the Web Crypto API's cryptographically secure random number generator, entirely in your browser tab. Nothing is sent to a server.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Generate 1 to 100 identifiers at once</li>
        <li>UUID v4 (random), UUID v7 (timestamp-ordered), and ULID (Crockford Base32) support</li>
        <li>Inspect any identifier to extract its version, variant, and embedded timestamp</li>
        <li>Uppercase/lowercase toggle for generated output</li>
        <li>One-click copy of the entire batch</li>
      </ul>

      <h2>How to Use the UUID / ULID Generator</h2>
      <ol>
        <li>Choose a kind: UUID v4, UUID v7, or ULID.</li>
        <li>Set how many identifiers to generate (1 to 100).</li>
        <li>Click Generate to produce the list.</li>
        <li>Copy the entire batch, or paste any single identifier into the inspector below to decode it.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>What's the difference between UUID v4 and v7?</h3>
        <p>UUID v4 is fully random (122 random bits) with no inherent ordering — two v4 IDs generated seconds apart look completely unrelated. UUID v7 embeds a 48-bit millisecond timestamp in its most significant bits, so v7 IDs generated later always sort after ones generated earlier when compared as plain strings, which makes them better database primary keys (less index fragmentation) while still remaining globally unique.</p>

        <h3>What is a ULID?</h3>
        <p>A ULID (Universally Unique Lexicographically Sortable Identifier) encodes a 48-bit millisecond timestamp and 80 bits of randomness as 26 Crockford Base32 characters, instead of UUID's 36-character hyphenated hex format. Like UUID v7, ULIDs sort chronologically as plain strings; unlike UUID, they have no dashes, exclude visually ambiguous letters (I, L, O, U), and are 10 characters shorter.</p>

        <h3>Are these IDs generated securely?</h3>
        <p>Yes. Every random bit — the full 122 bits of a v4 UUID, the random suffix of a v7 UUID, and the 80-bit random component of a ULID — comes from <code>crypto.getRandomValues()</code>, the Web Crypto API's cryptographically secure random number generator, running locally in your browser. Nothing is sent to a server.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/hash-generator">Hash Generator</router-link>
        <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
        <router-link to="/tools/timestamp-converter">Timestamp Converter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { uuidV4, uuidV7, ulid, inspect } from '@/lib/ident'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

type IdKind = 'v4' | 'v7' | 'ulid'

const KIND_DEFAULT_UPPERCASE: Record<IdKind, boolean> = { v4: false, v7: false, ulid: true }

const toast = useToast()

const kind = ref<IdKind>('v4')
const count = ref(1)
const uppercase = ref(false)

// Per-tool persistence (D2) — settings only ({ kind, count, uppercase }).
// Generated IDs and the inspect input are deliberately excluded: replaying a
// "result" on reload would misrepresent randomness as durable data.
const toolState = useToolState('uuid-generator', { kind, count, uppercase })

// True once the user has explicitly clicked the case toggle THIS session.
// Registered AFTER useToolState's synchronous restore above so a restored
// `uppercase` value is never immediately re-clobbered by the kind watcher
// below (mirrors every other tool's restore-before-watch ordering: the
// watcher only reacts to CHANGES after it is registered, never to the
// restore assignment that already happened).
let uppercaseTouched = false

// Kind-change auto-defaults the case UNLESS the user has already overridden
// it this session (component contract: "user override sticks for the
// session" — sticky only for the session because the override flag itself
// is plain in-memory state, never persisted).
watch(kind, (newKind) => {
  if (!uppercaseTouched) uppercase.value = KIND_DEFAULT_UPPERCASE[newKind]
})

const setUppercase = (value: boolean): void => {
  uppercase.value = value
  uppercaseTouched = true
}

const generateOne = (k: IdKind): string => {
  if (k === 'v4') return uuidV4()
  if (k === 'v7') return uuidV7()
  return ulid()
}

const clampCount = (n: number): number => {
  if (!Number.isFinite(n)) return 1
  return Math.min(100, Math.max(1, Math.round(n)))
}

const generatedIds = ref<string[]>([])

const generate = (): void => {
  const n = clampCount(count.value)
  count.value = n // reflect any out-of-range typed value back into the field
  generatedIds.value = Array.from({ length: n }, () => generateOne(kind.value))

  // Flush immediately: Generate is the tool's one discrete "commit" action,
  // so the settings that produced THIS batch are durable right away rather
  // than waiting on useToolState's 800ms debounce.
  toolState.flushSave()
}

// Casing is a pure display transform over the canonically-cased generated
// IDs — toggling case re-formats the existing batch instantly instead of
// discarding it and drawing fresh randomness just to change how it looks.
const displayIds = computed(() =>
  generatedIds.value.map((id) => (uppercase.value ? id.toUpperCase() : id.toLowerCase()))
)

const copyText = computed(() => displayIds.value.join('\n'))

const clearAll = (): void => {
  const previous = generatedIds.value
  generatedIds.value = []

  if (previous.length) {
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          generatedIds.value = previous
        }
      }
    })
  }
}

// Show a freshly generated batch immediately — both on a cold visit
// (default settings) and right after a restore (restored settings) — so the
// page is never an empty "click a button first" state.
generate()

// ---------------------------------------------------------------------------
// Inspect
// ---------------------------------------------------------------------------

const inspectInput = ref('')

// No shared relative-time helper exists in this repo to import (same gap
// Task 6's cron-parser report already flagged) — TimestampTools.vue has its
// own private getRelativeTime with the identical second/minute/hour/day/
// month/year bucketing; this mirrors that phrasing for consistency.
const formatRelative = (date: Date): string => {
  const diffMs = Date.now() - date.getTime()
  const future = diffMs < 0
  const abs = Math.abs(diffMs)

  const seconds = Math.floor(abs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let phrase: string
  if (seconds < 60) phrase = `${seconds} second${seconds === 1 ? '' : 's'}`
  else if (minutes < 60) phrase = `${minutes} minute${minutes === 1 ? '' : 's'}`
  else if (hours < 24) phrase = `${hours} hour${hours === 1 ? '' : 's'}`
  else if (days < 30) phrase = `${days} day${days === 1 ? '' : 's'}`
  else if (months < 12) phrase = `${months} month${months === 1 ? '' : 's'}`
  else phrase = `${years} year${years === 1 ? '' : 's'}`

  return future ? `in ${phrase}` : `${phrase} ago`
}

interface InspectDisplay {
  kindLabel: string
  version?: number
  variant?: string
  timestampIso?: string
  timestampRelative?: string
}

const inspectDisplay = computed<InspectDisplay | null>(() => {
  const trimmed = inspectInput.value.trim()
  if (!trimmed) return null

  const info = inspect(trimmed)
  return {
    kindLabel: info.kind === 'unknown' ? 'Not recognized' : info.kind.toUpperCase(),
    version: info.version,
    variant: info.variant,
    timestampIso: info.timestamp ? info.timestamp.toISOString() : undefined,
    timestampRelative: info.timestamp ? formatRelative(info.timestamp) : undefined
  }
})
</script>

<style scoped>
.uuid-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.uuid-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-lg);
}

.kind-fieldset {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-lg);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  margin: 0;
}

.kind-fieldset legend {
  padding: 0 var(--space-xs);
}

.kind-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  cursor: pointer;
  margin-bottom: 0;
}

.kind-radio input {
  width: 16px;
  height: 16px;
  accent-color: var(--dt-brand);
  cursor: pointer;
}

.count-field,
.case-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.count-input {
  width: 5rem;
  font-family: var(--font-mono);
}

.toggle-group {
  display: flex;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 34px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: var(--dt-brand-light);
  color: var(--dt-brand);
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--dt-border);
}

.generate-btn {
  gap: var(--space-sm);
  white-space: nowrap;
}

.uuid-results-wrap {
  min-height: 60px;
}

.uuid-results {
  margin: 0;
  padding: var(--space-lg) var(--space-lg) var(--space-lg) 2.5rem;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.uuid-row {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
  word-break: break-all;
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
  min-height: 60px;
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

.inspect-section {
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

.inspect-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.inspect-input {
  width: 100%;
  font-family: var(--font-mono);
}

.uuid-inspect-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
}

.inspect-row {
  display: flex;
  gap: var(--space-md);
  align-items: baseline;
}

.inspect-label {
  min-width: 6rem;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.inspect-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
  word-break: break-all;
}

.inspect-timestamp-relative {
  color: var(--dt-text-secondary);
}

.inspect-empty-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--dt-text-secondary);
}

@media (max-width: 768px) {
  .uuid-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .kind-fieldset {
    gap: var(--space-md);
  }

  .generate-btn {
    justify-content: center;
  }
}
</style>
