<template>
  <div class="diff-view glass-card">
    <!-- Header -->
    <div class="tool-header">
      <h2 class="tool-title">
        <i class="pi pi-sync mr-3"></i>
        Advanced Text/Code Diff Tool
      </h2>
      <p class="tool-description">
        Professional-grade text comparison with syntax highlighting, multiple view modes, and advanced features
      </p>
    </div>

    <!-- File Upload and Controls -->
    <div class="upload-controls">
      <div class="upload-section">
        <label class="upload-label">Upload Files (Optional)</label>
        <div class="upload-buttons">
          <Button
            @click="triggerFileUpload('left')"
            size="small"
            variant="outlined"
            class="upload-btn"
          >
            <i class="pi pi-upload"></i>
            Upload Original
          </Button>
          <Button
            @click="triggerFileUpload('right')"
            size="small"
            variant="outlined"
            class="upload-btn"
          >
            <i class="pi pi-upload"></i>
            Upload Modified
          </Button>
        </div>
        <input
          ref="fileInputLeft"
          type="file"
          accept=".txt,.json,.js,.ts,.vue,.css,.html,.xml,.sql,.py,.java,.cpp,.c,.md"
          @change="handleFileUpload($event, 'left')"
          style="display: none"
        />
        <input
          ref="fileInputRight"
          type="file"
          accept=".txt,.json,.js,.ts,.vue,.css,.html,.xml,.sql,.py,.java,.cpp,.c,.md"
          @change="handleFileUpload($event, 'right')"
          style="display: none"
        />
      </div>
    </div>


    <!-- Text Input Areas -->
    <div class="text-input-container">
      <div class="text-input-section">
        <div class="input-header">
          <label class="input-label">Original Text</label>
          <div class="input-controls">
            <span class="language-indicator">{{ detectedLanguageLeft }}</span>
            <Dropdown
              v-model="selectedLanguageLeft"
              :options="languageOptions"
              option-label="label"
              option-value="value"
              placeholder="Auto-detect"
              class="language-dropdown"
              size="small"
            />
            <Button
              @click="swapTexts"
              size="small"
              variant="outlined"
              class="swap-btn"
              title="Swap texts"
            >
              <i class="pi pi-refresh"></i>
            </Button>
          </div>
        </div>
        <textarea
          v-model="leftText"
          placeholder="Paste or upload your original text here..."
          rows="15"
          class="text-area"
          @input="onLeftTextInput"
        ></textarea>
      </div>

      <div class="text-input-section">
        <div class="input-header">
          <label class="input-label">Modified Text</label>
          <div class="input-controls">
            <span class="language-indicator">{{ detectedLanguageRight }}</span>
            <Dropdown
              v-model="selectedLanguageRight"
              :options="languageOptions"
              option-label="label"
              option-value="value"
              placeholder="Auto-detect"
              class="language-dropdown"
              size="small"
            />
            <Button
              @click="clearAll"
              size="small"
              variant="outlined"
              severity="secondary"
              class="clear-btn"
            >
              <i class="pi pi-trash"></i>
              Clear
            </Button>
          </div>
        </div>
        <textarea
          v-model="rightText"
          placeholder="Paste or upload your modified text here..."
          rows="15"
          class="text-area"
          @input="onRightTextInput"
        ></textarea>
      </div>
    </div>

    <!-- Action Toolbar -->
    <Toolbar class="action-toolbar">
      <template #start>
        <div class="action-group">
          <Button
            @click="showDiff = true"
            :disabled="!leftText.trim() || !rightText.trim()"
            class="compare-btn"
          >
            <i class="pi pi-search"></i>
            Find Differences
          </Button>
        </div>
      </template>

      <template #end>
        <div class="export-group" v-if="showDiff">
          <Button
            @click="shareState.copyShareUrl()"
            size="small"
            variant="outlined"
            class="share-btn"
          >
            <i class="pi pi-share-alt"></i>
            Share
          </Button>
          <Button
            @click="clearAll"
            size="small"
            variant="outlined"
            class="clear-btn"
          >
            <i class="pi pi-trash"></i>
            Clear All
          </Button>
        </div>
      </template>
    </Toolbar>


    <!-- Enhanced Diff Renderer -->
    <div v-if="showDiff && (leftText.trim() || rightText.trim())" class="diff-results">
      <DiffRenderer
        :left-text="leftText"
        :right-text="rightText"
        :mode="viewMode"
        :granularity="mapGranularity(diffOptions.granularity) || 'line'"
        :ignore-whitespace="diffOptions.ignoreWhitespace || false"
        :ignore-case="diffOptions.ignoreCase || false"
        :language="detectedLanguageLeft"
        :virtual-scroll-enabled="virtualScrollEnabled"
        @diff-computed="onDiffRendererComputed"
        @mode-changed="viewMode = $event"
        @options-changed="onDiffOptionsChanged"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="showDiff" class="empty-state">
      <Message severity="info" :closable="false">
        <i class="pi pi-info-circle"></i>
        No differences found - the texts are identical!
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import DiffRenderer from '@/components/DiffRenderer.vue'

const toast = useToast()

// Text content
const leftText = ref('')
const rightText = ref('')

// Diff options for DiffRenderer compatibility
const diffOptions = ref({
  granularity: 'line' as 'line' | 'word' | 'char',
  ignoreCase: false,
  ignoreWhitespace: false,
  virtualScrollEnabled: false
})

// View mode and display control
const viewMode = ref<'split' | 'unified'>('split')
const showDiff = ref(false)

// Virtual scroll state
const virtualScrollEnabled = ref(false)

// Language detection and selection
const selectedLanguageLeft = ref('')

// Map granularity values between DiffOptions and DiffRenderer
const mapGranularity = (granularity: string | undefined): 'line' | 'word' | 'char' => {
  if (granularity === 'character') return 'char'
  if (granularity === 'word') return 'word'
  return 'line'
}
const selectedLanguageRight = ref('')

const languageOptions = [
  { label: 'Auto-detect', value: '' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'SQL', value: 'sql' },
  { label: 'XML', value: 'xml' },
  { label: 'Plain Text', value: 'plaintext' }
]

// File upload refs
const fileInputLeft = ref<HTMLInputElement>()
const fileInputRight = ref<HTMLInputElement>()

// Simplified share state for URL copying
const shareState = {
  shareUrl: ref(''),
  copyShareUrl: () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.add({
      severity: 'success',
      summary: 'URL Copied',
      detail: 'Page URL copied to clipboard',
      life: 3000
    })
  }
}

// Simple language detection
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

  return 'plaintext'
}

// Computed properties
const detectedLanguageLeft = computed(() => {
  if (selectedLanguageLeft.value) return selectedLanguageLeft.value
  return leftText.value ? detectLanguageFromContent(leftText.value) : 'plaintext'
})

const detectedLanguageRight = computed(() => {
  if (selectedLanguageRight.value) return selectedLanguageRight.value
  return rightText.value ? detectLanguageFromContent(rightText.value) : 'plaintext'
})

// Methods
const onLeftTextInput = () => {
  // Auto-detect language if not manually selected
  if (!selectedLanguageLeft.value && leftText.value) {
    selectedLanguageLeft.value = ''
  }
}

const onRightTextInput = () => {
  // Auto-detect language if not manually selected
  if (!selectedLanguageRight.value && rightText.value) {
    selectedLanguageRight.value = ''
  }
}

const swapTexts = () => {
  const temp = leftText.value
  leftText.value = rightText.value
  rightText.value = temp

  const tempLang = selectedLanguageLeft.value
  selectedLanguageLeft.value = selectedLanguageRight.value
  selectedLanguageRight.value = tempLang

  toast.add({
    severity: 'info',
    summary: 'Texts Swapped',
    detail: 'Original and modified texts have been swapped',
    life: 2000
  })
}

const clearAll = () => {
  leftText.value = ''
  rightText.value = ''
  selectedLanguageLeft.value = ''
  selectedLanguageRight.value = ''

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'All content has been cleared',
    life: 2000
  })
}

const triggerFileUpload = (side: 'left' | 'right') => {
  if (side === 'left') {
    fileInputLeft.value?.click()
  } else {
    fileInputRight.value?.click()
  }
}

const handleFileUpload = async (event: Event, side: 'left' | 'right') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Check file size (limit to 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: 'File Too Large',
      detail: 'File size must be less than 10MB',
      life: 5000
    })
    return
  }

  // Enhanced MIME type validation for security
  const allowedMimeTypes = [
    'text/plain',
    'text/csv',
    'text/tab-separated-values',
    'application/json',
    'application/javascript',
    'application/xml',
    'text/xml',
    'text/html',
    'text/css',
    'application/sql',
    'text/x-sql',
    'application/x-javascript',
    'application/x-typescript'
  ]

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
    toast.add({
      severity: 'error',
      summary: 'Invalid File Type',
      detail: 'Only text files are allowed for comparison',
      life: 5000
    })
    return
  }

  // Additional file extension validation as backup
  const extension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['txt', 'json', 'js', 'ts', 'html', 'css', 'xml', 'sql', 'py', 'java', 'cpp', 'c', 'vue', 'md', 'csv', 'log']

  if (extension && !allowedExtensions.includes(extension)) {
    toast.add({
      severity: 'error',
      summary: 'Invalid File Extension',
      detail: 'File extension not supported for text comparison',
      life: 5000
    })
    return
  }

  try {
    const text = await file.text()

    if (side === 'left') {
      leftText.value = text
    } else {
      rightText.value = text
    }

    // Auto-detect language from file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      json: 'json',
      html: 'html',
      css: 'css',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      sql: 'sql',
      xml: 'xml',
      vue: 'vue'
    }

    const detectedLang = languageMap[extension || ''] || ''
    if (side === 'left') {
      selectedLanguageLeft.value = detectedLang
    } else {
      selectedLanguageRight.value = detectedLang
    }

    toast.add({
      severity: 'success',
      summary: 'File Uploaded',
      detail: `${file.name} loaded successfully`,
      life: 3000
    })
  } catch (error) {
    console.error('Error reading file:', error)
    toast.add({
      severity: 'error',
      summary: 'Upload Error',
      detail: 'Failed to read the selected file',
      life: 5000
    })
  } finally {
    // Clear the input so the same file can be uploaded again
    target.value = ''
  }
}


const onDiffRendererComputed = (stats: { additions: number; deletions: number; modifications: number; totalLines: number; computeTime: number }) => {
  // Update the statistics display if needed
  console.log('Diff computed:', stats)
}

const onDiffOptionsChanged = (options: { granularity: 'line' | 'word' | 'char'; ignoreWhitespace: boolean; ignoreCase: boolean; virtualScrollEnabled: boolean }) => {
  // Update internal diff options when changed from DiffRenderer
  Object.assign(diffOptions.value, options)
  virtualScrollEnabled.value = options.virtualScrollEnabled
}

// Watch for share URL changes
watch(() => shareState.shareUrl, (newUrl) => {
  if (newUrl) {
    toast.add({
      severity: 'success',
      summary: 'Share URL Generated',
      detail: 'Share URL copied to clipboard',
      life: 3000
    })
  }
})

onMounted(() => {
  // Any initialization code
})
</script>

<style scoped>
.diff-view {
  width: 100%;
  max-width: none;
  margin: 0;
}

/* Tool Header */
.tool-header {
  margin-bottom: var(--space-2xl);
}

.tool-title {
  font-size: var(--text-fluid-3xl);
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  color: var(--dt-text-primary);
  margin: 0 0 var(--space-sm) 0;
  display: flex;
  align-items: center;
}

.tool-description {
  font-size: var(--text-base);
  color: var(--dt-text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* Upload Controls */
.upload-controls {
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: var(--dt-surface-1);
  border-radius: var(--radius-lg);
  border: 1px solid var(--dt-border);
}

.upload-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
  display: block;
  margin-bottom: var(--space-sm);
}

.upload-buttons {
  display: flex;
  gap: var(--space-md);
}

/* Diff Options */
.diff-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
  background: var(--dt-surface-1);
  border-radius: var(--radius-lg);
  border: 1px solid var(--dt-border);
}

.options-group {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
  white-space: nowrap;
}

.option-buttons {
  display: flex;
  gap: var(--space-sm);
}

.checkbox-options {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.checkbox-label {
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
}

/* Text Input Container */
.text-input-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.text-input-section {
  display: flex;
  flex-direction: column;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
  gap: var(--space-md);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
}

.input-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.language-indicator {
  font-size: var(--text-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  font-weight: var(--font-weight-semibold);
}

.language-dropdown {
  min-width: 120px;
}

.text-area {
  min-height: 400px;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  resize: both;
  background: var(--dt-surface-1);
  border: 2px solid var(--dt-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  color: var(--dt-text-primary);
}

.text-area:focus {
  border-color: var(--dt-brand);
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Action Toolbar */
.action-toolbar {
  margin-bottom: var(--space-xl);
  background: transparent;
  border: none;
  padding: 0;
}

.action-group, .export-group {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

/* Statistics Summary */
.stats-summary {
  margin-bottom: var(--space-xl);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-lg);
  background: var(--dt-surface-1);
  border-radius: var(--radius-lg);
  border: 1px solid var(--dt-border);
  text-align: center;
}

.stat-card.added {
  border-left: 4px solid var(--dt-success);
}

.stat-card.removed {
  border-left: 4px solid var(--dt-danger);
}

.stat-card.unchanged {
  border-left: 4px solid var(--dt-info);
}

.stat-card.timing {
  border-left: 4px solid var(--dt-warning);
}

.stat-card i {
  font-size: var(--text-lg);
  margin-bottom: var(--space-sm);
  color: var(--dt-text-secondary);
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--dt-text-primary);
  display: block;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

/* Diff Results */
.diff-results {
  margin-bottom: var(--space-xl);
}

.split-view {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--dt-border);
}

.split-diff-html {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.unified-view {
  margin-bottom: var(--space-xl);
}

.unified-diff-card {
  border-radius: var(--radius-lg);
}

.unified-diff-wrapper {
  max-height: 600px;
  overflow: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--dt-border);
}

.unified-diff-content {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  margin: 0;
  padding: var(--space-lg);
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* Empty State */
.empty-state {
  padding: var(--space-2xl);
  text-align: center;
}

/* Glass Card */
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--elevation-1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .text-input-container {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .diff-options {
    flex-direction: column;
    align-items: stretch;
  }

  .options-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .input-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .input-controls {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .upload-buttons {
    flex-direction: column;
  }

  .action-group,
  .export-group {
    flex-direction: column;
    width: 100%;
  }
}

/* Diff2HTML Styling Overrides */
:deep(.d2h-wrapper) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.d2h-file-header) {
  background: var(--dt-surface-2);
  border-bottom: 1px solid var(--dt-border);
  padding: var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
}

:deep(.d2h-code-line) {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

:deep(.d2h-ins) {
  background: var(--dt-success-light);
  color: var(--dt-text-primary);
}

:deep(.d2h-del) {
  background: var(--dt-danger-light);
  color: var(--dt-text-primary);
}

:deep(.d2h-cntx) {
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
}
</style>