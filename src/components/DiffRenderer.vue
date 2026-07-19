<!--
  DiffRenderer.vue - Orchestrator over the diff core.

  Computes via useDiffWorker() (worker-backed with a sync fallback) and
  renders the resulting DiffModel through DiffRows/DiffIndicators — no
  v-html, no HTML re-parsing, no diff2html.

  Props:
  - leftText, rightText: string - compared texts
  - mode: 'split' | 'unified' - display mode (parent-controlled)
  - ignoreWhitespace, ignoreCase: boolean - compare options
  - language: string - unused internally; kept for the external contract
  - leftFilename, rightFilename: optional patch header names (wired by callers in Task 10)

  Events:
  - @diff-computed: emitted with the model's stats after each successful compute
  - @mode-changed: requests a mode change (the parent owns `mode`)
  - @options-changed: requests an ignoreWhitespace/ignoreCase change
-->

<template>
  <div class="diff-renderer" :class="{ [`diff-renderer--${mode}`]: true }">
    <!-- Stats Bar (above toolbar) — hides zero-count chips -->
    <div v-if="hasChanges" class="diff-stats-bar">
      <span v-if="stats.added > 0" class="diff-stat-chip diff-stat-chip--added">
        +{{ stats.added }} added
      </span>
      <span v-if="stats.removed > 0" class="diff-stat-chip diff-stat-chip--removed">
        -{{ stats.removed }} removed
      </span>
      <span v-if="stats.modified > 0" class="diff-stat-chip diff-stat-chip--modified">
        ~{{ stats.modified }} modified
      </span>
    </div>

    <!-- Sticky Toolbar -->
    <div class="diff-toolbar">
      <!-- Segmented Control: Split / Unified -->
      <div class="diff-segmented-control">
        <button
          v-for="viewMode in viewModes"
          :key="viewMode.value"
          @click="updateMode(viewMode.value as 'split' | 'unified')"
          :class="['diff-segment', { 'diff-segment--active': mode === viewMode.value }]"
          :title="viewMode.title"
        >
          <span class="diff-segment-icon">{{ viewMode.icon }}</span>
          <span class="diff-segment-label">{{ viewMode.label }}</span>
        </button>
      </div>

      <!-- Toggle Options -->
      <div class="diff-toggles">
        <label v-for="toggle in toggleOptions" :key="toggle.key" class="diff-toggle">
          <input
            type="checkbox"
            :checked="toggle.checked"
            @change="toggle.onChange(($event.target as HTMLInputElement).checked)"
            class="diff-toggle-input"
          />
          <span class="diff-toggle-label">{{ toggle.label }}</span>
        </label>
      </div>

      <!-- Context Line Control -->
      <div class="diff-context-control">
        <span class="diff-context-label">Context:</span>
        <select v-model.number="contextLines" class="diff-context-select">
          <option :value="0">0</option>
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="Infinity">All</option>
        </select>
      </div>

      <!-- Action Buttons -->
      <div class="diff-actions">
        <button
          class="diff-action-btn"
          :disabled="!hasChanges"
          @click="copyDiffToClipboard"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x2398;</span>
          <span class="diff-action-text">Copy</span>
        </button>
        <button
          class="diff-action-btn"
          :disabled="!hasChanges"
          @click="downloadPatch"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x21E9;</span>
          <span class="diff-action-text">Export</span>
        </button>
      </div>

      <!-- Navigation placeholder — Task 9 replaces these internals with real
           model-driven hunk tracking (activeRowIndex + DiffRows.scrollToRow). -->
      <div v-if="hasChanges" class="diff-nav">
        <button
          class="diff-nav-btn"
          @click="navPrev"
          title="Previous change (Alt+Up)"
        >&#x25B2;</button>
        <span class="diff-nav-counter">–/–</span>
        <button
          class="diff-nav-btn"
          @click="navNext"
          title="Next change (Alt+Down)"
        >&#x25BC;</button>
      </div>
    </div>

    <!-- Diff Content -->
    <div class="diff-content" :class="{ 'diff-content--loading': state === 'computing' }">
      <!-- Computing State -->
      <div v-if="state === 'computing'" class="diff-loading">
        <div class="diff-loading-spinner"></div>
        <span class="diff-loading-text">Computing differences...</span>
        <span class="diff-loading-elapsed">{{ elapsedSeconds }}s</span>
        <button
          v-if="elapsedMs >= 300"
          class="diff-action-btn"
          @click="diffWorker.cancel()"
        >Cancel</button>
      </div>

      <!-- Too-Large State -->
      <div v-else-if="state === 'too-large'" class="dv-limit-message">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorDetail }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="state === 'error'" class="dv-error-message">
        <i class="pi pi-times-circle"></i>
        <span>{{ errorDetail }}</span>
        <button class="diff-action-btn" @click="runCompute">Retry</button>
      </div>

      <!-- Done State: model-driven rows, or the empty state when there's nothing to show -->
      <template v-else-if="model">
        <DiffIndicators :indicators="model.indicators" />

        <DiffRows v-if="hasChanges" :rows="model.rows" :mode="mode" :active-row-index="null" />

        <div v-else class="diff-empty-state">
          <div class="diff-empty-icon">
            <i class="pi pi-info-circle"></i>
          </div>
          <div class="diff-empty-message">
            <h3>No differences found</h3>
            <p>The texts are identical with the current settings.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DiffRows from '@/components/diff/DiffRows.vue'
import DiffIndicators from '@/components/diff/DiffIndicators.vue'
import { useDiffWorker } from '@/composables/useDiffWorker'
import { useClipboard } from '@/composables/useClipboard'
import { buildPatch } from '@/lib/diff/patch'
import type { DiffStats } from '@/lib/diff/model'

// Props
interface Props {
  leftText: string
  rightText: string
  mode?: 'split' | 'unified'
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  language?: string
  leftFilename?: string
  rightFilename?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'split',
  ignoreWhitespace: false,
  ignoreCase: false,
  language: 'plaintext'
})

// Emits
interface DiffOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
}

interface Emits {
  'diff-computed': [stats: DiffStats]
  'mode-changed': [mode: 'split' | 'unified']
  'options-changed': [options: DiffOptions]
}

const emit = defineEmits<Emits>()

// Compute — one worker-backed pipeline; no HTML re-parse.
const diffWorker = useDiffWorker()
const { state, model, errorDetail, elapsedMs } = diffWorker

const contextLines = ref(3)

const runCompute = (): void => {
  diffWorker.compute(props.leftText, props.rightText, {
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    context: contextLines.value
  })
}

// ONE watch drives every recompute. `mode` is deliberately excluded:
// switching Split/Unified re-renders the cached model through DiffRows and
// never recomputes. No onMounted compute call either — the immediate watch
// already runs synchronously during setup, so an onMounted call would
// double-compute on first mount.
watch(
  [() => props.leftText, () => props.rightText, () => props.ignoreWhitespace, () => props.ignoreCase, contextLines],
  runCompute,
  { immediate: true }
)

// Fires once per successful compute. Never fires for too-large/error, since
// model is null in both of those states.
watch(model, (m) => {
  if (m) emit('diff-computed', m.stats)
})

const elapsedSeconds = computed(() => (elapsedMs.value / 1000).toFixed(1))

const stats = computed<DiffStats>(() => model.value?.stats ?? { added: 0, removed: 0, modified: 0 })
const hasChanges = computed(() =>
  model.value !== null && stats.value.added + stats.value.removed + stats.value.modified > 0
)

const clipboard = useClipboard()

const patchActionTitle = computed(() =>
  props.ignoreWhitespace || props.ignoreCase
    ? 'Patch of the original texts — includes differences the active ignore options hide'
    : 'Unified diff of the compared texts'
)

// Copy/Export always build fresh from the ORIGINAL texts at the displayed
// context — never the folded/normalized comparison text — so exported
// patches stay appliable regardless of the active ignore options.
const buildCurrentPatch = (): string =>
  buildPatch(props.leftText, props.rightText, {
    context: contextLines.value,
    leftName: props.leftFilename,
    rightName: props.rightFilename
  })

const copyDiffToClipboard = async (): Promise<void> => {
  if (!hasChanges.value) return
  await clipboard.copyWithFeedback(buildCurrentPatch(), 'Diff')
}

const downloadPatch = (): void => {
  if (!hasChanges.value) return
  const blob = new Blob([buildCurrentPatch()], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'diff.patch'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Configuration
const viewModes = [
  { value: 'split', label: 'Split', icon: '‖', title: 'Side-by-side view' },
  { value: 'unified', label: 'Unified', icon: '≡', title: 'Unified diff view' }
]

// Toggle options
const toggleOptions = computed(() => [
  {
    key: 'whitespace',
    label: 'Whitespace',
    checked: props.ignoreWhitespace,
    onChange: updateIgnoreWhitespace
  },
  {
    key: 'case',
    label: 'Case',
    checked: props.ignoreCase,
    onChange: updateIgnoreCase
  }
])

const updateMode = (newMode: 'split' | 'unified'): void => {
  emit('mode-changed', newMode)
  emitOptionsChanged()
}

const updateIgnoreWhitespace = (value: boolean): void => {
  emitOptionsChanged({ ignoreWhitespace: value })
}

const updateIgnoreCase = (value: boolean): void => {
  emitOptionsChanged({ ignoreCase: value })
}

const emitOptionsChanged = (partialOptions?: Partial<DiffOptions>): void => {
  const options: DiffOptions = {
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    ...partialOptions
  }
  emit('options-changed', options)
}

// Navigation placeholder — Task 9 replaces these internals with real
// model-driven hunk tracking (activeRowIndex + DiffRows.scrollToRow()).
const navPrev = (): void => {}
const navNext = (): void => {}

// Keyboard shortcuts for navigation.
// Alt+Arrow diff navigation must not fire while typing: on macOS,
// Option+Arrow is word-navigation inside inputs.
const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable === true)
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (!event.altKey || isEditableTarget(event.target)) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    navNext()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    navPrev()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // Auto-switch to unified on small screens
  if (window.innerWidth < 768 && props.mode === 'split') {
    updateMode('unified')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* ===== DIFF RENDERER BASE ===== */
.diff-renderer {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-1);
  overflow: hidden;
  background: var(--dt-surface-1);
}

/* ===== STATS BAR (above toolbar) ===== */
.diff-stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
  align-items: center;
}

.diff-stat-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: 20px;
  border: 1px solid transparent;
  line-height: 1.5;
  white-space: nowrap;
}

.diff-stat-chip--added {
  background: var(--diff-added-bg);
  border-color: var(--diff-added-border);
  color: var(--dt-success);
}

.diff-stat-chip--removed {
  background: var(--diff-removed-bg);
  border-color: var(--diff-removed-border);
  color: var(--dt-danger);
}

.diff-stat-chip--modified {
  background: var(--dt-warning-light);
  border-color: rgba(245, 158, 11, 0.25);
  color: var(--dt-warning);
}

/* ===== STICKY TOOLBAR ===== */
.diff-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  padding: var(--space-sm) var(--space-lg);
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* ===== SEGMENTED CONTROL ===== */
.diff-segmented-control {
  display: flex;
  background: var(--dt-surface-2);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.diff-segment {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-sans);
  color: var(--dt-text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  line-height: 1.4;
  text-transform: none;
}

.diff-segment:hover:not(.diff-segment--active) {
  color: var(--dt-text-primary);
}

.diff-segment-icon {
  font-size: 14px;
  line-height: 1;
  font-weight: bold;
}

.diff-segment--active {
  background: var(--dt-brand);
  color: #ffffff;
  box-shadow: var(--elevation-1);
}

/* ===== TOGGLE OPTIONS ===== */
.diff-toggles {
  display: flex;
  gap: var(--space-md);
}

.diff-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin-bottom: 0;
}

.diff-toggle-input {
  width: 14px;
  height: 14px;
  accent-color: var(--dt-brand);
  cursor: pointer;
}

.diff-toggle-label {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  text-transform: none;
}

/* ===== CONTEXT LINE CONTROL ===== */
.diff-context-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.diff-context-label {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  white-space: nowrap;
  text-transform: none;
}

.diff-context-select {
  padding: 2px 6px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-sm);
  color: var(--dt-text-primary);
  cursor: pointer;
  text-transform: none;
}

.diff-context-select:focus {
  outline: none;
  border-color: var(--dt-brand);
}

/* ===== ACTION BUTTONS ===== */
.diff-actions {
  display: flex;
  gap: 6px;
}

.diff-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-sm);
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  line-height: 1.4;
  text-transform: none;
}

.diff-action-icon {
  font-size: 13px;
  line-height: 1;
}

.diff-action-btn:hover {
  border-color: var(--dt-brand);
  color: var(--dt-brand);
  background: var(--dt-brand-light);
}

.diff-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

/* ===== NAVIGATION ===== */
.diff-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding-left: var(--space-md);
  border-left: 1px solid var(--dt-border);
}

.diff-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-sm);
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 9px;
  line-height: 1;
}

.diff-nav-btn:hover {
  border-color: var(--dt-brand);
  color: var(--dt-brand);
  background: var(--dt-brand-light);
}

.diff-nav-counter {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-secondary);
  white-space: nowrap;
  min-width: 32px;
  text-align: center;
}

/* ===== DIFF CONTENT ===== */
.diff-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  position: relative;
  overflow: auto;
}

.diff-content--loading {
  justify-content: center;
  align-items: center;
}

/* ===== COMPUTING STATE ===== */
.diff-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-2xl);
}

.diff-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--dt-border);
  border-top: 3px solid var(--dt-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.diff-loading-text {
  font-size: var(--text-base);
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-medium);
}

.diff-loading-elapsed {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--dt-text-tertiary);
  margin-top: calc(-1 * var(--space-md));
}

/* ===== TOO-LARGE / ERROR STATES ===== */
.dv-limit-message,
.dv-error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.dv-limit-message i,
.dv-error-message i {
  font-size: var(--text-3xl);
}

.dv-limit-message {
  color: var(--dt-warning);
}

.dv-error-message {
  color: var(--dt-danger);
}

.dv-limit-message span,
.dv-error-message span {
  color: var(--dt-text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

/* ===== EMPTY STATE ===== */
.diff-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  color: var(--dt-text-secondary);
}

.diff-empty-icon {
  margin-bottom: var(--space-lg);
}

.diff-empty-icon i {
  font-size: var(--text-3xl);
  color: var(--dt-text-tertiary);
}

.diff-empty-message {
  text-align: center;
  max-width: 400px;
}

.diff-empty-message h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.diff-empty-message p {
  font-size: var(--text-base);
  color: var(--dt-text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .diff-toolbar {
    gap: var(--space-sm);
    padding: var(--space-sm);
  }

  .diff-toggles {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .diff-nav {
    border-left: none;
    padding-left: 0;
    margin-left: 0;
  }

  .diff-stats-bar {
    padding: var(--space-sm);
  }
}

@media (max-width: 480px) {
  .diff-segment-label {
    display: none;
  }

  .diff-toggle-label {
    display: none;
  }

  .diff-action-text {
    display: none;
  }

  .diff-context-label {
    display: none;
  }

  .diff-stats-bar {
    gap: 4px;
  }

  .diff-stat-chip {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>
