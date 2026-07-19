<!--
  DiffRenderer.vue - Diff renderer powered by diff2html

  Props:
  - leftText: string - Original text content
  - rightText: string - Modified text content
  - mode: 'split' | 'unified' - Display mode
  - ignoreWhitespace: boolean - Ignore whitespace differences
  - ignoreCase: boolean - Ignore case differences
  - language: string - Programming language for syntax highlighting

  Events:
  - @diff-computed: Emitted when diff computation is complete
  - @mode-changed: Emitted when display mode changes
  - @options-changed: Emitted when diff options change
-->

<template>
  <div class="diff-renderer" :class="{ [`diff-renderer--${mode}`]: true }">
    <!-- Stats Bar (above diff) — hides zero-count chips -->
    <div v-if="displayStats" class="diff-stats-bar">
      <span v-if="displayStats.additions > 0" class="diff-stat-chip diff-stat-chip--added">
        +{{ displayStats.additions }} added
      </span>
      <span v-if="displayStats.deletions > 0" class="diff-stat-chip diff-stat-chip--removed">
        -{{ displayStats.deletions }} removed
      </span>
      <span v-if="displayStats.modifications > 0" class="diff-stat-chip diff-stat-chip--modified">
        ~{{ displayStats.modifications }} modified
      </span>
      <span class="diff-stat-chip diff-stat-chip--time">
        {{ displayStats.computeTime }}ms
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
          :disabled="!lastPatch"
          @click="copyDiffToClipboard"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x2398;</span>
          <span class="diff-action-text">Copy</span>
        </button>
        <button
          class="diff-action-btn"
          :disabled="!lastPatch"
          @click="downloadPatch"
          :title="patchActionTitle"
        >
          <span class="diff-action-icon">&#x21E9;</span>
          <span class="diff-action-text">Export</span>
        </button>
      </div>

      <!-- Navigation -->
      <div v-if="navigation.hasChanges.value" class="diff-nav">
        <button
          class="diff-nav-btn"
          @click="navigation.prevChange()"
          title="Previous change (Alt+Up)"
        >&#x25B2;</button>
        <span class="diff-nav-counter">
          {{ navigation.currentIndex.value >= 0 ? `${navigation.currentIndex.value + 1}/${navigation.totalChanges.value}` : `–/${navigation.totalChanges.value}` }}
        </span>
        <button
          class="diff-nav-btn"
          @click="navigation.nextChange()"
          title="Next change (Alt+Down)"
        >&#x25BC;</button>
      </div>
    </div>

    <!-- Diff Content -->
    <div class="diff-content" :class="{ 'diff-content--loading': isLoading }">
      <!-- Loading State -->
      <div v-if="isLoading" class="diff-loading">
        <div class="diff-loading-spinner"></div>
        <span class="diff-loading-text">Computing differences...</span>
      </div>

      <!-- diff2html Renderer -->
      <div
        v-else-if="shouldShowDiff"
        class="diff-container"
        ref="diffContainerRef"
        v-html="diffOutputHtml"
      />

      <!-- Empty State -->
      <div v-else class="diff-empty-state">
        <div class="diff-empty-icon">
          <i class="pi pi-info-circle"></i>
        </div>
        <div class="diff-empty-message">
          <h3>No differences found</h3>
          <p>The texts are identical with the current settings.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { createTwoFilesPatch } from 'diff'
import { html as diff2htmlHtml, parse as diff2htmlParse } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import { useDiffNavigation } from '@/composables/useDiffNavigation'
import { useClipboard } from '@/composables/useClipboard'
import type { DiffFile } from 'diff2html/lib/types'

export interface DiffStats {
  additions: number
  deletions: number
  modifications: number
  totalLines: number
  computeTime: number
}

// Props
interface Props {
  leftText: string
  rightText: string
  mode?: 'split' | 'unified'
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  language?: string
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

// State
const isLoading = ref(false)
const diffOutputHtml = ref('')
const diffContainerRef = ref<HTMLElement>()
const contextLines = ref(3)
const lastPatch = ref('')

// Navigation
const navigation = useDiffNavigation(diffContainerRef)

const clipboard = useClipboard()

const patchActionTitle = computed(() =>
  props.ignoreWhitespace || props.ignoreCase
    ? 'Patch of the original texts — includes differences the active ignore options hide'
    : 'Unified diff of the compared texts'
)

// Configuration
const viewModes = [
  { value: 'split', label: 'Split', icon: '\u2016', title: 'Side-by-side view' },
  { value: 'unified', label: 'Unified', icon: '\u2261', title: 'Unified diff view' }
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

const renderedStats = ref<DiffStats | null>(null)

const shouldShowDiff = computed(() => {
  return diffOutputHtml.value.length > 0
})

const displayStats = computed(() => renderedStats.value)

// Compute stats from the diff2html parsed output (same source as the rendered diff)
const computeStatsFromParsed = (diffJson: DiffFile[], computeTime: number): DiffStats => {
  let additions = 0
  let deletions = 0
  let modifications = 0
  let contextLines = 0

  for (const file of diffJson) {
    for (const block of file.blocks) {
      let pendingDels = 0

      for (const line of block.lines) {
        if (line.type === 'delete') {
          pendingDels++
        } else if (line.type === 'insert') {
          if (pendingDels > 0) {
            // Paired delete+insert = modification
            modifications++
            pendingDels--
          } else {
            additions++
          }
        } else {
          // context line — flush pending deletes as pure deletions
          deletions += pendingDels
          pendingDels = 0
          contextLines++
        }
      }

      // Flush remaining deletes at end of block
      deletions += pendingDels
    }
  }

  // totalLines = original file's line count (unchanged + deleted + modified)
  const totalLines = contextLines + deletions + modifications

  return { additions, deletions, modifications, totalLines, computeTime }
}

// Methods
// Folding affects the compared/displayed diff only. Exported patches
// never use folded text — see the lastPatch assignment below.
const foldText = (text: string): string => {
  let t = props.ignoreCase ? text.toLowerCase() : text
  if (props.ignoreWhitespace) {
    t = t
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .replace(/^ +| +$/gm, '')
  }
  return t
}

const computeDiff = async () => {
  if (!props.leftText && !props.rightText) {
    diffOutputHtml.value = ''
    lastPatch.value = ''
    renderedStats.value = null
    return
  }

  isLoading.value = true
  renderedStats.value = null

  try {
    await nextTick()

    const startTime = performance.now()
    const left = foldText(props.leftText)
    const right = foldText(props.rightText)

    // Full-context patch over the compared texts — source of truth for stats
    const leftLineCount = left.split('\n').length
    const rightLineCount = right.split('\n').length
    const fullCtx = Math.max(leftLineCount, rightLineCount)

    const fullPatch = createTwoFilesPatch(
      'original', 'modified',
      left, right,
      '', '',
      { context: fullCtx }
    )

    const fullDiffJson = diff2htmlParse(fullPatch)
    const computeTime = Math.round(performance.now() - startTime)
    const stats = computeStatsFromParsed(fullDiffJson, computeTime)

    if (stats.additions === 0 && stats.deletions === 0 && stats.modifications === 0) {
      // Identical under the current options — show empty state, and make sure
      // Copy/Export cannot emit a stale patch from a previous comparison.
      diffOutputHtml.value = ''
      lastPatch.value = ''
      return
    }

    renderedStats.value = stats

    // Render with the user-chosen context lines
    const renderCtx = contextLines.value === Infinity ? fullCtx : contextLines.value
    let renderPatch = fullPatch
    if (renderCtx !== fullCtx) {
      renderPatch = createTwoFilesPatch(
        'original', 'modified',
        left, right,
        '', '',
        { context: renderCtx }
      )
    }

    const renderDiffJson = diff2htmlParse(renderPatch)
    diffOutputHtml.value = diff2htmlHtml(renderDiffJson, {
      outputFormat: props.mode === 'split' ? 'side-by-side' : 'line-by-line',
      drawFileList: false,
      matching: 'lines',
      renderNothingWhenEmpty: true
    })

    // Copy/Export always reflect the ORIGINAL texts (never case-folded, no
    // ignore options) so exported patches stay appliable.
    lastPatch.value = createTwoFilesPatch(
      'original', 'modified',
      props.leftText, props.rightText,
      '', '',
      { context: fullCtx }
    )

    emit('diff-computed', stats)
  } catch (error) {
    console.error('Error computing diff:', error)
  } finally {
    isLoading.value = false
  }
}

const updateMode = (newMode: 'split' | 'unified') => {
  emit('mode-changed', newMode)
  emitOptionsChanged()
}

const updateIgnoreWhitespace = (value: boolean) => {
  emitOptionsChanged({ ignoreWhitespace: value })
}

const updateIgnoreCase = (value: boolean) => {
  emitOptionsChanged({ ignoreCase: value })
}

const emitOptionsChanged = (partialOptions?: Partial<DiffOptions>) => {
  const options: DiffOptions = {
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    ...partialOptions
  }
  emit('options-changed', options)
}

// Copy & Export — uses the same patch that was rendered
const copyDiffToClipboard = async () => {
  if (!lastPatch.value) return
  await clipboard.copyWithFeedback(lastPatch.value, 'Diff')
}

const downloadPatch = () => {
  if (!lastPatch.value) return
  const blob = new Blob([lastPatch.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'diff.patch'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Watchers
watch([() => props.leftText, () => props.rightText], () => {
  computeDiff()
}, { immediate: true })

watch(
  [() => props.ignoreWhitespace, () => props.ignoreCase, () => props.mode, contextLines],
  () => {
    computeDiff()
  }
)

// Restart navigation observation whenever the diff container element changes.
// When mode switches or text changes, computeDiff() sets isLoading=true which
// destroys the old diff-container div. The old MutationObserver dies with it.
// Watching the template ref ensures we start a fresh observer on the new element.
watch(diffContainerRef, async (newEl) => {
  navigation.stopObserving()
  if (newEl) {
    await nextTick()
    navigation.startObserving()
  }
})

// Keyboard shortcuts for navigation
// Alt+Arrow diff navigation must not fire while typing: on macOS,
// Option+Arrow is word-navigation inside inputs.
const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable === true)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!event.altKey || isEditableTarget(event.target)) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    navigation.nextChange()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    navigation.prevChange()
  }
}

onMounted(() => {
  computeDiff()
  document.addEventListener('keydown', handleKeydown)

  // Auto-switch to unified on small screens
  if (window.innerWidth < 768 && props.mode === 'split') {
    updateMode('unified')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  navigation.stopObserving()
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

.diff-stat-chip--info {
  background: var(--dt-surface-2);
  border-color: var(--dt-border);
  color: var(--dt-text-secondary);
}

.diff-stat-chip--time {
  background: var(--dt-surface-2);
  border-color: var(--dt-border);
  color: var(--dt-text-tertiary);
  margin-left: auto;
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

/* ===== LOADING STATE ===== */
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

/* ===== DIFF CONTAINER ===== */
.diff-container {
  flex: 1;
  position: relative;
  background: var(--diff-code-bg);
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

<!-- diff2html theme integration — override CSS variables, not layout -->
<style>
/* ===== DIFF2HTML THEME OVERRIDES ===== */

/*
 * Strategy: Override diff2html's CSS custom properties so its own layout
 * rules stay intact. This avoids breaking the absolute-positioned line
 * numbers and padding-based content alignment.
 */

/* Prevent text-transform inheritance (terminal mode) */
.diff-renderer,
.diff-renderer * {
  text-transform: none !important;
}

/* Map diff2html CSS variables to our design tokens */
.diff-container {
  /* Base */
  --d2h-bg-color: var(--diff-gutter-bg);
  --d2h-border-color: var(--dt-border);
  --d2h-dim-color: var(--diff-gutter-text);
  --d2h-line-border-color: var(--dt-border);

  /* File header (hidden, but override anyway) */
  --d2h-file-header-bg-color: var(--dt-surface-2);
  --d2h-file-header-border-color: var(--dt-border);

  /* Placeholders (empty side in side-by-side) */
  --d2h-empty-placeholder-bg-color: var(--dt-surface-2);
  --d2h-empty-placeholder-border-color: var(--dt-border);

  /* Insertions */
  --d2h-ins-bg-color: var(--diff-added-bg);
  --d2h-ins-border-color: var(--diff-added-border);
  --d2h-ins-highlight-bg-color: var(--diff-added-word-bg);

  /* Deletions */
  --d2h-del-bg-color: var(--diff-removed-bg);
  --d2h-del-border-color: var(--diff-removed-border);
  --d2h-del-highlight-bg-color: var(--diff-removed-word-bg);

  /* Changes (modified lines — del side and ins side) */
  --d2h-change-del-color: var(--diff-removed-bg);
  --d2h-change-ins-color: var(--diff-added-bg);

  /* Info / hunk headers */
  --d2h-info-bg-color: var(--dt-surface-2);
  --d2h-info-border-color: var(--dt-border);

  /* Selected */
  --d2h-selected-color: var(--dt-brand-light);

  /* Dark scheme variables (mapped to same tokens — we force light class) */
  --d2h-dark-bg-color: var(--diff-gutter-bg);
  --d2h-dark-border-color: var(--dt-border);
  --d2h-dark-dim-color: var(--diff-gutter-text);
  --d2h-dark-line-border-color: var(--dt-border);
  --d2h-dark-file-header-bg-color: var(--dt-surface-2);
  --d2h-dark-file-header-border-color: var(--dt-border);
  --d2h-dark-empty-placeholder-bg-color: var(--dt-surface-2);
  --d2h-dark-empty-placeholder-border-color: var(--dt-border);
  --d2h-dark-ins-bg-color: var(--diff-added-bg);
  --d2h-dark-ins-border-color: var(--diff-added-border);
  --d2h-dark-ins-highlight-bg-color: var(--diff-added-word-bg);
  --d2h-dark-del-bg-color: var(--diff-removed-bg);
  --d2h-dark-del-border-color: var(--diff-removed-border);
  --d2h-dark-del-highlight-bg-color: var(--diff-removed-word-bg);
  --d2h-dark-change-del-color: var(--diff-removed-bg);
  --d2h-dark-change-ins-color: var(--diff-added-bg);
  --d2h-dark-info-bg-color: var(--dt-surface-2);
  --d2h-dark-info-border-color: var(--dt-border);
}

/* Hide file header (we show our own stats bar) */
.diff-container .d2h-file-header {
  display: none !important;
}

/* Remove file wrapper border/margin */
.diff-container .d2h-file-wrapper {
  border: none !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

/* Font overrides — keep layout, change font */
.diff-container .d2h-diff-table {
  font-family: var(--font-mono) !important;
}

.diff-container .d2h-code-line-ctn {
  font-family: var(--font-mono) !important;
  color: var(--dt-text-primary) !important;
}

.diff-container .d2h-code-line-prefix {
  font-family: var(--font-mono) !important;
  color: var(--diff-gutter-text) !important;
}

/* Code line — transparent bg so td's del/ins color shows through uniformly */
.diff-container .d2h-code-line,
.diff-container .d2h-code-side-line {
  background: transparent !important;
  width: 100% !important;
  box-sizing: border-box !important;
  padding-right: 1em !important;
}

/* Unchanged rows — neutral background */
.diff-container .d2h-cntx:not(.d2h-emptyplaceholder) {
  background-color: var(--diff-code-bg) !important;
}

/* Scrollable panel background — matches neutral so no edge gap shows */
.diff-container .d2h-file-side-diff,
.diff-container .d2h-code-wrapper {
  background: var(--diff-code-bg) !important;
}

/* Line number colors */
.diff-container .d2h-code-linenumber,
.diff-container .d2h-code-side-linenumber {
  background-color: var(--diff-gutter-bg) !important;
  color: var(--diff-gutter-text) !important;
  border-color: var(--dt-border) !important;
}

/* Added line — line number gutter */
.diff-container .d2h-ins .d2h-code-linenumber,
.diff-container .d2h-ins .d2h-code-side-linenumber,
.diff-container .d2h-ins.d2h-change .d2h-code-linenumber,
.diff-container .d2h-ins.d2h-change .d2h-code-side-linenumber {
  background-color: var(--diff-added-gutter-bg) !important;
  border-color: var(--diff-added-border) !important;
}

/* Removed line — line number gutter */
.diff-container .d2h-del .d2h-code-linenumber,
.diff-container .d2h-del .d2h-code-side-linenumber,
.diff-container .d2h-del.d2h-change .d2h-code-linenumber,
.diff-container .d2h-del.d2h-change .d2h-code-side-linenumber {
  background-color: var(--diff-removed-gutter-bg) !important;
  border-color: var(--diff-removed-border) !important;
}

/* Word-level highlights */
.diff-container .d2h-code-line del,
.diff-container .d2h-code-side-line del {
  background-color: var(--diff-removed-word-bg) !important;
  text-decoration: none !important;
  border-radius: 3px;
  padding: 1px 2px;
}

.diff-container .d2h-code-line ins,
.diff-container .d2h-code-side-line ins {
  background-color: var(--diff-added-word-bg) !important;
  text-decoration: none !important;
  border-radius: 3px;
  padding: 1px 2px;
}

/* ===== HIDE HUNK HEADERS ===== */
.diff-container tr:has(> td.d2h-info) {
  display: none !important;
}

/* ===== EMPTY FILLER ROWS — subtle diagonal stripe ===== */
.diff-container .d2h-code-side-emptyplaceholder,
.diff-container .d2h-emptyplaceholder {
  background: repeating-linear-gradient(
    -45deg,
    var(--dt-surface-2),
    var(--dt-surface-2) 3px,
    var(--dt-border) 3px,
    var(--dt-border) 4px
  ) !important;
}

/* ===== VERTICAL SEPARATOR between left and right panels ===== */
/* diff2html uses two separate .d2h-file-side-diff divs side-by-side */
.diff-container .d2h-file-side-diff + .d2h-file-side-diff {
  border-left: 2px solid var(--dt-border) !important;
}

/* ===== +/- SIGN PREFIX — bolder and colored ===== */
.diff-container .d2h-code-line-prefix {
  font-weight: 700 !important;
  user-select: none;
}

.diff-container .d2h-del .d2h-code-line-prefix {
  color: var(--dt-danger) !important;
}

.diff-container .d2h-ins .d2h-code-line-prefix {
  color: var(--dt-success) !important;
}

/* ===== GUTTER — distinct background + right border ===== */
.diff-container .d2h-code-side-linenumber,
.diff-container .d2h-code-linenumber {
  background-color: var(--diff-gutter-bg) !important;
  color: var(--diff-gutter-text) !important;
  border-right: 1px solid var(--dt-border) !important;
  font-weight: 500 !important;
}

/* Row hover */
.diff-container tr:hover .d2h-code-line,
.diff-container tr:hover .d2h-code-side-line {
  background: var(--diff-row-hover-bg) !important;
}

.diff-container tr:hover .d2h-code-linenumber,
.diff-container tr:hover .d2h-code-side-linenumber {
  background-color: var(--dt-surface-2) !important;
}

/* ===== NAVIGATION HIGHLIGHT ===== */
.diff-nav-highlight {
  outline: 2px solid var(--diff-highlight-ring);
  outline-offset: -2px;
  border-radius: 2px;
  animation: diff-highlight-pulse 1.5s ease-out;
}

@keyframes diff-highlight-pulse {
  0% {
    outline-color: var(--diff-highlight-ring);
    outline-width: 2px;
  }
  30% {
    outline-color: var(--dt-brand);
    outline-width: 3px;
  }
  100% {
    outline-color: var(--diff-highlight-ring);
    outline-width: 2px;
  }
}

/* ===== SCROLLBAR STYLING ===== */
.diff-container ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.diff-container ::-webkit-scrollbar-track {
  background: var(--dt-surface-1);
}

.diff-container ::-webkit-scrollbar-thumb {
  background: var(--dt-text-tertiary);
  border: 2px solid var(--dt-surface-1);
  border-radius: 4px;
}

.diff-container ::-webkit-scrollbar-thumb:hover {
  background: var(--dt-text-secondary);
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  .diff-nav-highlight {
    animation: none;
  }
}
</style>
