<!--
  MonacoDiffRenderer.vue - Monaco Editor based diff renderer

  Advanced diff renderer using Monaco Editor for professional-grade diff experience
  Features editor-grade behavior with inline word diff and advanced editing capabilities
-->

<template>
  <div class="monaco-diff-renderer" :class="{ 'monaco-diff-renderer--loading': isLoading }">
    <!-- Loading State -->
    <div v-if="isLoading" class="monaco-loading">
      <div class="monaco-loading-spinner"></div>
      <span class="monaco-loading-text">Loading Monaco Editor...</span>
    </div>

    <!-- Monaco Diff Editor Container -->
    <div
      v-show="!isLoading"
      ref="editorContainer"
      class="monaco-editor-container"
      :style="{ height: `${height}px` }"
    ></div>

    <!-- Editor Controls -->
    <div v-if="!isLoading" class="monaco-controls">
      <div class="monaco-control-group">
        <button
          @click="toggleInlineDiff"
          :class="{ 'monaco-control-active': inlineDiff }"
          class="monaco-control-button"
          title="Toggle inline diff"
        >
          <i class="pi pi-eye"></i>
          Inline Diff
        </button>

        <button
          @click="toggleWhitespace"
          :class="{ 'monaco-control-active': renderWhitespace }"
          class="monaco-control-button"
          title="Show whitespace"
        >
          <i class="pi pi-circle"></i>
          Whitespace
        </button>

        <button
          @click="toggleWordWrap"
          :class="{ 'monaco-control-active': wordWrap === 'on' }"
          class="monaco-control-button"
          title="Toggle word wrap"
        >
          <i class="pi pi-arrows-h"></i>
          Word Wrap
        </button>
      </div>

      <div class="monaco-control-group">
        <select
          v-model="selectedLanguage"
          @change="updateLanguage"
          class="monaco-language-select"
        >
          <option value="plaintext">Plain Text</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="sql">SQL</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="xml">XML</option>
          <option value="yaml">YAML</option>
        </select>

        <button
          @click="formatDocument"
          class="monaco-control-button"
          title="Format document"
        >
          <i class="pi pi-align-left"></i>
          Format
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'

// Props
interface Props {
  leftText: string
  rightText: string
  language?: string
  theme?: 'light' | 'dark'
  height?: number
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'plaintext',
  theme: 'light',
  height: 600,
  readOnly: true
})

// Emits
interface Emits {
  'text-changed': [{ left: string; right: string }]
  'editor-ready': [editor: Monaco.editor.IStandaloneDiffEditor]
}

const emit = defineEmits<Emits>()

// State
const isLoading = ref(true)
const editorContainer = ref<HTMLElement>()
const diffEditor = ref<Monaco.editor.IStandaloneDiffEditor>()
const monaco = ref<typeof Monaco>()

// Editor settings
const selectedLanguage = ref(props.language)
const inlineDiff = ref(true)
const renderWhitespace = ref(false)
const wordWrap = ref<'off' | 'on'>('off')

// Initialize Monaco Editor
const initializeEditor = async () => {
  if (!editorContainer.value) return

  try {
    isLoading.value = true

    // Configure Monaco loader
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.53.0/min/vs'
      }
    })

    // Load Monaco
    const monacoInstance = await loader.init()
    monaco.value = monacoInstance

    // Configure theme
    monacoInstance.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editor.selectionBackground': '#c8e1ff',
        'diffEditor.insertedTextBackground': '#e6ffed',
        'diffEditor.removedTextBackground': '#ffeef0',
        'diffEditor.insertedLineBackground': '#f0fff4',
        'diffEditor.removedLineBackground': '#ffeef0'
      }
    })

    monacoInstance.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'diffEditor.insertedTextBackground': '#238636',
        'diffEditor.removedTextBackground': '#f85149',
        'diffEditor.insertedLineBackground': '#0d4429',
        'diffEditor.removedLineBackground': '#67060c'
      }
    })

    // Create diff editor
    diffEditor.value = monacoInstance.editor.createDiffEditor(editorContainer.value, {
      theme: props.theme === 'dark' ? 'custom-dark' : 'custom-light',
      readOnly: props.readOnly,
      enableSplitViewResizing: true,
      renderSideBySide: true,
      ignoreTrimWhitespace: false,
      renderIndicators: true,
      originalEditable: !props.readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      wordWrap: wordWrap.value,
      renderWhitespace: renderWhitespace.value ? 'all' : 'none',
      diffWordWrap: 'inherit',
      maxComputationTime: 5000,
      maxFileSize: 50,
      diffAlgorithm: 'advanced'
    })

    // Set initial models
    updateModels()

    // Listen for content changes
    if (!props.readOnly) {
      const originalModel = diffEditor.value.getOriginalEditor().getModel()
      const modifiedModel = diffEditor.value.getModifiedEditor().getModel()

      originalModel?.onDidChangeContent(() => {
        emit('text-changed', {
          left: originalModel.getValue(),
          right: modifiedModel?.getValue() || ''
        })
      })

      modifiedModel?.onDidChangeContent(() => {
        emit('text-changed', {
          left: originalModel?.getValue() || '',
          right: modifiedModel.getValue()
        })
      })
    }

    emit('editor-ready', diffEditor.value)
    isLoading.value = false

  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
    isLoading.value = false
  }
}

// Update editor models
const updateModels = () => {
  if (!diffEditor.value || !monaco.value) return

  const originalModel = monaco.value.editor.createModel(
    props.leftText,
    selectedLanguage.value
  )

  const modifiedModel = monaco.value.editor.createModel(
    props.rightText,
    selectedLanguage.value
  )

  diffEditor.value.setModel({
    original: originalModel,
    modified: modifiedModel
  })
}

// Control methods
const toggleInlineDiff = () => {
  inlineDiff.value = !inlineDiff.value
  if (diffEditor.value) {
    diffEditor.value.updateOptions({
      renderSideBySide: !inlineDiff.value
    })
  }
}

const toggleWhitespace = () => {
  renderWhitespace.value = !renderWhitespace.value
  if (diffEditor.value) {
    diffEditor.value.updateOptions({
      renderWhitespace: renderWhitespace.value ? 'all' : 'none'
    })
  }
}

const toggleWordWrap = () => {
  wordWrap.value = wordWrap.value === 'on' ? 'off' : 'on'
  if (diffEditor.value) {
    diffEditor.value.updateOptions({
      wordWrap: wordWrap.value
    })
  }
}

const updateLanguage = () => {
  if (!diffEditor.value || !monaco.value) return

  const model = diffEditor.value.getModel()
  if (model) {
    monaco.value.editor.setModelLanguage(model.original, selectedLanguage.value)
    monaco.value.editor.setModelLanguage(model.modified, selectedLanguage.value)
  }
}

const formatDocument = async () => {
  if (!diffEditor.value) return

  const originalEditor = diffEditor.value.getOriginalEditor()
  const modifiedEditor = diffEditor.value.getModifiedEditor()

  try {
    await originalEditor.getAction('editor.action.formatDocument')?.run()
    await modifiedEditor.getAction('editor.action.formatDocument')?.run()
  } catch (error) {
    console.warn('Format document failed:', error)
  }
}

// Watchers
watch([() => props.leftText, () => props.rightText], () => {
  if (diffEditor.value) {
    updateModels()
  }
})

watch(() => props.language, (newLanguage) => {
  selectedLanguage.value = newLanguage
  updateLanguage()
})

watch(() => props.theme, (newTheme) => {
  if (diffEditor.value) {
    monaco.value?.editor.setTheme(newTheme === 'dark' ? 'custom-dark' : 'custom-light')
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  initializeEditor()
})

onUnmounted(() => {
  if (diffEditor.value) {
    diffEditor.value.dispose()
  }
})

// Expose methods for parent component
defineExpose({
  formatDocument,
  toggleInlineDiff,
  toggleWhitespace,
  toggleWordWrap,
  getEditor: () => diffEditor.value
})
</script>

<style scoped>
.monaco-diff-renderer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--dt-surface-0);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
}

.monaco-diff-renderer--loading {
  justify-content: center;
  align-items: center;
}

/* Loading State */
.monaco-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-3xl);
  height: 100%;
}

.monaco-loading-spinner {
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

.monaco-loading-text {
  font-size: var(--text-base);
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* Editor Container */
.monaco-editor-container {
  flex: 1;
  width: 100%;
  min-height: 400px;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

/* Controls */
.monaco-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-lg);
  background: var(--dt-surface-1);
  border-top: 1px solid var(--dt-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  gap: var(--space-lg);
}

.monaco-control-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.monaco-control-button {
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

.monaco-control-button:hover {
  color: var(--dt-text-primary);
  border-color: var(--dt-brand);
  background: var(--dt-brand-light);
}

.monaco-control-button.monaco-control-active {
  color: var(--dt-brand-contrast);
  background: var(--dt-brand);
  border-color: var(--dt-brand);
}

.monaco-language-select {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
  background: var(--dt-surface-0);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.monaco-language-select:focus {
  outline: none;
  border-color: var(--dt-brand);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .monaco-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .monaco-control-group {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .monaco-control-button {
    font-size: var(--text-xs);
    padding: var(--space-xs);
  }

  .monaco-language-select {
    font-size: var(--text-xs);
  }
}
</style>

<!-- Global Monaco Editor styles -->
<style>
/* Monaco Editor theme integration */
.monaco-editor .margin {
  background: var(--dt-surface-1) !important;
}

.monaco-editor .monaco-editor-background {
  background: var(--dt-surface-0) !important;
}

.monaco-editor .view-line {
  color: var(--dt-text-primary) !important;
}

.monaco-diff-editor .monaco-editor .margin {
  background: var(--dt-surface-1) !important;
}

.monaco-diff-editor .monaco-editor .monaco-editor-background {
  background: var(--dt-surface-0) !important;
}

/* Diff highlighting adjustments */
.monaco-diff-editor .char-insert {
  background-color: var(--dt-success-light) !important;
}

.monaco-diff-editor .char-delete {
  background-color: var(--dt-danger-light) !important;
}

.monaco-diff-editor .line-insert {
  background-color: rgba(34, 197, 94, 0.1) !important;
}

.monaco-diff-editor .line-delete {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

/* Scrollbar styling */
.monaco-editor .monaco-scrollable-element .scrollbar {
  background: var(--dt-surface-1) !important;
}

.monaco-editor .monaco-scrollable-element .slider {
  background: var(--dt-border) !important;
}

.monaco-editor .monaco-scrollable-element .slider:hover {
  background: var(--dt-text-tertiary) !important;
}
</style>