<template>
  <Card class="format-card">
    <template #title>
      <div class="card-header">
        <i class="pi pi-file-edit text-2xl mr-2"></i>
        Text Formatter
      </div>
    </template>

    <template #content>
      <!-- Input Section -->
      <div class="input-section">
        <div class="input-header">
          <label class="input-label">Enter text to format:</label>
          <div class="format-controls">
            <Tag
              :value="detectedType.toUpperCase()"
              :severity="getTagSeverity(detectedType)"
              class="type-indicator enhanced-tag"
            />
          </div>
        </div>

        <!-- Smart Detection Suggestion -->
        <div v-if="smartSuggestion" class="smart-suggestion">
          <div class="suggestion-content">
            <i class="pi pi-lightbulb"></i>
            <span>{{ smartSuggestion.message }}</span>
            <Button
              @click="applySuggestion"
              size="small"
              class="use-suggestion-btn"
            >
              Apply
            </Button>
            <Button
              @click="smartSuggestion = null"
              size="small"
              variant="text"
              class="dismiss-btn"
            >
              <i class="pi pi-times"></i>
            </Button>
          </div>
        </div>

        <Textarea
          v-model="inputText"
          placeholder="Paste your text here (JSON, SQL, XML, CSV)..."
          rows="10"
          class="text-area input-area enhanced-textarea"
          @input="onInputChange"
          @paste="onPaste"
        />

        <!-- Quick Actions below input -->
        <div class="input-quick-actions">
          <Button
            @click="copyInput"
            :disabled="!inputText.trim()"
            size="small"
            variant="outlined"
            class="quick-btn copy-btn"
            v-tooltip="'Copy Input (Cmd+Shift+C)'"
          >
            <i class="pi pi-copy"></i>
            Copy
          </Button>
          <Button
            @click="clearInput"
            :disabled="!inputText.trim()"
            size="small"
            variant="outlined"
            severity="secondary"
            class="quick-btn clear-btn"
            v-tooltip="'Clear (Cmd+Shift+R)'"
          >
            <i class="pi pi-trash"></i>
            Clear
          </Button>
          <Button
            @click="loadSample"
            size="small"
            variant="outlined"
            class="quick-btn sample-btn"
            v-tooltip="'Load Sample (Cmd+Shift+L)'"
          >
            <i class="pi pi-file"></i>
            Sample
          </Button>
          <Button
            @click="minifyText"
            :disabled="!inputText.trim() || textProcessor.isLoading.value"
            size="small"
            variant="outlined"
            class="quick-btn minify-btn"
            v-tooltip="'Minify (Cmd+Shift+M)'"
          >
            <i class="pi pi-compress"></i>
            Minify
          </Button>
        </div>

        <div class="input-actions">
          <Button
            label="Format Text"
            icon="pi pi-refresh"
            @click="formatText"
            :loading="textProcessor.isLoading.value"
            :disabled="!inputText.trim()"
            class="format-btn enhanced-format-btn"
          />
        </div>
      </div>

      <!-- Quick Format Buttons - moved below main input -->
      <div class="quick-format-section">
        <h4 class="quick-title">
          <i class="pi pi-bolt"></i>
          Quick Format
        </h4>
        <div class="quick-format-grid">
          <Button
            v-for="format in quickFormats"
            :key="format.type"
            @click="applyQuickFormat(format)"
            :disabled="!inputText.trim() || textProcessor.isLoading.value"
            class="quick-format-btn"
            :class="format.type"
            size="small"
            outlined
            v-tooltip="format.tooltip"
          >
            <i :class="format.icon"></i>
            {{ format.label }}
          </Button>
        </div>
      </div>

      <Divider />

      <!-- Output Section -->
      <div class="output-section">
        <div class="output-header">
          <label class="output-label">Formatted Output:</label>
          <div class="output-actions" v-if="formattedText">
            <Button
              label="Copy"
              icon="pi pi-copy"
              size="small"
              outlined
              @click="copyToClipboard"
              class="copy-btn"
            />
          </div>
        </div>

        <!-- Error Message -->
        <Message
          v-if="textProcessor.error.value"
          severity="error"
          :closable="false"
          class="error-message"
        >
          {{ textProcessor.error.value }}
        </Message>

        <!-- Formatted Output -->
        <div v-if="formattedText" class="output-container">
          <pre class="formatted-output">{{ formattedText }}</pre>
        </div>

        <!-- Empty State -->
        <div v-else-if="!textProcessor.isLoading.value && !textProcessor.error.value" class="empty-state">
          <i class="pi pi-file-o text-6xl text-gray-400 mb-3"></i>
          <p class="text-gray-500">Formatted text will appear here</p>
        </div>

        <!-- Loading State -->
        <div v-if="textProcessor.isLoading.value" class="loading-state">
          <ProgressSpinner class="spinner" />
          <p class="loading-text">Formatting text...</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'

const toast = useToast()
const textProcessor = useTextProcessor()

// Text content
const inputText = ref('')
const formattedText = ref('')

// Detected type
const detectedType = ref<TextType>('text')

// Smart suggestion
const smartSuggestion = ref<{ message: string; action: string; type: string } | null>(null)

// Quick format options
const quickFormats = ref([
  { type: 'json', label: 'JSON', icon: 'pi pi-code', tooltip: 'Pretty-print JSON (Cmd+1)' },
  { type: 'sql', label: 'SQL', icon: 'pi pi-database', tooltip: 'Format SQL query (Cmd+2)' },
  { type: 'xml', label: 'XML', icon: 'pi pi-file-o', tooltip: 'Format XML/HTML (Cmd+3)' },
  { type: 'csv', label: 'CSV', icon: 'pi pi-table', tooltip: 'Format CSV data (Cmd+4)' },
  { type: 'css', label: 'CSS', icon: 'pi pi-palette', tooltip: 'Format CSS (Cmd+5)' },
  { type: 'js', label: 'JS', icon: 'pi pi-code', tooltip: 'Format JavaScript (Cmd+6)' }
])

// Debounce timer for type detection
let detectionTimer: ReturnType<typeof setTimeout> | null = null

const getTagSeverity = (type: TextType) => {
  switch (type) {
    case 'json': return 'success'
    case 'sql': return 'info'
    default: return 'secondary'
  }
}

const onInputChange = () => {
  if (detectionTimer) clearTimeout(detectionTimer)
  detectionTimer = setTimeout(async () => {
    detectedType.value = await textProcessor.detectType(inputText.value)
  }, 500)

  // Clear previous output when input changes
  formattedText.value = ''
}

const formatText = async () => {
  if (!inputText.value.trim()) return

  const result = await textProcessor.formatText(inputText.value)

  if (result.success && result.formatted) {
    formattedText.value = result.formatted
    detectedType.value = result.type

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Text formatted as ${result.type.toUpperCase()}`,
      life: 3000
    })
  } else if (result.error) {
    formattedText.value = ''
    toast.add({
      severity: 'error',
      summary: 'Format Error',
      detail: result.error,
      life: 5000
    })
  }
}

const clearInput = () => {
  inputText.value = ''
  formattedText.value = ''
  detectedType.value = 'text'

  if (detectionTimer) clearTimeout(detectionTimer)

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'All content has been cleared',
    life: 2000
  })
}

// Smart detection for paste events
const detectFormatType = (text: string) => {
  if (!text.trim()) return null

  const trimmed = text.trim()

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return { type: 'json', message: 'JSON detected! Auto-format for better readability?' }
    } catch {
      // Continue checking
    }
  }

  // SQL detection
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(trimmed)) {
    return { type: 'sql', message: 'SQL detected! Format for cleaner structure?' }
  }

  // XML/HTML detection
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return { type: 'xml', message: 'XML/HTML detected! Format for better structure?' }
  }

  // CSS detection
  if (trimmed.includes('{') && trimmed.includes('}') && trimmed.includes(':')) {
    const lines = trimmed.split('\n')
    const cssLikeLines = lines.filter(line => line.includes(':') || line.includes('{') || line.includes('}'))
    if (cssLikeLines.length > lines.length * 0.3) {
      return { type: 'css', message: 'CSS detected! Format for better readability?' }
    }
  }

  return null
}

// Paste event handler with smart detection
const onPaste = async (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') || ''
  const detection = detectFormatType(text)

  if (detection) {
    smartSuggestion.value = {
      message: detection.message,
      action: 'format',
      type: detection.type
    }
  }
}

// Apply smart suggestion
const applySuggestion = async () => {
  if (!smartSuggestion.value) return

  if (smartSuggestion.value.action === 'format') {
    await formatText()
  }
  smartSuggestion.value = null
}

// Quick format methods
const applyQuickFormat = async (format: { type: string; label: string }) => {
  if (!inputText.value.trim()) return

  // Force the type for quick formatting
  detectedType.value = format.type as TextType
  await formatText()

  toast.add({
    severity: 'info',
    summary: 'Quick Format',
    detail: `Applied ${format.label} formatting`,
    life: 2000
  })
}

// Enhanced action methods
const copyInput = async () => {
  if (!inputText.value.trim()) return

  try {
    await navigator.clipboard.writeText(inputText.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Input text copied to clipboard',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Could not copy to clipboard',
      life: 3000
    })
  }
}

const loadSample = () => {
  const samples = [
    {
      type: 'json',
      content: '{"users":[{"id":1,"name":"John Doe","email":"john@example.com","active":true},{"id":2,"name":"Jane Smith","email":"jane@example.com","active":false}],"total":2,"page":1}'
    },
    {
      type: 'sql',
      content: 'SELECT u.id, u.name, u.email, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.active = true AND p.published_at > "2023-01-01" ORDER BY p.created_at DESC LIMIT 10;'
    },
    {
      type: 'xml',
      content: '<?xml version="1.0" encoding="UTF-8"?><catalog><book id="1"><title>The Great Gatsby</title><author>F. Scott Fitzgerald</author><price>12.99</price></book><book id="2"><title>To Kill a Mockingbird</title><author>Harper Lee</author><price>14.99</price></book></catalog>'
    },
    {
      type: 'css',
      content: '.container{width:100%;max-width:1200px;margin:0 auto;padding:20px}.header{background:#333;color:white;padding:10px;border-radius:5px}.button{background:linear-gradient(45deg,#007bff,#0056b3);border:none;color:white;padding:12px 24px;border-radius:4px;cursor:pointer;transition:all 0.3s ease}.button:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,123,255,0.3)}'
    }
  ]

  const sample = samples[Math.floor(Math.random() * samples.length)]
  inputText.value = sample.content
  detectedType.value = sample.type as TextType

  // Trigger type detection
  onInputChange()

  toast.add({
    severity: 'info',
    summary: 'Sample Loaded',
    detail: `${sample.type.toUpperCase()} sample loaded for formatting`,
    life: 2000
  })
}

const minifyText = async () => {
  if (!inputText.value.trim()) return

  try {
    // Simple minification logic
    let minified = inputText.value

    if (detectedType.value === 'json') {
      const parsed = JSON.parse(inputText.value)
      minified = JSON.stringify(parsed)
    } else if (detectedType.value === 'css') {
      minified = inputText.value
        .replace(/\s+/g, ' ')
        .replace(/;\s*}/g, '}')
        .replace(/\s*{\s*/g, '{')
        .replace(/;\s*/g, ';')
        .trim()
    } else {
      // Generic whitespace minification
      minified = inputText.value
        .replace(/\s+/g, ' ')
        .replace(/\n\s*/g, ' ')
        .trim()
    }

    formattedText.value = minified

    toast.add({
      severity: 'success',
      summary: 'Minified',
      detail: 'Text has been minified',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Minify Failed',
      detail: 'Could not minify the text',
      life: 3000
    })
  }
}

// Keyboard shortcut handler
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    if (event.shiftKey) {
      switch (event.key) {
        case 'C':
        case 'c':
          event.preventDefault()
          copyInput()
          break
        case 'R':
        case 'r':
          event.preventDefault()
          clearInput()
          break
        case 'L':
        case 'l':
          event.preventDefault()
          loadSample()
          break
        case 'M':
        case 'm':
          event.preventDefault()
          minifyText()
          break
        case 'Enter':
          event.preventDefault()
          if (inputText.value.trim()) {
            formatText()
          }
          break
      }
    } else {
      // Quick format shortcuts
      const formatKeys = ['1', '2', '3', '4', '5', '6']
      const keyIndex = formatKeys.indexOf(event.key)
      if (keyIndex !== -1 && quickFormats.value[keyIndex]) {
        event.preventDefault()
        applyQuickFormat(quickFormats.value[keyIndex])
      }
    }
  }
}

// Lifecycle hooks for keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

const copyToClipboard = async () => {
  if (!formattedText.value) return

  try {
    await navigator.clipboard.writeText(formattedText.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Formatted text copied to clipboard',
      life: 2000
    })
  } catch (err) {
    console.error('Failed to copy:', err)
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}
</script>

<style scoped>
.format-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.input-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-color);
}

.format-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-indicator {
  font-size: 0.75rem;
  font-weight: 600;
}

.text-area {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  border-radius: 8px;
  width: 100%;
}

.input-area {
  min-height: 250px;
  margin-bottom: 1rem;
}

.input-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.format-btn {
  font-size: 1.1rem;
  padding: 0.75rem 2rem;
  font-weight: 600;
}

.output-section {
  margin-top: 1.5rem;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.output-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-color);
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.copy-btn {
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
}

.error-message {
  margin-bottom: 1rem;
}

.output-container {
  background: var(--surface-ground);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.formatted-output {
  background: transparent;
  padding: 1.5rem;
  margin: 0;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  color: var(--text-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--surface-ground);
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--surface-ground);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.loading-text {
  color: var(--text-color-secondary);
  font-size: 1rem;
  margin: 0;
}

@media (max-width: 768px) {
  .input-header,
  .output-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .format-controls,
  .output-actions {
    align-self: flex-end;
  }

  .input-actions {
    flex-direction: column;
    align-items: center;
  }

  .format-btn {
    width: 100%;
    max-width: 300px;
  }

  .quick-format-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .input-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===== ENHANCED UX FEATURES ===== */

/* Quick format section */
.quick-format-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.quick-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.quick-title i {
  color: #fbbf24;
}

.quick-format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.quick-format-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.quick-format-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.quick-format-btn:hover::before {
  left: 100%;
}

.quick-format-btn.json:hover {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.quick-format-btn.sql:hover {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.quick-format-btn.xml:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.quick-format-btn.csv:hover {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quick-format-btn.css:hover {
  background: linear-gradient(135deg, #ec4899, #db2777) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.quick-format-btn.js:hover {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

/* Smart suggestions */
.smart-suggestion {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-color);
}

.suggestion-content i {
  color: #fbbf24;
  font-size: 1rem;
}

.use-suggestion-btn {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.use-suggestion-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.dismiss-btn {
  opacity: 0.7;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dismiss-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
}

/* Enhanced input */
.enhanced-textarea {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.enhanced-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.enhanced-tag {
  animation: pulse 2s infinite;
}

/* Quick actions */
.input-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
  margin-bottom: 1rem;
}

.quick-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  font-weight: 500;
}

.quick-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.quick-btn:hover::before {
  left: 100%;
}

.copy-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.clear-btn:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.sample-btn:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.minify-btn:hover {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Enhanced format button */
.enhanced-format-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.enhanced-format-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.enhanced-format-btn:hover::after {
  width: 300px;
  height: 300px;
}

.enhanced-format-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* Animation keyframes */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>