<template>
  <div class="tool-panel timestamp-tools">
    <header class="tool-hero">
      <h1>Unix Timestamp Converter</h1>
      <p>Convert Unix timestamps to human-readable dates and back. Supports seconds, milliseconds, and multiple timezone formats.</p>
    </header>
    <div class="timestamp-container">
      <!-- Current Time -->
      <div class="panel">
        <h2 class="panel-title">Current Time</h2>
        <div class="time-display">
          <div class="time-item">
            <label>Unix (seconds)</label>
            <div class="value-row">
              <code>{{ currentTimestamp }}</code>
              <button class="copy-icon" @click="copyValue(String(currentTimestamp))" v-tooltip="'Copy'" aria-label="Copy Unix seconds"><i class="pi pi-copy"></i></button>
            </div>
          </div>
          <div class="time-item">
            <label>Unix (milliseconds)</label>
            <div class="value-row">
              <code>{{ currentTimestampMs }}</code>
              <button class="copy-icon" @click="copyValue(String(currentTimestampMs))" v-tooltip="'Copy'" aria-label="Copy Unix milliseconds"><i class="pi pi-copy"></i></button>
            </div>
          </div>
          <div class="time-item">
            <label>ISO 8601</label>
            <div class="value-row">
              <code>{{ currentISO }}</code>
              <button class="copy-icon" @click="copyValue(currentISO)" v-tooltip="'Copy'" aria-label="Copy ISO 8601"><i class="pi pi-copy"></i></button>
            </div>
          </div>
          <div class="time-item">
            <label>Local</label>
            <div class="value-row">
              <code>{{ currentHuman }}</code>
              <button class="copy-icon" @click="copyValue(currentHuman)" v-tooltip="'Copy'" aria-label="Copy local time"><i class="pi pi-copy"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Converter -->
      <div class="panel">
        <h2 class="panel-title">Convert</h2>

        <!-- Timestamp to Date -->
        <div class="converter-section">
          <label class="converter-label">Timestamp &rarr; Date</label>
          <div class="converter-row">
            <input
              v-model="inputTimestamp"
              type="number"
              placeholder="Enter Unix timestamp..."
              class="p-inputtext timestamp-input"
              @input="convertTimestamp"
            />
            <div class="unit-toggle">
              <button :class="['toggle-btn', { active: tsUnit === 'seconds' }]" @click="tsUnit = 'seconds'; convertTimestamp()">sec</button>
              <button :class="['toggle-btn', { active: tsUnit === 'milliseconds' }]" @click="tsUnit = 'milliseconds'; convertTimestamp()">ms</button>
            </div>
          </div>
          <div v-if="convertedDate" class="result-items">
            <div class="result-item">
              <label>Date</label>
              <div class="value-row">
                <code>{{ convertedDate }}</code>
                <button class="copy-icon" @click="copyValue(convertedDate)" v-tooltip="'Copy'" aria-label="Copy converted date"><i class="pi pi-copy"></i></button>
              </div>
            </div>
            <div class="result-item">
              <label>ISO</label>
              <div class="value-row">
                <code>{{ convertedISO }}</code>
                <button class="copy-icon" @click="copyValue(convertedISO)" v-tooltip="'Copy'" aria-label="Copy converted ISO"><i class="pi pi-copy"></i></button>
              </div>
            </div>
            <div v-if="relativeTime" class="result-item">
              <label>Relative</label>
              <code class="relative-code">{{ relativeTime }}</code>
            </div>
          </div>
        </div>

        <!-- Date to Timestamp -->
        <div class="converter-section">
          <label class="converter-label">Date &rarr; Timestamp</label>
          <input
            type="datetime-local"
            v-model="inputDatetime"
            class="datetime-input"
            @input="convertDateToTimestamp"
          />
          <div v-if="dateToTs" class="result-items">
            <div class="result-item">
              <label>Seconds</label>
              <div class="value-row">
                <code>{{ dateToTs }}</code>
                <button class="copy-icon" @click="copyValue(String(dateToTs))" v-tooltip="'Copy'" aria-label="Copy seconds timestamp"><i class="pi pi-copy"></i></button>
              </div>
            </div>
            <div class="result-item">
              <label>Milliseconds</label>
              <div class="value-row">
                <code>{{ dateToTsMs }}</code>
                <button class="copy-icon" @click="copyValue(String(dateToTsMs))" v-tooltip="'Copy'" aria-label="Copy milliseconds timestamp"><i class="pi pi-copy"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference Timestamps -->
    <div class="reference-section">
      <h2 class="panel-title">Reference Timestamps</h2>
      <div class="reference-grid">
        <div v-for="ref in referenceTimestamps" :key="ref.label" class="reference-item">
          <span class="ref-label">{{ ref.label }}</span>
          <div class="value-row">
            <code class="ref-value">{{ ref.value }}</code>
            <button class="copy-icon" @click="copyValue(String(ref.value))" v-tooltip="'Copy'" :aria-label="`Copy ${ref.label}`"><i class="pi pi-copy"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Unix Timestamp?</h2>
      <p>A Unix timestamp (also called epoch time or POSIX time) is the number of seconds that have elapsed since January 1, 1970, 00:00:00 UTC — a moment known as the "Unix epoch." It's the standard way computers internally store and compare dates because a single integer is simpler and more portable than a formatted date string with timezones and locales.</p>
      <p>Unix timestamps appear in API responses, database records, log files, JWT tokens, and cron schedules. This converter handles both second-precision timestamps (10 digits, e.g., 1708041600) and millisecond-precision timestamps (13 digits, e.g., 1708041600000) commonly used in JavaScript and Java.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Convert Unix timestamps (seconds or milliseconds) to human-readable dates</li>
        <li>Convert dates to Unix timestamps in both seconds and milliseconds</li>
        <li>Live current time display with one-click copy</li>
        <li>Reference timestamps for common dates (Y2K, Unix epoch, etc.)</li>
        <li>Timezone-aware conversion with local time display</li>
      </ul>

      <h2>How to Use the Timestamp Converter</h2>
      <ol>
        <li>Enter a Unix timestamp (seconds or milliseconds) to convert it to a date.</li>
        <li>Or select a date and time to get the corresponding Unix timestamp.</li>
        <li>Use the "Now" button to capture the current timestamp instantly.</li>
        <li>Reference the common timestamps table for quick comparisons.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I convert a Unix timestamp?</h3>
        <p>Enter a Unix timestamp (seconds or milliseconds since January 1, 1970) into the input field and DevYantra will instantly convert it to a human-readable date and time in your local timezone and UTC.</p>

        <h3>What is epoch time?</h3>
        <p>Epoch time (also called Unix time or POSIX time) counts the number of seconds elapsed since January 1, 1970, 00:00:00 UTC. It is the standard way computers store and compare dates internally and is widely used in APIs, databases, and log files.</p>

        <h3>Can I convert dates to timestamps?</h3>
        <p>Yes. Enter a human-readable date and time and DevYantra will convert it to a Unix timestamp in both seconds and milliseconds. You can also get the current timestamp with one click.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/character-count">Character Counter</router-link>
        <router-link to="/tools/format-text">Code Formatter</router-link>
        <router-link to="/tools/hash-generator">Hash Generator</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToolState } from '@/composables/useToolState'
import { useClipboard } from '@/composables/useClipboard'

const clipboard = useClipboard()

const currentTimestamp = ref(0)
const currentTimestampMs = ref(0)
const currentISO = ref('')
const currentHuman = ref('')
const inputTimestamp = ref('')
const inputDatetime = ref('')
const tsUnit = ref<'seconds' | 'milliseconds'>('seconds')
const convertedDate = ref('')
const convertedISO = ref('')
const relativeTime = ref('')
const dateToTs = ref<number | null>(null)
const dateToTsMs = ref<number | null>(null)

// Per-tool persistence (D2) — timestamp/datetime/unit round-trip; every
// other ref here (currentTimestamp, convertedDate, dateToTs, ...) is derived
// output, recomputed below rather than persisted.
//
// KNOWN QUIRK: inputTimestamp is declared as a string ref (`ref('')`), but
// Vue's v-model casts any non-empty <input type="number"> entry to a
// `number` (@vue/runtime-dom's vModelText: castToNumber = number ||
// el.type === 'number', applied even without a `.number` modifier). On
// reload a fresh `inputTimestamp = ref('')` is `typeof 'string'`, and
// useToolState's restore only applies a stored field when
// `typeof stored === typeof fieldRef.value` — so a persisted number is
// silently skipped and the timestamp value does NOT restore, even though it
// saves correctly. `unit` (always a string literal) and `datetime` (bound to
// a plain <input type="datetime-local">, never number-cast) restore
// normally. Accepted per the platform-track plan — verified empirically in
// tests/e2e/platform.spec.ts.
const toolState = useToolState('timestamp-converter', {
  timestamp: inputTimestamp,
  datetime: inputDatetime,
  unit: tsUnit,
})

let interval: ReturnType<typeof setInterval>

const referenceTimestamps = computed(() => [
  { label: 'Epoch (Jan 1, 1970)', value: 0 },
  { label: 'Y2K (Jan 1, 2000)', value: 946684800 },
  { label: 'Max 32-bit (Jan 19, 2038)', value: 2147483647 },
  { label: 'Now', value: currentTimestamp.value },
])

const updateCurrentTime = () => {
  const now = new Date()
  currentTimestamp.value = Math.floor(now.getTime() / 1000)
  currentTimestampMs.value = now.getTime()
  currentISO.value = now.toISOString()
  currentHuman.value = now.toLocaleString()
}

const getRelativeTime = (date: Date): string => {
  const now = Date.now()
  const diff = now - date.getTime()
  const absDiff = Math.abs(diff)
  const future = diff < 0

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let result: string
  if (seconds < 60) result = `${seconds} second${seconds !== 1 ? 's' : ''}`
  else if (minutes < 60) result = `${minutes} minute${minutes !== 1 ? 's' : ''}`
  else if (hours < 24) result = `${hours} hour${hours !== 1 ? 's' : ''}`
  else if (days < 30) result = `${days} day${days !== 1 ? 's' : ''}`
  else if (months < 12) result = `${months} month${months !== 1 ? 's' : ''}`
  else result = `${years} year${years !== 1 ? 's' : ''}`

  return future ? `in ${result}` : `${result} ago`
}

const convertTimestamp = () => {
  // v-model on a type="number" input yields a number — 0 is a valid epoch,
  // so only empty/null counts as "no input".
  if (inputTimestamp.value === '' || inputTimestamp.value === null || inputTimestamp.value === undefined) {
    convertedDate.value = ''
    convertedISO.value = ''
    relativeTime.value = ''
    return
  }

  try {
    const ts = Number(inputTimestamp.value)
    const ms = tsUnit.value === 'seconds' ? ts * 1000 : ts
    const date = new Date(ms)

    if (isNaN(date.getTime())) {
      convertedDate.value = 'Invalid timestamp'
      convertedISO.value = ''
      relativeTime.value = ''
      return
    }

    convertedDate.value = date.toLocaleString()
    convertedISO.value = date.toISOString()
    relativeTime.value = getRelativeTime(date)
  } catch {
    convertedDate.value = 'Invalid timestamp'
    convertedISO.value = ''
    relativeTime.value = ''
  }
}

const convertDateToTimestamp = () => {
  if (!inputDatetime.value) {
    dateToTs.value = null
    dateToTsMs.value = null
    return
  }

  const date = new Date(inputDatetime.value)
  if (isNaN(date.getTime())) {
    dateToTs.value = null
    dateToTsMs.value = null
    return
  }

  dateToTsMs.value = date.getTime()
  dateToTs.value = Math.floor(date.getTime() / 1000)
}

// A restored datetime/unit has no computed results yet (derived, never
// persisted) — regenerate them once so results are visible without a
// keystroke. (inputTimestamp itself usually will NOT have restored — see the
// KNOWN QUIRK note above — so in practice this mostly benefits a restored
// inputDatetime.)
if (toolState.restored) {
  convertTimestamp()
  convertDateToTimestamp()
}

const copyValue = async (value: string) => {
  await clipboard.copyWithFeedback(value)
}

onMounted(() => {
  updateCurrentTime()
  interval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.timestamp-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.panel {
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.panel-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: 0 0 var(--space-lg) 0;
}

.time-display,
.result-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.time-item,
.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-item label,
.result-item label {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  font-weight: 500;
}

.value-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.time-item code,
.result-item code,
.ref-value {
  flex: 1;
  display: block;
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  border: 1px solid var(--dt-border);
  word-break: break-all;
}

.relative-code {
  color: var(--dt-brand);
  font-weight: 500;
}

.copy-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-sm);
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.copy-icon:hover {
  color: var(--dt-text-primary);
  border-color: var(--dt-border-strong);
  background: var(--dt-surface-2);
}

.copy-icon i {
  font-size: 12px;
}

.converter-section {
  margin-bottom: var(--space-xl);
}

.converter-section:last-child {
  margin-bottom: 0;
}

.converter-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--dt-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
}

.converter-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.timestamp-input {
  flex: 1;
  font-family: var(--font-mono);
}

.datetime-input {
  width: 100%;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  color: var(--dt-text-primary);
  margin-bottom: var(--space-md);
}

.datetime-input:focus {
  outline: none;
  border-color: var(--dt-brand);
  box-shadow: var(--focus-ring);
}

.unit-toggle {
  display: flex;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 26px;
  font-size: var(--text-xs);
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-mono);
}

.toggle-btn.active {
  background: var(--dt-brand-light);
  color: var(--dt-brand);
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--dt-border);
}

.reference-section {
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-md);
}

.reference-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ref-label {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .timestamp-container {
    grid-template-columns: 1fr;
  }

  .reference-grid {
    grid-template-columns: 1fr;
  }
}
</style>
