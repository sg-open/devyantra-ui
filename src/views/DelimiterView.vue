<template>
  <Card class="delimiter-tool">
    <template #title>
      <div class="card-header">
        <i class="pi pi-arrows-h text-2xl mr-2"></i>
        Delimiter
      </div>
    </template>

    <template #subtitle>
      Convert between delimited and newline-separated text formats
    </template>

    <template #content>
      <div class="delimiter-container">
      <!-- Left Panel - Delimited Text -->
      <div class="editor-panel">
        <div class="panel-header">
          <h3>Delimited Text</h3>
        </div>

        <div class="editor-wrapper">
          <textarea
            v-model="delimitedText"
            placeholder="Enter delimited text here... (e.g., apple,banana,cherry)"
            class="p-inputtextarea p-component editor-textarea"
            rows="15"
            @input="onDelimitedTextChange"
          ></textarea>

          <div class="editor-actions">
            <button
              @click="clearDelimited"
              class="p-button p-component p-button-secondary p-button-outlined clear-btn"
              title="Clear delimited text"
            >
              <i class="pi pi-times"></i>
              Clear
            </button>
            <button
              @click="copyDelimited"
              class="p-button p-component p-button-outlined copy-btn"
              title="Copy delimited text"
            >
              <i class="pi pi-copy"></i>
              Copy
            </button>
          </div>

          <div class="delimiter-settings">
            <div class="delimiter-selector">
              <label class="settings-label">Quick Delimiters:</label>
              <div class="delimiter-quick-select">
                <button
                  v-for="delim in quickDelimiters"
                  :key="delim.value"
                  @click="setDelimiter(delim.value)"
                  :class="['delimiter-btn', { active: selectedDelimiter === delim.value }]"
                  :title="`Use ${delim.label} (${delim.shortcut})`"
                >
                  <span class="delimiter-display">{{ delim.display }}</span>
                  <span class="delimiter-label">{{ delim.label }}</span>
                </button>
                <button
                  @click="selectedDelimiter = 'custom'"
                  :class="['delimiter-btn custom-btn', { active: selectedDelimiter === 'custom' }]"
                  title="Custom delimiter"
                >
                  <i class="pi pi-cog"></i>
                  <span class="delimiter-label">Custom</span>
                </button>
              </div>

              <div v-if="selectedDelimiter === 'custom'" class="custom-delimiter-row">
                <input
                  v-model="customDelimiter"
                  type="text"
                  placeholder="Enter custom delimiter"
                  class="p-inputtext p-component custom-delimiter-input"
                  maxlength="10"
                  @input="detectFromCustom"
                />
              </div>

              <div v-if="detectedDelimiter && detectedDelimiter !== selectedDelimiter" class="smart-suggestion">
                <i class="pi pi-lightbulb"></i>
                <span>Detected {{ getDelimiterLabel(detectedDelimiter) }} delimiter</span>
                <button @click="useDetectedDelimiter" class="use-suggestion-btn">Use This</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Controls -->
      <div class="conversion-controls">
        <div class="control-buttons">
          <button
            @click="convertToNewlines"
            class="p-button p-component convert-btn"
            title="Convert delimited text to newlines"
            :disabled="!delimitedText.trim()"
          >
            <i class="pi pi-arrow-circle-right"></i>
            <span>Split to Lines</span>
          </button>

          <button
            @click="convertToDelimited"
            class="p-button p-component convert-btn"
            title="Convert newline text to delimited"
            :disabled="!newlineText.trim()"
          >
            <i class="pi pi-arrow-circle-left"></i>
            <span>Join with Delimiter</span>
          </button>
        </div>

        <div class="conversion-info">
          <div class="item-count">
            <span>{{ delimitedItemCount }} items ↔ {{ newlineItemCount }} lines</span>
          </div>
        </div>
      </div>

      <!-- Right Panel - Newline Text -->
      <div class="editor-panel">
        <div class="panel-header">
          <h3>Newline Separated</h3>
        </div>

        <div class="editor-wrapper">
          <textarea
            v-model="newlineText"
            placeholder="Enter newline-separated text here...
apple
banana
cherry"
            class="p-inputtextarea p-component editor-textarea"
            rows="15"
            @input="onNewlineTextChange"
          ></textarea>

          <div class="editor-actions">
            <button
              @click="clearNewlines"
              class="p-button p-component p-button-secondary p-button-outlined clear-btn"
              title="Clear newline text"
            >
              <i class="pi pi-times"></i>
              Clear
            </button>
            <button
              @click="copyNewlines"
              class="p-button p-component p-button-outlined copy-btn"
              title="Copy newline text"
            >
              <i class="pi pi-copy"></i>
              Copy
            </button>
          </div>

          <div class="newline-settings">
            <div class="options">
              <label class="trim-option">
                <input type="checkbox" v-model="trimWhitespace" @change="onOptionsChange" />
                Trim whitespace
              </label>
              <label class="empty-option">
                <input type="checkbox" v-model="removeEmptyLines" @change="onOptionsChange" />
                Remove empty lines
              </label>
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'

const toast = useToast()

// Reactive state
const delimitedText = ref('')
const newlineText = ref('')
const selectedDelimiter = ref(',')
const customDelimiter = ref('')
const trimWhitespace = ref(true)
const removeEmptyLines = ref(true)
const autoConvert = ref(false)
const detectedDelimiter = ref('')

// Quick delimiter options
const quickDelimiters = ref([
  { value: ',', label: 'Comma', display: ',', shortcut: 'Cmd+1' },
  { value: '|', label: 'Pipe', display: '|', shortcut: 'Cmd+2' },
  { value: ';', label: 'Semicolon', display: ';', shortcut: 'Cmd+3' },
  { value: ':', label: 'Colon', display: ':', shortcut: 'Cmd+4' },
  { value: '\t', label: 'Tab', display: '⇥', shortcut: 'Cmd+5' },
  { value: ' ', label: 'Space', display: '·', shortcut: 'Cmd+6' }
])

// Computed properties
const currentDelimiter = computed(() => {
  return selectedDelimiter.value === 'custom' ? customDelimiter.value : selectedDelimiter.value
})

const delimitedItemCount = computed(() => {
  if (!delimitedText.value.trim()) return 0
  return delimitedText.value.split(currentDelimiter.value).filter(item =>
    removeEmptyLines.value ? item.trim() : true
  ).length
})

const newlineItemCount = computed(() => {
  if (!newlineText.value.trim()) return 0
  return newlineText.value.split('\n').filter(line =>
    removeEmptyLines.value ? line.trim() : true
  ).length
})

// Watch for delimiter changes to update conversion
watch([selectedDelimiter, customDelimiter], () => {
  if (autoConvert.value && delimitedText.value.trim()) {
    convertToNewlines()
  }
})

// Conversion functions
const convertToNewlines = () => {
  if (!delimitedText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'No Input',
      detail: 'Please enter some delimited text to convert',
      life: 3000
    })
    return
  }

  const delimiter = currentDelimiter.value
  if (!delimiter) {
    toast.add({
      severity: 'warn',
      summary: 'No Delimiter',
      detail: 'Please specify a delimiter',
      life: 3000
    })
    return
  }

  let items = delimitedText.value.split(delimiter)

  if (trimWhitespace.value) {
    items = items.map(item => item.trim())
  }

  if (removeEmptyLines.value) {
    items = items.filter(item => item.length > 0)
  }

  newlineText.value = items.join('\n')

  toast.add({
    severity: 'success',
    summary: 'Converted',
    detail: `Converted ${items.length} items to newlines`,
    life: 2000
  })
}

const convertToDelimited = () => {
  if (!newlineText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'No Input',
      detail: 'Please enter some newline-separated text to convert',
      life: 3000
    })
    return
  }

  const delimiter = currentDelimiter.value
  if (!delimiter) {
    toast.add({
      severity: 'warn',
      summary: 'No Delimiter',
      detail: 'Please specify a delimiter',
      life: 3000
    })
    return
  }

  let lines = newlineText.value.split('\n')

  if (trimWhitespace.value) {
    lines = lines.map(line => line.trim())
  }

  if (removeEmptyLines.value) {
    lines = lines.filter(line => line.length > 0)
  }

  delimitedText.value = lines.join(delimiter)

  toast.add({
    severity: 'success',
    summary: 'Converted',
    detail: `Converted ${lines.length} lines to delimited text`,
    life: 2000
  })
}

// Smart detection functions
const detectDelimiter = (text: string): string => {
  if (!text.trim()) return ''

  const delimiters = [',', '|', ';', '\t', ':', ' ']
  const scores = delimiters.map(delim => {
    const splits = text.split(delim)
    if (splits.length <= 1) return 0

    // Score based on consistency and reasonable split count
    const avgLength = splits.reduce((sum, part) => sum + part.trim().length, 0) / splits.length
    return splits.length * (avgLength > 0 ? 1 : 0.5)
  })

  const maxScore = Math.max(...scores)
  if (maxScore > 3) { // Minimum threshold
    return delimiters[scores.indexOf(maxScore)]
  }
  return ''
}

const setDelimiter = (value: string) => {
  selectedDelimiter.value = value
  if (value !== 'custom') {
    customDelimiter.value = ''
  }

  toast.add({
    severity: 'info',
    summary: 'Delimiter Changed',
    detail: `Now using ${getDelimiterLabel(value)} delimiter`,
    life: 1500
  })
}

const getDelimiterLabel = (delim: string): string => {
  const found = quickDelimiters.value.find(d => d.value === delim)
  return found ? found.label : 'custom'
}

const useDetectedDelimiter = () => {
  setDelimiter(detectedDelimiter.value)
  detectedDelimiter.value = ''
}

const detectFromCustom = () => {
  if (customDelimiter.value && delimitedText.value) {
    const detected = detectDelimiter(delimitedText.value)
    if (detected && detected !== customDelimiter.value) {
      detectedDelimiter.value = detected
    }
  }
}

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    const shortcuts: Record<string, string> = {
      '1': ',',
      '2': '|',
      '3': ';',
      '4': ':',
      '5': '\t',
      '6': ' '
    }

    if (shortcuts[event.key]) {
      event.preventDefault()
      setDelimiter(shortcuts[event.key])
    }
  }
}

// Event handlers
const onDelimitedTextChange = () => {
  // Auto-detect delimiter on paste/input
  const detected = detectDelimiter(delimitedText.value)
  if (detected && detected !== selectedDelimiter.value && selectedDelimiter.value !== 'custom') {
    detectedDelimiter.value = detected
  }

  if (autoConvert.value) {
    convertToNewlines()
  }
}

const onNewlineTextChange = () => {
  if (autoConvert.value) {
    convertToDelimited()
  }
}

const onOptionsChange = () => {
  // Re-apply conversion if auto-convert is enabled
  if (autoConvert.value) {
    if (delimitedText.value.trim()) {
      convertToNewlines()
    } else if (newlineText.value.trim()) {
      convertToDelimited()
    }
  }
}

// Utility functions
const clearDelimited = () => {
  delimitedText.value = ''
  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'Delimited text cleared',
    life: 1500
  })
}

const clearNewlines = () => {
  newlineText.value = ''
  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'Newline text cleared',
    life: 1500
  })
}

const copyDelimited = async () => {
  if (!delimitedText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Nothing to Copy',
      detail: 'Delimited text is empty',
      life: 2000
    })
    return
  }

  try {
    await navigator.clipboard.writeText(delimitedText.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Delimited text copied to clipboard',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}

const copyNewlines = async () => {
  if (!newlineText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Nothing to Copy',
      detail: 'Newline text is empty',
      life: 2000
    })
    return
  }

  try {
    await navigator.clipboard.writeText(newlineText.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Newline text copied to clipboard',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style scoped>
.delimiter-tool {
  margin: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
}

.card-header {
  display: flex;
  align-items: center;
  color: var(--dt-brand);
  font-weight: 600;
}

.delimiter-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  min-height: 600px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  background: var(--dt-surface-card);
  border-radius: 12px;
  border: 1px solid var(--dt-border-color);
  overflow: hidden;
}

.panel-header {
  padding: 1rem 1.5rem;
  background: var(--dt-surface-section);
  border-bottom: 1px solid var(--dt-border-color);
}

.panel-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: 0;
}

.delimiter-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delimiter-selector label {
  font-weight: 500;
  color: var(--dt-text-secondary);
  font-size: 0.9rem;
}

.delimiter-selector select {
  padding: 0.5rem;
  border-radius: 6px;
}

.custom-delimiter-input {
  padding: 0.5rem;
  border-radius: 6px;
  width: 150px;
}

.delimiter-settings,
.newline-settings {
  padding: 1rem;
  margin-top: 1rem;
  background: var(--dt-surface-section);
  border-radius: 8px;
  border: 1px solid var(--dt-border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-label {
  font-weight: 600;
  color: var(--dt-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  display: block;
}

.delimiter-quick-select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.delimiter-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid var(--dt-border-color);
  border-radius: 8px;
  background: var(--dt-surface-ground);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 60px;
  position: relative;
  overflow: hidden;
}

.delimiter-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.3s ease;
}

.delimiter-btn:hover::before {
  left: 100%;
}

.delimiter-btn:hover {
  border-color: var(--dt-brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--dt-brand-rgb), 0.25);
}

.delimiter-btn.active {
  border-color: var(--dt-brand);
  background: var(--dt-brand);
  color: white;
  transform: scale(1.05);
}

.delimiter-btn.active .delimiter-label {
  color: white;
}

.delimiter-display {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  margin-bottom: 0.25rem;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delimiter-label {
  font-size: 0.75rem;
  color: var(--dt-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.2s ease;
}

.custom-btn .pi {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.custom-delimiter-row {
  margin-top: 0.75rem;
  animation: slideDown 0.3s ease-out;
}

.smart-suggestion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  border: 1px solid #64b5f6;
  border-radius: 8px;
  margin-top: 0.75rem;
  animation: fadeInUp 0.4s ease-out;
}

.smart-suggestion i {
  color: #ffa726;
  font-size: 1.1rem;
}

.use-suggestion-btn {
  padding: 0.25rem 0.75rem;
  background: var(--dt-brand);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.use-suggestion-btn:hover {
  background: var(--dt-brand-hover);
  transform: scale(1.05);
}

/* Enhanced animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced conversion buttons */
.convert-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.convert-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.convert-btn:hover::before {
  left: 100%;
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(var(--dt-brand-rgb), 0.3);
}

.convert-btn:active {
  transform: translateY(0) scale(0.98);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trim-option,
.empty-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--dt-text-secondary);
  cursor: pointer;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.editor-textarea {
  flex: 1;
  resize: none;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--dt-border-color);
  background: var(--dt-surface-ground);
}

.editor-textarea:focus {
  outline: none;
  border-color: var(--dt-brand);
  box-shadow: 0 0 0 1px var(--dt-brand);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.conversion-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem 1rem;
  background: var(--dt-surface-card);
  border-radius: 12px;
  border: 1px solid var(--dt-border-color);
  min-width: 200px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.convert-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  min-width: 150px;
  background: var(--dt-brand);
  border-color: var(--dt-brand);
}

.convert-btn:hover:not(:disabled) {
  background: var(--dt-brand-hover);
  border-color: var(--dt-brand-hover);
  transform: translateY(-1px);
}

.convert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.conversion-info {
  text-align: center;
  padding: 1rem;
  background: var(--dt-surface-section);
  border-radius: 8px;
  border: 1px solid var(--dt-border-color);
}

.item-count {
  font-size: 0.9rem;
  color: var(--dt-text-secondary);
  font-weight: 500;
}

.clear-btn,
.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.clear-btn {
  color: var(--dt-text-secondary);
}

.copy-btn {
  color: var(--dt-brand);
  border-color: var(--dt-brand);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .delimiter-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .conversion-controls {
    order: 2;
    flex-direction: row;
    justify-content: space-around;
    padding: 1rem;
  }

  .control-buttons {
    flex-direction: row;
    gap: 0.5rem;
  }

  .convert-btn {
    min-width: auto;
    padding: 0.5rem 1rem;
  }

  .delimiter-view {
    padding: 1rem;
  }

  .editor-textarea {
    rows: 10;
  }
}

@media (max-width: 480px) {
  .tool-header h1 {
    font-size: 2rem;
  }

  .panel-header {
    padding: 1rem;
  }

  .editor-wrapper {
    padding: 1rem;
  }

  .editor-actions {
    flex-direction: column;
  }

  .control-buttons {
    flex-direction: column;
    width: 100%;
  }

  .convert-btn {
    width: 100%;
  }
}
</style>