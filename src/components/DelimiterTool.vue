<template>
  <div class="tool-panel delimiter-tool">
    <header class="tool-hero">
      <h1>Delimiter Tool</h1>
      <p>Split comma-separated values into lines or join lines with any delimiter. Smart detection auto-selects the right separator for your data.</p>
    </header>
      <div class="delimiter-container">
      <!-- Left Panel - Delimited Text -->
      <div class="editor-panel">
        <label class="input-label">Delimited Text</label>
          <textarea
            v-model="delimitedText"
            placeholder="Enter delimited text here... (e.g., apple,banana,cherry)"
            class="p-inputtextarea text-area enhanced-textarea"
            rows="12"
            @input="onDelimitedTextChange"
          ></textarea>

          <div class="editor-actions">
            <button
              @click="clearDelimited"
              class="p-button p-button-secondary p-button-outlined clear-btn"
              title="Clear delimited text"
            >
              <i class="pi pi-times"></i>
              Clear
            </button>
            <button
              @click="copyDelimited"
              class="p-button p-button-outlined copy-btn"
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
                  class="p-inputtext custom-delimiter-input"
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

      <!-- Center Controls -->
      <div class="conversion-controls">
        <div class="control-buttons">
          <button
            @click="convertToNewlines"
            class="p-button convert-btn"
            title="Convert delimited text to newlines"
            :disabled="!delimitedText.trim()"
          >
            <i class="pi pi-arrow-circle-right"></i>
            <span>Split to Lines</span>
          </button>

          <button
            @click="convertToDelimited"
            class="p-button convert-btn"
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
        <label class="input-label">Newline Separated</label>
          <textarea
            v-model="newlineText"
            placeholder="Enter newline-separated text here...
apple
banana
cherry"
            class="p-inputtextarea text-area enhanced-textarea"
            rows="12"
            @input="onNewlineTextChange"
          ></textarea>

          <div class="editor-actions">
            <button
              @click="clearNewlines"
              class="p-button p-button-secondary p-button-outlined clear-btn"
              title="Clear newline text"
            >
              <i class="pi pi-times"></i>
              Clear
            </button>
            <button
              @click="copyNewlines"
              class="p-button p-button-outlined copy-btn"
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

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Delimiter?</h2>
      <p>A delimiter is a character or sequence of characters that separates individual values in a data string. Common delimiters include commas (CSV files), pipes (log files), tabs (TSV files), semicolons (European CSV), and colons (configuration files). Converting between delimited formats and line-separated lists is a frequent task when working with data from spreadsheets, databases, APIs, and command-line tools.</p>
      <p>DevYantra's Delimiter Tool auto-detects your delimiter, supports custom separators, and offers options to trim whitespace and filter empty values. Like all DevYantra tools, processing happens entirely in your browser.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Split delimited text into individual lines or join lines with any delimiter</li>
        <li>Smart delimiter auto-detection for comma, pipe, semicolon, tab, and more</li>
        <li>Custom delimiter support for any character or string</li>
        <li>Options to trim whitespace and remove empty lines during conversion</li>
        <li>Keyboard shortcuts for quick delimiter switching</li>
      </ul>

      <h2>How to Use the Delimiter Tool</h2>
      <ol>
        <li>Paste comma-separated (or other delimited) text in the left panel.</li>
        <li>Select a delimiter or let auto-detection choose the right one.</li>
        <li>Click "Split to Lines" to convert, or use "Join with Delimiter" to go the other way.</li>
        <li>Enable "Trim whitespace" and "Remove empty lines" for cleaner output.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I split comma-separated values into lines?</h3>
        <p>Paste your comma-separated text into the left panel, select the comma delimiter (or let DevYantra auto-detect it), and click "Split to Lines". Each value will appear on its own line in the right panel.</p>

        <h3>Can I use custom delimiters?</h3>
        <p>Yes. DevYantra supports comma, pipe, semicolon, colon, tab, and space as quick delimiters, plus a custom option where you can enter any character or string as the delimiter.</p>

        <h3>How do I join lines into a delimited string?</h3>
        <p>Enter your text with one item per line in the right panel, choose your delimiter, and click "Join with Delimiter". The tool also offers options to trim whitespace and remove empty lines during conversion.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/text-compare">Text Compare</router-link>
        <router-link to="/tools/format-text">Code Formatter</router-link>
        <router-link to="/tools/character-count">Character Counter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
  if (!delimitedText.value.trim() || !currentDelimiter.value) return

  let items = delimitedText.value.split(currentDelimiter.value)

  if (trimWhitespace.value) {
    items = items.map(item => item.trim())
  }

  if (removeEmptyLines.value) {
    items = items.filter(item => item.length > 0)
  }

  newlineText.value = items.join('\n')
}

const convertToDelimited = () => {
  if (!newlineText.value.trim() || !currentDelimiter.value) return

  let lines = newlineText.value.split('\n')

  if (trimWhitespace.value) {
    lines = lines.map(line => line.trim())
  }

  if (removeEmptyLines.value) {
    lines = lines.filter(line => line.length > 0)
  }

  delimitedText.value = lines.join(currentDelimiter.value)
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
    return delimiters[scores.indexOf(maxScore)] ?? ''
  }
  return ''
}

const setDelimiter = (value: string) => {
  selectedDelimiter.value = value
  if (value !== 'custom') {
    customDelimiter.value = ''
  }
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

    if (shortcuts[event.key] !== undefined) {
      event.preventDefault()
      setDelimiter(shortcuts[event.key]!)
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
}

const clearNewlines = () => {
  newlineText.value = ''
}

const copyDelimited = async () => {
  if (!delimitedText.value.trim()) return

  try {
    await navigator.clipboard.writeText(delimitedText.value)
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

const copyNewlines = async () => {
  if (!newlineText.value.trim()) return

  try {
    await navigator.clipboard.writeText(newlineText.value)
  } catch (error) {
    console.error('Copy failed:', error)
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
.delimiter-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  min-height: 600px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
}

.input-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--dt-text-primary);
  margin-bottom: 0.75rem;
  display: block;
}

.enhanced-textarea {
  transition: border-color var(--transition-fast);
}

.enhanced-textarea:focus {
  border-color: var(--dt-brand);
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
  background: var(--dt-surface-2);
  border-radius: 8px;
  border: 1px solid var(--dt-border);
  transition: all var(--transition-normal);
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
  border: 2px solid var(--dt-border);
  border-radius: var(--radius-md);
  background: var(--dt-surface-2);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 60px;
}

.delimiter-btn:hover {
  border-color: var(--dt-brand);
  background: var(--dt-surface-2);
}

.delimiter-btn.active {
  border-color: var(--dt-brand);
  background: var(--dt-brand);
  color: var(--button-primary-text);
}

.delimiter-btn.active .delimiter-label {
  color: var(--button-primary-text);
}

.delimiter-display {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-mono);
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
  transition: color var(--transition-fast);
}

.custom-btn .pi {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.custom-delimiter-row {
  margin-top: 0.75rem;
}

.smart-suggestion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  margin-top: 0.75rem;
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
  transition: all var(--transition-fast);
}

.use-suggestion-btn:hover {
  background: var(--dt-brand-hover);
  opacity: 0.9;
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
  background: var(--dt-surface-1);
  border-radius: 12px;
  border: 1px solid var(--dt-border);
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
}

.convert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.conversion-info {
  text-align: center;
  padding: 1rem;
  background: var(--dt-surface-2);
  border-radius: 8px;
  border: 1px solid var(--dt-border);
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

}

@media (max-width: 480px) {
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
