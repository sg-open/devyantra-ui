<!--
  DiffRenderer.vue - World-class side-by-side diff renderer

  Props:
  - leftText: string - Original text content
  - rightText: string - Modified text content
  - mode: 'split' | 'unified' - Display mode
  - ignoreWhitespace: boolean - Ignore whitespace differences
  - ignoreCase: boolean - Ignore case differences
  - language: string - Programming language for syntax highlighting
  - virtualScrollEnabled: boolean - Enable virtual scrolling for large files
  - diffStats: DiffStats | null - Pre-computed diff stats from useDiffEngine

  Events:
  - @diff-computed: Emitted when diff computation is complete
  - @scroll-sync: Emitted when scroll synchronization occurs
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
      <span class="diff-stat-chip diff-stat-chip--info">
        {{ displayStats.totalLines }} lines
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

      <!-- Action Buttons -->
      <div class="diff-actions">
        <button
          class="diff-action-btn"
          @click="$emit('copy-diff')"
          title="Copy diff to clipboard"
        >
          <span class="diff-action-icon">&#x2398;</span>
          <span class="diff-action-text">Copy</span>
        </button>
        <button
          class="diff-action-btn"
          @click="$emit('download-patch')"
          title="Download as .patch file"
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

      <!-- Vue-diff Renderer -->
      <div v-else-if="shouldShowDiff" class="diff-container" ref="diffContainerRef">
        <Diff
          :prev="processedLeftText"
          :current="processedRightText"
          :mode="mode"
          :language="detectedLanguage"
          :input-delay="120"
          :virtual-scroll="virtualScrollConfig"
          :folding="true"
          :chk-words="true"
          @diff="onDiffComputed"
          class="diff-viewer"
        />
      </div>

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
import { Diff } from 'vue-diff'
import 'vue-diff/dist/index.css'
import type { DiffStats } from '@/composables/useDiffEngine'
import { useDiffNavigation } from '@/composables/useDiffNavigation'

// Props
interface Props {
  leftText: string
  rightText: string
  mode?: 'split' | 'unified'
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  language?: string
  virtualScrollEnabled?: boolean
  diffStats?: DiffStats | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'split',
  ignoreWhitespace: false,
  ignoreCase: false,
  language: 'plaintext',
  virtualScrollEnabled: false,
  diffStats: null
})

// Emits
interface DiffOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
  virtualScrollEnabled: boolean
}

interface Emits {
  'diff-computed': [stats: DiffStats]
  'scroll-sync': [scrollTop: number]
  'mode-changed': [mode: 'split' | 'unified']
  'options-changed': [options: DiffOptions]
  'copy-diff': []
  'download-patch': []
}

const emit = defineEmits<Emits>()

// State
const isLoading = ref(false)
const processedLeftText = ref('')
const processedRightText = ref('')
const diffContainerRef = ref<HTMLElement>()

// Navigation
const navigation = useDiffNavigation(diffContainerRef)

// Configuration
const viewModes = [
  { value: 'split', label: 'Split', icon: '\u2016', title: 'Side-by-side view' },
  { value: 'unified', label: 'Unified', icon: '\u2261', title: 'Unified diff view' }
]

// Toggle options computed for cleaner template
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
  },
  {
    key: 'virtualScroll',
    label: 'V-Scroll',
    checked: props.virtualScrollEnabled,
    onChange: updateVirtualScroll
  }
])

// Computed
const detectedLanguage = computed(() => {
  if (props.language && props.language !== 'plaintext') {
    return props.language
  }
  return detectLanguageFromContent(props.leftText || props.rightText)
})

const virtualScrollConfig = computed(() => {
  if (!props.virtualScrollEnabled) return false

  return {
    height: 600,
    lineMinHeight: 22,
    delay: 100
  }
})

const shouldShowDiff = computed(() => {
  return (props.leftText.trim() || props.rightText.trim()) &&
         processedLeftText.value !== processedRightText.value
})

const displayStats = computed(() => props.diffStats)

const shouldAutoEnableVirtualScroll = computed(() => {
  const totalLength = (props.leftText?.length || 0) + (props.rightText?.length || 0)
  const totalLines = (props.leftText?.split('\n').length || 0) + (props.rightText?.split('\n').length || 0)
  return totalLength > 1024 * 1024 || totalLines > 5000
})

// Methods
const detectLanguageFromContent = (text: string): string => {
  if (!text) return 'plaintext'

  const trimmed = text.trim()

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Continue with other detections
    }
  }

  // SQL detection
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(trimmed)) {
    return 'sql'
  }

  // HTML/XML detection
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return trimmed.includes('<!DOCTYPE html') || trimmed.includes('<html') ? 'html' : 'xml'
  }

  // JavaScript/TypeScript
  if (trimmed.includes('function') || trimmed.includes('=>') ||
      /\b(const|let|var)\s+\w+/.test(trimmed)) {
    return trimmed.includes('interface ') || trimmed.includes('type ') ? 'typescript' : 'javascript'
  }

  // CSS
  if (trimmed.includes('{') && trimmed.includes('}') &&
      trimmed.includes(':') && trimmed.includes(';')) {
    return 'css'
  }

  // Python
  if (/\b(def|import|from|class)\s+/.test(trimmed) || trimmed.includes('print(')) {
    return 'python'
  }

  return 'plaintext'
}

const preprocessText = (text: string): string => {
  if (!text) return ''

  let processed = text

  if (props.ignoreCase) {
    processed = processed.toLowerCase()
  }

  if (props.ignoreWhitespace) {
    processed = processed
      .replace(/\t/g, '    ')
      .replace(/[ ]+/g, ' ')
      .replace(/[ ]+$/gm, '')
      .replace(/^\s+$/gm, '')
  }

  return processed
}

const computeDiff = async () => {
  if (!props.leftText && !props.rightText) {
    processedLeftText.value = ''
    processedRightText.value = ''
    return
  }

  isLoading.value = true

  try {
    await nextTick()

    // Apply standard preprocessing (ignore whitespace / ignore case)
    processedLeftText.value = preprocessText(props.leftText)
    processedRightText.value = preprocessText(props.rightText)

    // Emit stats from the parent's diffEngine
    if (props.diffStats) {
      emit('diff-computed', props.diffStats)
    }
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
  computeDiff()
}

const updateIgnoreCase = (value: boolean) => {
  emitOptionsChanged({ ignoreCase: value })
  computeDiff()
}

const updateVirtualScroll = (value: boolean) => {
  emitOptionsChanged({ virtualScrollEnabled: value })
}

const emitOptionsChanged = (partialOptions?: Partial<DiffOptions>) => {
  const options: DiffOptions = {
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    virtualScrollEnabled: props.virtualScrollEnabled,
    ...partialOptions
  }
  emit('options-changed', options)
}

const onDiffComputed = (event: { scrollTop?: number }) => {
  if (event.scrollTop !== undefined) {
    emit('scroll-sync', event.scrollTop)
  }
}

// Watchers
watch([() => props.leftText, () => props.rightText], () => {
  computeDiff()
}, { immediate: true })

watch(
  [() => props.ignoreWhitespace, () => props.ignoreCase],
  () => {
    computeDiff()
  }
)

// Start navigation observation when diff container appears
watch(shouldShowDiff, async (show) => {
  if (show) {
    await nextTick()
    navigation.startObserving()
  } else {
    navigation.stopObserving()
  }
})

// Auto-enable virtual scroll for large files
watch(shouldAutoEnableVirtualScroll, (shouldEnable) => {
  if (shouldEnable && !props.virtualScrollEnabled) {
    updateVirtualScroll(true)
  }
})

// Keyboard shortcuts for navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.altKey) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      navigation.nextChange()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      navigation.prevChange()
    }
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
  backdrop-filter: blur(8px);
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
}

.diff-viewer {
  width: 100%;
  height: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
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

  .diff-stats-bar {
    gap: 4px;
  }

  .diff-stat-chip {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>

<!-- Theme-agnostic vue-diff styling overrides -->
<style>
/* ===== VUE-DIFF THEME INTEGRATION ===== */

/* Base wrapper styling */
.diff-viewer .vue-diff-wrapper {
  border: none;
  border-radius: 0;
  background: var(--diff-code-bg);
  font-family: var(--font-mono);
  overflow: hidden;
}

/* ===== ROW STYLING ===== */
.diff-viewer .vue-diff-row {
  background: var(--diff-code-bg);
  color: var(--dt-text-primary);
  font-size: 13px;
  line-height: 20px;
  transition: background-color 60ms ease;
}

.diff-viewer .vue-diff-row:hover {
  background: var(--diff-row-hover-bg);
}

/* ===== LINE NUMBER GUTTER ===== */
.diff-viewer .vue-diff-row .lineNum {
  background: var(--diff-gutter-bg);
  color: var(--diff-gutter-text);
  border-right: 1px solid var(--dt-border);
  text-align: right;
  user-select: none;
  font-size: 12px;
  min-width: 60px;
  padding: 0 var(--space-sm);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: background-color 60ms ease;
}

.diff-viewer .vue-diff-row:hover .lineNum {
  background: var(--dt-surface-2);
}

/* ===== CODE CELLS ===== */
.diff-viewer .vue-diff-row .code {
  background: transparent;
  color: var(--dt-text-primary);
  font-family: var(--font-mono);
  padding-left: var(--space-md);
}

/* ===== ADDED LINES ===== */
/* Covers both unified mode (class on row) and split mode (class on cell) */
.diff-viewer .vue-diff-cell-added,
.diff-viewer .code.vue-diff-cell-added {
  background: var(--diff-added-bg);
  color: var(--dt-text-primary);
}

/* Compound selector for split mode: .lineNum.vue-diff-cell-added (same element) */
.diff-viewer .lineNum.vue-diff-cell-added,
.diff-viewer .vue-diff-cell-added .lineNum {
  background: var(--diff-added-gutter-bg);
  color: var(--diff-gutter-text);
  border-right-color: var(--diff-added-border);
}

/* ===== REMOVED LINES ===== */
.diff-viewer .vue-diff-cell-removed,
.diff-viewer .code.vue-diff-cell-removed {
  background: var(--diff-removed-bg);
  color: var(--dt-text-primary);
}

.diff-viewer .lineNum.vue-diff-cell-removed,
.diff-viewer .vue-diff-cell-removed .lineNum {
  background: var(--diff-removed-gutter-bg);
  color: var(--diff-gutter-text);
  border-right-color: var(--diff-removed-border);
}

/* ===== WORD-LEVEL HIGHLIGHTING ===== */
.diff-viewer .vue-diff-cell-added span.modified {
  background: var(--diff-added-word-bg);
  color: var(--dt-text-primary);
  text-decoration: none;
  padding: 1px 2px;
  font-weight: inherit;
  border-radius: 3px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.diff-viewer .vue-diff-cell-removed span.modified {
  background: var(--diff-removed-word-bg);
  color: var(--dt-text-primary);
  text-decoration: none;
  padding: 1px 2px;
  font-weight: inherit;
  border-radius: 3px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

/* ===== FOLD SECTIONS ===== */
.diff-viewer .vue-diff-cell-fold {
  background: var(--dt-surface-2);
  color: var(--dt-text-tertiary);
  border-top: 1px solid var(--diff-fold-border);
  border-bottom: 1px solid var(--diff-fold-border);
  cursor: pointer;
  font-size: 12px;
  transition: background-color var(--transition-fast);
}

.diff-viewer .vue-diff-cell-fold:hover {
  background: var(--diff-fold-hover-bg);
  color: var(--dt-text-secondary);
}

/* ===== VIRTUAL SCROLL ===== */
.diff-viewer .vue-recycle-scroller {
  height: 100%;
}

.diff-viewer .vue-recycle-scroller__slot {
  background: var(--diff-code-bg);
}

/* ===== NAVIGATION HIGHLIGHT WITH PULSE ===== */
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
.diff-viewer ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.diff-viewer ::-webkit-scrollbar-track {
  background: var(--dt-surface-1);
}

.diff-viewer ::-webkit-scrollbar-thumb {
  background: var(--dt-text-tertiary);
  border: 2px solid var(--dt-surface-1);
  border-radius: 4px;
}

.diff-viewer ::-webkit-scrollbar-thumb:hover {
  background: var(--dt-text-secondary);
}

/* ===== HIDE VUE-DIFF WATERMARK ===== */
.diff-viewer .vue-diff-wrapper > footer,
.diff-viewer .vue-diff-wrapper > .vue-diff-footer,
.diff-viewer + div[class=""],
.diff-container > div:not(.diff-viewer) {
  display: none !important;
}

/* ===== SYNTAX HIGHLIGHTING OVERRIDES ===== */
.diff-viewer .hljs {
  background: transparent !important;
  color: var(--dt-text-primary);
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  .diff-nav-highlight {
    animation: none;
  }

  .diff-viewer .vue-diff-row {
    transition: none;
  }
}
</style>
