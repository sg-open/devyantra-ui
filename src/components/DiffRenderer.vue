<!--
  DiffRenderer.vue - Robust side-by-side diff renderer

  Props:
  - leftText: string - Original text content
  - rightText: string - Modified text content
  - mode: 'split' | 'unified' - Display mode
  - granularity: 'line' | 'word' | 'char' - Comparison granularity
  - ignoreWhitespace: boolean - Ignore whitespace differences
  - ignoreCase: boolean - Ignore case differences
  - language: string - Programming language for syntax highlighting
  - virtualScrollEnabled: boolean - Enable virtual scrolling for large files
  - theme: 'light' | 'dark' - Theme mode (uses design tokens)

  Events:
  - @diff-computed: Emitted when diff computation is complete
  - @scroll-sync: Emitted when scroll synchronization occurs
  - @mode-changed: Emitted when display mode changes
  - @options-changed: Emitted when diff options change
-->

<template>
  <div class="diff-renderer" :class="{ [`diff-renderer--${mode}`]: true }">
    <!-- Options Panel -->
    <div class="diff-options-panel">
      <div class="diff-options-group">
        <label class="diff-option-label">View:</label>
        <div class="diff-option-buttons">
          <button
            v-for="viewMode in viewModes"
            :key="viewMode.value"
@click="updateMode(viewMode.value as 'split' | 'unified')"
            :class="{
              'diff-option-button': true,
              'diff-option-button--active': mode === viewMode.value
            }"
            :title="viewMode.title"
          >
            <i :class="viewMode.icon"></i>
            {{ viewMode.label }}
          </button>
        </div>
      </div>

      <div class="diff-options-group">
        <label class="diff-option-label">Granularity:</label>
        <div class="diff-option-buttons">
          <button
            v-for="gran in granularityOptions"
            :key="gran.value"
@click="updateGranularity(gran.value as 'line' | 'word' | 'char')"
            :class="{
              'diff-option-button': true,
              'diff-option-button--active': granularity === gran.value
            }"
            :title="gran.title"
          >
            {{ gran.label }}
          </button>
        </div>
      </div>

      <div class="diff-options-group">
        <div class="diff-option-toggles">
          <label class="diff-toggle">
            <input
              type="checkbox"
              :checked="ignoreWhitespace"
@change="updateIgnoreWhitespace(($event.target as HTMLInputElement).checked)"
              class="diff-toggle-input"
            />
            <span class="diff-toggle-label">Ignore Whitespace</span>
          </label>

          <label class="diff-toggle">
            <input
              type="checkbox"
              :checked="ignoreCase"
@change="updateIgnoreCase(($event.target as HTMLInputElement).checked)"
              class="diff-toggle-input"
            />
            <span class="diff-toggle-label">Ignore Case</span>
          </label>

          <label class="diff-toggle">
            <input
              type="checkbox"
              :checked="virtualScrollEnabled"
@change="updateVirtualScroll(($event.target as HTMLInputElement).checked)"
              class="diff-toggle-input"
            />
            <span class="diff-toggle-label">Virtual Scroll</span>
          </label>

          <label class="diff-toggle">
            <input
              type="checkbox"
              :checked="useMonacoEditor"
@change="updateUseMonaco(($event.target as HTMLInputElement).checked)"
              class="diff-toggle-input"
            />
            <span class="diff-toggle-label">Monaco Editor</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Diff Content -->
    <div class="diff-content" :class="{ 'diff-content--loading': isLoading }">
      <!-- Loading State -->
      <div v-if="isLoading" class="diff-loading">
        <div class="diff-loading-spinner"></div>
        <span class="diff-loading-text">Computing differences...</span>
      </div>

      <!-- Monaco Editor Renderer (when enabled) -->
      <div v-else-if="useMonacoEditor && shouldShowDiff" class="monaco-container">
        <MonacoDiffRenderer
          :left-text="processedLeftText"
          :right-text="processedRightText"
          :language="detectedLanguage"
          :theme="theme"
          :height="600"
          :read-only="true"
          @text-changed="onMonacoTextChanged"
          @editor-ready="onMonacoReady"
          class="monaco-diff-editor"
        />
      </div>

      <!-- Vue-diff Renderer (default) -->
      <div v-else-if="shouldShowDiff" class="diff-container">
        <Diff
          :prev="processedLeftText"
          :current="processedRightText"
          :mode="mode"
          :language="detectedLanguage"
          :input-delay="120"
          :virtual-scroll="virtualScrollConfig"
          :folding="true"
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

    <!-- Stats Panel -->
    <div v-if="diffStats" class="diff-stats-panel">
      <div class="diff-stats-item">
        <span class="diff-stats-label">Added:</span>
        <span class="diff-stats-value diff-stats-value--added">{{ diffStats.additions }}</span>
      </div>
      <div class="diff-stats-item">
        <span class="diff-stats-label">Removed:</span>
        <span class="diff-stats-value diff-stats-value--removed">{{ diffStats.deletions }}</span>
      </div>
      <div class="diff-stats-item">
        <span class="diff-stats-label">Modified:</span>
        <span class="diff-stats-value diff-stats-value--modified">{{ diffStats.modifications }}</span>
      </div>
      <div class="diff-stats-item">
        <span class="diff-stats-label">Lines:</span>
        <span class="diff-stats-value">{{ diffStats.totalLines }}</span>
      </div>
      <div class="diff-stats-item">
        <span class="diff-stats-label">Time:</span>
        <span class="diff-stats-value">{{ diffStats.computeTime }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Diff } from 'vue-diff'
import 'vue-diff/dist/index.css'
import * as JSDiff from 'jsdiff'
import MonacoDiffRenderer from './MonacoDiffRenderer.vue'
import type * as Monaco from 'monaco-editor'

// Props
interface Props {
  leftText: string
  rightText: string
  mode?: 'split' | 'unified'
  granularity?: 'line' | 'word' | 'char'
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  language?: string
  virtualScrollEnabled?: boolean
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'split',
  granularity: 'line',
  ignoreWhitespace: false,
  ignoreCase: false,
  language: 'plaintext',
  virtualScrollEnabled: false,
  theme: 'light'
})

// Emits
interface Emits {
  'diff-computed': [stats: DiffStats]
  'scroll-sync': [scrollTop: number]
  'mode-changed': [mode: 'split' | 'unified']
  'options-changed': [options: DiffOptions]
  'text-changed': [data: { left: string; right: string }]
  'editor-ready': [editor: Monaco.editor.IStandaloneDiffEditor]
}

const emit = defineEmits<Emits>()

// Types
interface DiffStats {
  additions: number
  deletions: number
  modifications: number
  totalLines: number
  computeTime: number
}

interface DiffOptions {
  granularity: 'line' | 'word' | 'char'
  ignoreWhitespace: boolean
  ignoreCase: boolean
  virtualScrollEnabled: boolean
}

// State
const isLoading = ref(false)
const diffStats = ref<DiffStats | null>(null)
const processedLeftText = ref('')
const processedRightText = ref('')
const useMonacoEditor = ref(false)

// Configuration
const viewModes = [
  { value: 'split', label: 'Split', icon: 'pi pi-columns', title: 'Side-by-side view' },
  { value: 'unified', label: 'Unified', icon: 'pi pi-align-left', title: 'Unified diff view' }
]

const granularityOptions = [
  { value: 'line', label: 'Line', title: 'Compare line by line' },
  { value: 'word', label: 'Word', title: 'Compare word by word' },
  { value: 'char', label: 'Char', title: 'Compare character by character' }
]

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

const shouldAutoEnableVirtualScroll = computed(() => {
  const totalLength = (props.leftText?.length || 0) + (props.rightText?.length || 0)
  const totalLines = (props.leftText?.split('\n').length || 0) + (props.rightText?.split('\n').length || 0)
  return totalLength > 1024 * 1024 || totalLines > 5000 // 1MB or 5k lines
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
    // Normalize whitespace
    processed = processed
      .replace(/\t/g, '    ') // Convert tabs to spaces
      .replace(/[ ]+/g, ' ')  // Collapse multiple spaces
      .replace(/[ ]+$/gm, '') // Remove trailing spaces
      .replace(/^\s+$/gm, '') // Remove whitespace-only lines
  }

  return processed
}

const computeDiff = async () => {
  if (!props.leftText && !props.rightText) {
    processedLeftText.value = ''
    processedRightText.value = ''
    diffStats.value = null
    return
  }

  isLoading.value = true
  const startTime = performance.now()

  try {
    await nextTick()

    // Apply granularity-specific processing
    let leftProcessed = props.leftText
    let rightProcessed = props.rightText

    if (props.granularity !== 'line') {
      // For word/char granularity, we need to precompute diff
      const diffFunction = props.granularity === 'char' ? JSDiff.diffChars : JSDiff.diffWords
      const changes = diffFunction(leftProcessed, rightProcessed, {
        ignoreCase: props.ignoreCase,
        ignoreWhitespace: props.ignoreWhitespace
      })

      // Reconstruct texts with change markers for vue-diff
      leftProcessed = ''
      rightProcessed = ''

      changes.forEach((change) => {
        if (change.removed) {
          leftProcessed += change.value
        } else if (change.added) {
          rightProcessed += change.value
        } else {
          leftProcessed += change.value
          rightProcessed += change.value
        }
      })
    }

    // Apply standard preprocessing
    processedLeftText.value = preprocessText(leftProcessed)
    processedRightText.value = preprocessText(rightProcessed)

    // Calculate basic stats
    const leftLines = processedLeftText.value.split('\n')
    const rightLines = processedRightText.value.split('\n')

    const lineDiff = JSDiff.diffLines(processedLeftText.value, processedRightText.value)

    let additions = 0
    let deletions = 0
    let modifications = 0

    lineDiff.forEach(change => {
      const lineCount = change.value.split('\n').length - 1
      if (change.added) {
        additions += lineCount
      } else if (change.removed) {
        deletions += lineCount
      }
    })

    // Estimate modifications (lines that appear as both added and removed)
    modifications = Math.min(additions, deletions)
    additions = Math.max(0, additions - modifications)
    deletions = Math.max(0, deletions - modifications)

    const computeTime = Math.round(performance.now() - startTime)

    diffStats.value = {
      additions,
      deletions,
      modifications,
      totalLines: Math.max(leftLines.length, rightLines.length),
      computeTime
    }

    emit('diff-computed', diffStats.value)

  } catch (error) {
    console.error('Error computing diff:', error)
    diffStats.value = null
  } finally {
    isLoading.value = false
  }
}

const updateMode = (newMode: 'split' | 'unified') => {
  emit('mode-changed', newMode)
  emitOptionsChanged()
}

const updateGranularity = (newGranularity: 'line' | 'word' | 'char') => {
  emitOptionsChanged({ granularity: newGranularity })
  computeDiff()
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
    granularity: props.granularity,
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    virtualScrollEnabled: props.virtualScrollEnabled,
    ...partialOptions
  }
  emit('options-changed', options)
}

const onDiffComputed = (event: { scrollTop?: number }) => {
  // Handle vue-diff events if needed
  if (event.scrollTop !== undefined) {
    emit('scroll-sync', event.scrollTop)
  }
}

// Event handlers for Monaco Editor
const onMonacoTextChanged = (data: { left: string; right: string }) => {
  emit('text-changed', data)
}

const onMonacoReady = (editor: Monaco.editor.IStandaloneDiffEditor) => {
  emit('editor-ready', editor)
}

const updateUseMonaco = (value: boolean) => {
  useMonacoEditor.value = value
  emitOptionsChanged()
}

// Watchers
watch([() => props.leftText, () => props.rightText], () => {
  computeDiff()
}, { immediate: true })

watch(
  [() => props.ignoreWhitespace, () => props.ignoreCase, () => props.granularity],
  () => {
    computeDiff()
  }
)

// Auto-enable virtual scroll for large files
watch(shouldAutoEnableVirtualScroll, (shouldEnable) => {
  if (shouldEnable && !props.virtualScrollEnabled) {
    updateVirtualScroll(true)
  }
})

onMounted(() => {
  computeDiff()
})
</script>

<style scoped>
/* ===== DIFF RENDERER BASE ===== */
.diff-renderer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--dt-surface-0);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* ===== OPTIONS PANEL ===== */
.diff-options-panel {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
  padding: var(--space-lg);
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
  align-items: center;
}

.diff-options-group {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.diff-option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
  white-space: nowrap;
}

.diff-option-buttons {
  display: flex;
  gap: var(--space-xs);
}

.diff-option-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-secondary);
  background: var(--dt-surface-0);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.diff-option-button:hover {
  color: var(--dt-text-primary);
  border-color: var(--dt-brand);
  background: var(--dt-brand-light);
}

.diff-option-button--active {
  color: var(--dt-brand-contrast);
  background: var(--dt-brand);
  border-color: var(--dt-brand);
}

.diff-option-toggles {
  display: flex;
  gap: var(--space-lg);
}

.diff-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
}

.diff-toggle-input {
  width: 16px;
  height: 16px;
  accent-color: var(--dt-brand);
  cursor: pointer;
}

.diff-toggle-label {
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
  cursor: pointer;
}

/* ===== DIFF CONTENT ===== */
.diff-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  position: relative;
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
  overflow: hidden;
}

.diff-viewer {
  width: 100%;
  height: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
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

/* ===== STATS PANEL ===== */
.diff-stats-panel {
  display: flex;
  gap: var(--space-xl);
  padding: var(--space-md) var(--space-lg);
  background: var(--dt-surface-1);
  border-top: 1px solid var(--dt-border);
  font-size: var(--text-sm);
}

.diff-stats-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.diff-stats-label {
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-medium);
}

.diff-stats-value {
  color: var(--dt-text-primary);
  font-weight: var(--font-weight-semibold);
}

.diff-stats-value--added {
  color: var(--dt-success);
}

.diff-stats-value--removed {
  color: var(--dt-danger);
}

.diff-stats-value--modified {
  color: var(--dt-warning);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .diff-options-panel {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-lg);
  }

  .diff-options-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .diff-option-buttons,
  .diff-option-toggles {
    flex-wrap: wrap;
  }

  .diff-stats-panel {
    flex-wrap: wrap;
    gap: var(--space-md);
  }
}

@media (max-width: 480px) {
  .diff-options-panel {
    padding: var(--space-md);
  }

  .diff-option-button {
    font-size: var(--text-xs);
    padding: var(--space-xs);
  }

  .diff-stats-panel {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .diff-stats-item {
    justify-content: space-between;
  }
}
</style>

<!-- Theme-agnostic vue-diff styling overrides -->
<style>
/* ===== VUE-DIFF THEME INTEGRATION ===== */
.diff-viewer .d2h-wrapper {
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  background: var(--dt-surface-0);
  font-family: var(--font-mono);
  overflow: hidden;
}

/* File header styling for GitHub-like design */
.diff-viewer .d2h-file-header {
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
  color: var(--dt-text-primary);
  padding: var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-viewer .d2h-file-header .d2h-file-name {
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-secondary);
}

.diff-viewer .d2h-file-stats {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-sm);
}

.diff-viewer .d2h-lines-added {
  color: var(--dt-success);
  font-weight: var(--font-weight-medium);
}

.diff-viewer .d2h-lines-deleted {
  color: var(--dt-danger);
  font-weight: var(--font-weight-medium);
}

.diff-viewer .d2h-code-wrapper {
  background: var(--dt-surface-0);
}

.diff-viewer .d2h-code-line {
  background: var(--dt-surface-0);
  color: var(--dt-text-primary);
  border: none;
  font-size: 13px;
  line-height: 1.45;
}

.diff-viewer .d2h-code-line-prefix {
  background: var(--dt-surface-1);
  color: var(--dt-text-tertiary);
  border-right: 1px solid var(--dt-border);
  text-align: center;
  user-select: none;
  width: 20px;
  padding: 2px 4px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.diff-viewer .d2h-code-linenumber {
  background: var(--dt-surface-1);
  color: var(--dt-text-tertiary);
  border-right: 1px solid var(--dt-border);
  text-align: right;
  user-select: none;
  font-size: 12px;
  min-width: 50px;
  padding: 2px var(--space-sm);
  font-family: var(--font-mono);
}

/* GitHub-style line highlighting */
.diff-viewer .d2h-ins {
  background: rgba(34, 197, 94, 0.1);
  color: var(--dt-text-primary);
}

.diff-viewer .d2h-ins .d2h-code-line-prefix {
  background: rgba(34, 197, 94, 0.15);
  color: var(--dt-success);
  font-weight: var(--font-weight-bold);
  width: 20px;
  text-align: center;
}

.diff-viewer .d2h-ins .d2h-code-linenumber {
  background: rgba(34, 197, 94, 0.15);
  color: var(--dt-text-tertiary);
  min-width: 50px;
  padding: 0 var(--space-sm);
}

.diff-viewer .d2h-del {
  background: rgba(239, 68, 68, 0.1);
  color: var(--dt-text-primary);
}

.diff-viewer .d2h-del .d2h-code-line-prefix {
  background: rgba(239, 68, 68, 0.15);
  color: var(--dt-danger);
  font-weight: var(--font-weight-bold);
  width: 20px;
  text-align: center;
}

.diff-viewer .d2h-del .d2h-code-linenumber {
  background: rgba(239, 68, 68, 0.15);
  color: var(--dt-text-tertiary);
  min-width: 50px;
  padding: 0 var(--space-sm);
}

.diff-viewer .d2h-cntx {
  background: var(--dt-surface-0);
  color: var(--dt-text-primary);
}

.diff-viewer .d2h-info {
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  border-top: 1px solid var(--dt-border);
  border-bottom: 1px solid var(--dt-border);
}

/* GitHub-style intraline highlighting */
.diff-viewer .d2h-ins ins {
  background: rgba(34, 197, 94, 0.4);
  color: var(--dt-text-primary);
  text-decoration: none;
  padding: 2px 1px;
  font-weight: var(--font-weight-semibold);
  border-radius: 2px;
}

.diff-viewer .d2h-del del {
  background: rgba(239, 68, 68, 0.4);
  color: var(--dt-text-primary);
  text-decoration: none;
  padding: 2px 1px;
  font-weight: var(--font-weight-semibold);
  border-radius: 2px;
}

/* Virtual scroll styling */
.diff-viewer .vue-recycle-scroller {
  height: 100%;
}

.diff-viewer .vue-recycle-scroller__slot {
  background: var(--dt-surface-0);
}

/* Split view specific styling for GitHub-like layout */
.diff-renderer--split .d2h-file-side-diff {
  border-left: 1px solid var(--dt-border);
  position: relative;
}

.diff-renderer--split .d2h-file-side-diff:first-child {
  border-left: none;
  border-right: 1px solid var(--dt-border);
}

.diff-renderer--split .d2h-file-side-diff .d2h-file-header {
  position: relative;
}

.diff-renderer--split .d2h-file-side-diff .d2h-file-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: var(--dt-border);
}

.diff-renderer--split .d2h-file-side-diff:first-child .d2h-file-header::before {
  display: none;
}

/* Enhanced table styling for split view */
.diff-renderer--split .d2h-code-wrapper table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.diff-renderer--split .d2h-code-line {
  border-bottom: 1px solid transparent;
  padding: 2px 0;
  line-height: 1.45;
}

/* Unified view specific styling */
.diff-renderer--unified .d2h-file-diff {
  border: none;
}

/* Scrollbar styling */
.diff-viewer ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.diff-viewer ::-webkit-scrollbar-track {
  background: var(--dt-surface-1);
}

.diff-viewer ::-webkit-scrollbar-thumb {
  background: var(--dt-border);
  border-radius: var(--radius-sm);
}

.diff-viewer ::-webkit-scrollbar-thumb:hover {
  background: var(--dt-text-tertiary);
}
</style>