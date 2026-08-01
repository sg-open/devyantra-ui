<!--
  CronParser.vue — UI for the Cron Parser tool (spec D4 UI), consuming the
  pure engine in src/lib/cron.ts (parseCron/describeCron/nextRuns, CronError
  with .field — see that file's header for the engine's own design notes).

  A single 300ms-debounced pipeline (mirrors JsonExplorer's scheduleParse):
  edits to `expression` land in `debouncedExpression`, and one computed
  (`result`) re-runs parseCron + describeCron + nextRuns together against
  that debounced value. Any CronError thrown by ANY of the three — a grammar
  error from parseCron/describeCron, or the "no match in 4 years" bound from
  nextRuns — collapses the whole computed to a single `{ kind: 'error' }`
  state rendered as one inline `.field-error` block (never a toast), exactly
  like RegexTester's pattern-error and JsonExplorer's parse-error. There is
  no partial state: either the full description/next-runs/breakdown render,
  or the error does — matching how both sibling tools already behave.

  cron.ts intentionally exports nothing beyond CronError/ParsedCron/
  parseCron/describeCron/nextRuns (see its Task 5 report), so the per-field
  breakdown table below lists RESOLVED NUMBERS (the literal Set<number>
  contents), not re-derived weekday/month names — re-implementing those
  name tables here would just duplicate cron.ts's private lookup tables.
-->
<template>
  <div class="tool-panel cron-parser">
    <header class="tool-hero">
      <h1>Cron Expression Parser</h1>
      <p>Paste a standard 5-field cron expression and get a plain-English description, the next 10 run times in local time and UTC, and a per-field breakdown of exactly what each part resolved to — all computed instantly in your browser.</p>
    </header>

    <div class="cron-container">
      <div class="cron-input-row">
        <div class="expression-field">
          <label class="input-label" for="cron-expression">Cron expression</label>
          <input
            id="cron-expression"
            v-model="expression"
            type="text"
            class="p-inputtext expression-input"
            :class="{ 'p-invalid': result.kind === 'error' }"
            placeholder="minute hour day-of-month month day-of-week"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-describedby="cron-expression-error"
          />
        </div>

        <div class="presets-field">
          <label class="input-label" for="cron-presets">Presets</label>
          <select id="cron-presets" class="p-inputtext presets-select" @change="onPresetSelect">
            <option value="" selected>Choose a preset…</option>
            <option v-for="p in PRESETS" :key="p.label" :value="p.expression">
              {{ p.label }} ({{ p.expression }})
            </option>
          </select>
        </div>
      </div>

      <div class="results-section">
        <div v-if="result.kind === 'empty'" class="empty-state">
          <i class="pi pi-stopwatch"></i>
          <p>Enter a cron expression above to see its description and next runs.</p>
        </div>

        <p v-else-if="result.kind === 'error'" id="cron-expression-error" class="field-error" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ result.error.message }}</span>
        </p>

        <template v-else>
          <p class="cron-description">{{ result.description }}</p>

          <div class="cron-runs-wrap">
            <table class="cron-runs-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Local</th>
                  <th scope="col">UTC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(run, i) in result.runs" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td>{{ formatLocal(run) }}</td>
                  <td>{{ formatUTC(run) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="cron-breakdown-wrap">
            <table class="cron-breakdown-table">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Raw</th>
                  <th scope="col">Resolved</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in breakdown" :key="f.key">
                  <td>{{ f.label }}</td>
                  <td><code>{{ f.raw }}</code></td>
                  <td>{{ f.resolved }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ToolActions
            :copy-text="nextRunsText"
            copy-label="Next runs"
            @clear="clearAll"
          />
        </template>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Cron Parser?</h2>
      <p>A cron parser reads a standard 5-field cron expression — minute, hour, day of month, month, and day of week — and tells you exactly when it runs, in plain English, instead of leaving you to decode the syntax by hand. DevYantra also previews the next 10 actual run times in both your local timezone and UTC, and breaks down each field so you can see precisely what it resolved to.</p>
      <p>Everything runs locally: parsing, the plain-English description, and the next-run calculation all happen in your browser tab, with nothing ever sent to a server.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Plain-English description of any standard 5-field cron expression</li>
        <li>Next 10 run times, shown in both local time and UTC</li>
        <li>Per-field breakdown table (minute, hour, day of month, month, day of week)</li>
        <li>One-click presets for common schedules</li>
        <li>Full standard syntax: names, ranges, steps, and lists</li>
      </ul>

      <h2>How to Use the Cron Parser</h2>
      <ol>
        <li>Type a standard 5-field cron expression into the field above, or choose one of the built-in presets.</li>
        <li>Read the plain-English description that appears below it.</li>
        <li>Check the next runs table and the per-field breakdown to confirm the schedule does what you expect.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>Why isn't my 6-field expression accepted?</h3>
        <p>DevYantra parses the standard 5-field cron format (minute, hour, day-of-month, month, day-of-week). Six- and seven-field variants that add a leading seconds field or a trailing year field are non-standard extensions used by some job schedulers, not the original cron format — they are rejected with a clear error rather than silently misinterpreted.</p>

        <h3>Which timezone are the run times in?</h3>
        <p>The next-runs table shows every time in both your local timezone (whatever your system clock and browser are set to) and UTC, side by side. Daylight saving transitions follow your local system clock, exactly as a real cron daemon on that machine would observe them.</p>

        <h3>What does the day-of-month/day-of-week OR rule mean?</h3>
        <p>When BOTH the day-of-month and day-of-week fields are restricted (neither is left as a bare *), classic cron matches a day when EITHER condition is true, not only when both are — this is the traditional vixie cron behavior. For example, "0 0 13 * FRI" runs at midnight on the 13th of every month AND on every Friday, not only on Fridays that happen to land on the 13th. If only one of the two fields is restricted, that field alone controls which days match.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/timestamp-converter">Timestamp Converter</router-link>
        <router-link to="/tools/regex-tester">Regex Tester</router-link>
        <router-link to="/tools/json-explorer">JSON Explorer</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from 'vue'
import { parseCron, describeCron, nextRuns, CronError, type ParsedCron } from '@/lib/cron'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

interface CronPreset {
  label: string
  expression: string
}

const PRESETS: CronPreset[] = [
  { label: 'Hourly', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Weekdays 9am', expression: '0 9 * * 1-5' },
  { label: 'Monthly 1st', expression: '0 0 1 * *' },
  { label: 'Every 15 min', expression: '*/15 * * * *' }
]

const toast = useToast()

const expression = ref('30 9 * * 1-5')

// Per-tool persistence (D2) — restores synchronously, BEFORE the debounce
// watcher below is registered, so the immediate:true first compute below
// sees the restored expression rather than racing it (mirrors JsonExplorer
// and RegexTester's identical restore-before-watch pattern).
const toolState = useToolState('cron-parser', { expression })

// Computation runs 300ms after the last edit, against this separate ref —
// never directly off `expression` — so rapid typing never recomputes
// (parse + describe + a next-10-runs scan) on every keystroke.
const debouncedExpression = ref('30 9 * * 1-5')
let debounceHandle: ReturnType<typeof setTimeout> | null = null

const scheduleCompute = (): void => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => {
    debounceHandle = null
    debouncedExpression.value = expression.value
  }, 300)
}

onScopeDispose(() => {
  if (debounceHandle !== null) clearTimeout(debounceHandle)
})

watch(expression, scheduleCompute, { immediate: true })

type CronResult =
  | { kind: 'empty' }
  | { kind: 'error'; error: CronError }
  | { kind: 'success'; description: string; parsed: ParsedCron; runs: Date[] }

// One pipeline, one state: a CronError from parseCron/describeCron (a
// grammar/range/name problem) OR from nextRuns (the "no match within 4
// years" bound, e.g. "0 0 31 2 *") both collapse to the same inline
// `.field-error` — there is no view that shows a description next to an
// error from a later stage.
const result = computed<CronResult>(() => {
  const expr = debouncedExpression.value.trim()
  if (!expr) return { kind: 'empty' }
  try {
    const parsed = parseCron(expr)
    const description = describeCron(expr)
    const runs = nextRuns(expr, new Date(), 10)
    return { kind: 'success', description, parsed, runs }
  } catch (e) {
    if (e instanceof CronError) return { kind: 'error', error: e }
    throw e
  }
})

const pad2 = (n: number): string => String(n).padStart(2, '0')

const formatLocal = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`

const formatUTC = (d: Date): string =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`

interface FieldMeta {
  key: keyof Pick<ParsedCron, 'minute' | 'hour' | 'dom' | 'month' | 'dow'>
  label: string
}

const FIELD_META: FieldMeta[] = [
  { key: 'minute', label: 'Minute' },
  { key: 'hour', label: 'Hour' },
  { key: 'dom', label: 'Day of month' },
  { key: 'month', label: 'Month' },
  { key: 'dow', label: 'Day of week' }
]

// field / raw / resolved-count-or-list(<=10) — per the component contract.
const breakdown = computed(() => {
  if (result.value.kind !== 'success') return []
  const rawFields = debouncedExpression.value.trim().split(/\s+/)
  const parsed = result.value.parsed
  return FIELD_META.map((f, i) => {
    const sorted = [...parsed[f.key]].sort((a, b) => a - b)
    const resolved = sorted.length <= 10 ? sorted.join(', ') : `${sorted.length} values`
    return { key: f.key, label: f.label, raw: rawFields[i] ?? '', resolved }
  })
})

const nextRunsText = computed(() => {
  if (result.value.kind !== 'success') return ''
  return result.value.runs
    .map((run, i) => `${i + 1}. ${formatLocal(run)} local  |  ${formatUTC(run)}`)
    .join('\n')
})

const onPresetSelect = (event: Event): void => {
  const select = event.target as HTMLSelectElement
  if (select.value) expression.value = select.value
  select.value = '' // reset to the placeholder so it can insert again
}

const clearAll = (): void => {
  const previous = expression.value

  expression.value = ''

  if (previous.trim()) {
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          expression.value = previous
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared expression.
  toolState.flushSave()
}
</script>

<style scoped>
.cron-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.cron-input-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.expression-field,
.presets-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.expression-input,
.presets-select {
  width: 100%;
  font-family: var(--font-mono);
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

.field-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  padding: var(--space-lg);
  background: var(--dt-danger-light);
  border: 1px solid rgba(198, 40, 40, 0.2);
  border-radius: var(--radius-md);
  color: var(--dt-danger);
  font-size: var(--text-sm);
}

.cron-description {
  margin: 0;
  padding: var(--space-lg);
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-brand);
}

.cron-runs-wrap,
.cron-breakdown-wrap {
  overflow-x: auto;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
}

.cron-runs-table,
.cron-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.cron-runs-table th,
.cron-runs-table td,
.cron-breakdown-table th,
.cron-breakdown-table td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--dt-border);
  vertical-align: top;
  font-family: var(--font-mono);
}

.cron-runs-table th,
.cron-breakdown-table th {
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-family: var(--font-sans);
}

.cron-runs-table tbody tr:last-child td,
.cron-breakdown-table tbody tr:last-child td {
  border-bottom: none;
}

.cron-breakdown-table code {
  font-family: var(--font-mono);
}

@media (max-width: 768px) {
  .cron-input-row {
    grid-template-columns: 1fr;
  }
}
</style>
