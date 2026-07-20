<template>
  <div class="tool-panel">
    <header class="tool-hero">
      <h1>Code Formatter Online</h1>
      <p>Beautify or minify JSON, SQL, XML, and CSS instantly. Paste your code and get clean, properly indented output in one click.</p>
    </header>

    <!-- Toolbar -->
    <div class="formatter-toolbar">
      <!-- Format Type Buttons -->
      <div class="format-types">
        <button
          v-for="fmt in formatTypes"
          :key="fmt.type"
          @click="applyQuickFormat(fmt)"
          :disabled="!inputText.trim() || textProcessor.isLoading.value"
          class="format-type-btn"
          :class="{ active: detectedType === fmt.type }"
          v-tooltip="fmt.tooltip"
        >
          {{ fmt.label }}
        </button>
      </div>

      <!-- Actions -->
      <div class="toolbar-actions">
        <button
          class="p-button p-button-sm toolbar-btn primary-action"
          :disabled="!inputText.trim() || textProcessor.isLoading.value"
          @click="formatText()"
          v-tooltip="'Beautify (⌘⇧Enter)'"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': textProcessor.isLoading.value }"></i>
          Beautify
        </button>
        <button
          class="p-button p-button-sm p-button-outlined toolbar-btn"
          :disabled="!inputText.trim() || textProcessor.isLoading.value"
          @click="minifyText"
          v-tooltip="'Minify (⌘⇧M)'"
        >
          <i class="pi pi-minus"></i>
          Minify
        </button>
      </div>
    </div>

    <!-- Smart Detection Suggestion -->
    <div v-if="smartSuggestion" class="smart-suggestion">
      <div class="suggestion-content">
        <i class="pi pi-lightbulb"></i>
        <span>{{ smartSuggestion.message }}</span>
        <button class="p-button p-button-sm use-suggestion-btn" @click="applySuggestion">
          Apply
        </button>
        <button class="p-button p-button-sm p-button-text dismiss-btn" @click="smartSuggestion = null">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="textProcessor.error.value" class="p-message p-message-error error-message" role="alert">
      <div class="p-message-text">{{ textProcessor.error.value }}</div>
    </div>

    <!-- Side-by-Side Panels -->
    <div class="formatter-panels">
      <!-- Input Panel -->
      <div class="panel">
        <div class="panel-header">
          <label class="panel-label">Input</label>
          <button
            class="p-button p-button-sm p-button-text panel-action"
            :disabled="!inputText.trim()"
            @click="copyInput"
            v-tooltip="'Copy input'"
          >
            <i class="pi pi-copy"></i>
          </button>
        </div>
        <textarea
          v-model="inputText"
          placeholder="Paste your code here..."
          class="p-inputtextarea panel-textarea"
          @input="onInputChange"
          @paste="onPaste"
        ></textarea>
      </div>

      <!-- Output Panel -->
      <div class="panel">
        <div class="panel-header">
          <label class="panel-label">
            Output
            <span v-if="detectedType !== 'text'" class="type-badge">{{ detectedType.toUpperCase() }}</span>
          </label>
        </div>
        <div class="panel-output" :class="{ 'panel-output--empty': !formattedText && !textProcessor.isLoading.value }">
          <pre v-if="formattedText" class="formatted-output">{{ formattedText }}</pre>
          <div v-else-if="textProcessor.isLoading.value" class="panel-placeholder">
            <i class="pi pi-spin pi-refresh"></i>
            <span>Formatting...</span>
          </div>
          <div v-else class="panel-placeholder">
            <i class="pi pi-arrow-left"></i>
            <span>Paste code and click Beautify</span>
          </div>
        </div>
      </div>
    </div>

    <ToolActions
      :copy-text="formattedText"
      copy-label="Formatted output"
      @clear="clearInput"
      :sample="loadSample"
    />

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is Code Formatting?</h2>
      <p>Code formatting (also called "beautifying" or "pretty-printing") transforms compressed or messy code into a clean, consistently indented structure that's easy to read. Proper formatting makes code easier to debug, review, and maintain — especially when working with minified API responses, configuration files, or third-party code.</p>
      <p>DevYantra's Code Formatter supports JSON, SQL, XML, CSS, and more. It auto-detects the language from your input, applies language-specific formatting rules, and highlights syntax errors. All formatting runs locally in your browser — your code is never sent to any server.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Auto-detect input language (JSON, SQL, XML, CSS, JavaScript)</li>
        <li>Beautify with consistent indentation or minify to reduce size</li>
        <li>Syntax error detection and highlighting</li>
        <li>Smart paste detection — automatically formats on paste</li>
        <li>One-click copy of formatted output</li>
      </ul>

      <h2>How to Use the Code Formatter</h2>
      <ol>
        <li>Paste your code into the input area — the language is detected automatically.</li>
        <li>Select a different format type if auto-detection doesn't match.</li>
        <li>Click the format button to beautify, or the minify button to compress.</li>
        <li>Copy the result with the copy button or select and copy manually.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I format JSON online?</h3>
        <p>Paste your JSON into the input area and click the JSON format button. DevYantra will beautify it with proper indentation, validate the syntax, and highlight any errors. You can also minify JSON to reduce its size.</p>

        <h3>What is JSON beautification?</h3>
        <p>JSON beautification (or pretty-printing) adds proper indentation and line breaks to compressed JSON, making it human-readable. This is useful for debugging API responses, editing configuration files, and reviewing data structures.</p>

        <h3>Which code languages can I format?</h3>
        <p>DevYantra supports formatting for JSON, SQL, XML, CSS, and more. Each formatter handles language-specific syntax rules, indentation styles, and common formatting conventions.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/text-compare">Text Compare</router-link>
        <router-link to="/tools/base64-tools">Base64 Tools</router-link>
        <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'
import { useToolState } from '@/composables/useToolState'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

const textProcessor = useTextProcessor()
const clipboard = useClipboard()
const toast = useToast()

// Text content
const inputText = ref('')
const formattedText = ref('')

// Per-tool persistence (D2) — only the input round-trips; detectedType is
// cheaply recomputed below and formattedText is derived output that must be
// regenerated (Beautify) rather than persisted.
const toolState = useToolState('format-text', { input: inputText })

// Detected type
const detectedType = ref<TextType>('text')

// Smart suggestion
const smartSuggestion = ref<{ message: string; action: string; type: string } | null>(null)

// Sequential sample rotation
let sampleIndex = -1

// Format type options (toolbar buttons)
const formatTypes = [
  { type: 'json', label: 'JSON', tooltip: 'Format as JSON (⌘1)' },
  { type: 'sql', label: 'SQL', tooltip: 'Format as SQL (⌘2)' },
  { type: 'xml', label: 'XML', tooltip: 'Format as XML/HTML (⌘3)' },
  { type: 'css', label: 'CSS', tooltip: 'Format as CSS (⌘4)' },
  { type: 'js', label: 'JS', tooltip: 'Format as JavaScript (⌘5)' }
]

// Debounce timer for type detection
let detectionTimer: ReturnType<typeof setTimeout> | null = null

const onInputChange = () => {
  if (detectionTimer) clearTimeout(detectionTimer)
  detectionTimer = setTimeout(async () => {
    detectedType.value = await textProcessor.detectType(inputText.value)
  }, 500)

  formattedText.value = ''
}

// A restored input's type badge should reflect reality without requiring a
// keystroke first (formattedText is intentionally NOT regenerated — derived
// output is never persisted, so Beautify must be clicked again).
if (toolState.restored) onInputChange()

const formatText = async (typeHint?: TextType) => {
  if (!inputText.value.trim()) return

  const result = await textProcessor.formatText(inputText.value, typeHint)

  if (result.success && result.formatted) {
    formattedText.value = result.formatted
    detectedType.value = result.type
  } else if (result.error) {
    formattedText.value = ''
  }
}

const clearInput = () => {
  const previousInput = inputText.value
  const previousFormatted = formattedText.value
  const previousType = detectedType.value

  inputText.value = ''
  formattedText.value = ''
  detectedType.value = 'text'
  if (detectionTimer) clearTimeout(detectionTimer)

  if (previousInput) {
    toast.add({
      severity: 'info',
      summary: 'Input cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          inputText.value = previousInput
          formattedText.value = previousFormatted
          detectedType.value = previousType
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared text.
  toolState.flushSave()
}

// Smart detection for paste events
const detectFormatType = (text: string) => {
  if (!text.trim()) return null
  const trimmed = text.trim()

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return { type: 'json', message: 'JSON detected! Auto-format for better readability?' }
    } catch { /* continue */ }
  }

  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(trimmed)) {
    return { type: 'sql', message: 'SQL detected! Format for cleaner structure?' }
  }

  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return { type: 'xml', message: 'XML/HTML detected! Format for better structure?' }
  }

  if (trimmed.includes('{') && trimmed.includes('}') && trimmed.includes(':')) {
    const lines = trimmed.split('\n')
    const cssLikeLines = lines.filter(line => line.includes(':') || line.includes('{') || line.includes('}'))
    if (cssLikeLines.length > lines.length * 0.3) {
      return { type: 'css', message: 'CSS detected! Format for better readability?' }
    }
  }

  return null
}

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

const applySuggestion = async () => {
  if (!smartSuggestion.value) return
  if (smartSuggestion.value.action === 'format') {
    await formatText()
  }
  smartSuggestion.value = null
}

const applyQuickFormat = async (format: { type: string; label: string }) => {
  if (!inputText.value.trim()) return
  detectedType.value = format.type as TextType
  await formatText(format.type as TextType)
}

const copyInput = async () => {
  if (!inputText.value.trim()) return
  await clipboard.copyWithFeedback(inputText.value, 'Input')
}

const loadSample = async () => {
  const samples = [
    { type: 'json', content: '{"users":[{"id":1,"name":"John Doe","email":"john@example.com","active":true},{"id":2,"name":"Jane Smith","email":"jane@example.com","active":false}],"total":2,"page":1}' },
    { type: 'sql', content: 'SELECT u.id, u.name, u.email, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.active = true AND p.published_at > "2023-01-01" ORDER BY p.created_at DESC LIMIT 10;' },
    { type: 'xml', content: '<?xml version="1.0" encoding="UTF-8"?><catalog><book id="1"><title>The Great Gatsby</title><author>F. Scott Fitzgerald</author><price>12.99</price></book><book id="2"><title>To Kill a Mockingbird</title><author>Harper Lee</author><price>14.99</price></book></catalog>' },
    { type: 'css', content: '.container{width:100%;max-width:1200px;margin:0 auto;padding:20px}.header{background:#333;color:white;padding:10px;border-radius:5px}.button{background:linear-gradient(45deg,#007bff,#0056b3);border:none;color:white;padding:12px 24px;border-radius:4px;cursor:pointer;transition:all 0.3s ease}.button:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,123,255,0.3)}' },
    { type: 'js', content: 'const fetchUsers=async(page,limit)=>{try{const response=await fetch(`/api/users?page=${page}&limit=${limit}`);if(!response.ok){throw new Error(`HTTP ${response.status}`)}const{data,total}=await response.json();return{users:data.map(u=>({...u,fullName:`${u.first} ${u.last}`,isAdmin:u.roles.includes("admin")})),total,pages:Math.ceil(total/limit)}}catch(err){console.error("Failed to fetch users:",err);return{users:[],total:0,pages:0}}}' }
  ]

  sampleIndex = (sampleIndex + 1) % samples.length
  const sample = samples[sampleIndex]!
  inputText.value = sample.content
  detectedType.value = sample.type as TextType
  await formatText(sample.type as TextType)
}

const minifyText = async () => {
  if (!inputText.value.trim()) return
  try {
    let minified = inputText.value
    if (detectedType.value === 'json') {
      minified = JSON.stringify(JSON.parse(inputText.value))
    } else if (detectedType.value === 'css') {
      minified = inputText.value.replace(/\s+/g, ' ').replace(/;\s*}/g, '}').replace(/\s*{\s*/g, '{').replace(/;\s*/g, ';').trim()
    } else {
      minified = inputText.value.replace(/\s+/g, ' ').replace(/\n\s*/g, ' ').trim()
    }
    formattedText.value = minified
  } catch { /* */ }
}

const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    if (event.shiftKey) {
      switch (event.key) {
        case 'R': case 'r': event.preventDefault(); clearInput(); break
        case 'L': case 'l': event.preventDefault(); loadSample(); break
        case 'M': case 'm': event.preventDefault(); minifyText(); break
        case 'Enter': event.preventDefault(); if (inputText.value.trim()) formatText(); break
      }
    } else {
      const formatKeys = ['1', '2', '3', '4', '5']
      const keyIndex = formatKeys.indexOf(event.key)
      if (keyIndex !== -1 && formatTypes[keyIndex]) {
        event.preventDefault()
        applyQuickFormat(formatTypes[keyIndex])
      }
    }
  }
}

onMounted(() => { document.addEventListener('keydown', handleKeyboardShortcuts) })
onUnmounted(() => { document.removeEventListener('keydown', handleKeyboardShortcuts) })
</script>

<style scoped>
/* ===== TOOLBAR ===== */
.formatter-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.format-types {
  display: flex;
  background: var(--dt-surface-2);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.format-type-btn {
  padding: 4px 12px;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
  color: var(--dt-text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.format-type-btn:hover:not(.active):not(:disabled) {
  color: var(--dt-text-primary);
  background: var(--dt-surface-3);
}

.format-type-btn.active {
  background: var(--dt-brand);
  color: #ffffff;
}

.format-type-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.toolbar-btn {
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}

.toolbar-btn.primary-action {
  background: var(--dt-brand);
  border-color: var(--dt-brand);
  color: #ffffff;
}

.toolbar-btn.primary-action:hover:not(:disabled) {
  opacity: 0.9;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--dt-border);
  margin: 0 2px;
}

/* ===== SUGGESTION ===== */
.smart-suggestion {
  margin-bottom: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--dt-brand-light);
  border: 1px solid rgba(var(--dt-brand-rgb), 0.2);
  border-radius: var(--radius-md);
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--dt-text-primary);
}

.suggestion-content i { color: var(--dt-brand); }

.use-suggestion-btn { font-weight: 500; }

.dismiss-btn { opacity: 0.7; transition: opacity var(--transition-fast); }
.dismiss-btn:hover { opacity: 1; }

.error-message { margin-bottom: var(--space-md); }

/* ===== SIDE-BY-SIDE PANELS ===== */
.formatter-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  min-height: 400px;
}

.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--dt-surface-1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--dt-border);
  background: var(--dt-surface-2);
}

.panel-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--dt-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
}

.type-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  background: var(--dt-brand-light);
  color: var(--dt-brand);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--dt-brand-rgb), 0.2);
}

.panel-action {
  color: var(--dt-text-secondary);
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-action:hover:not(:disabled) {
  color: var(--dt-brand);
}

.panel-textarea {
  flex: 1;
  border: none;
  border-radius: 0;
  resize: none;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  padding: var(--space-md);
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
  min-height: 350px;
}

.panel-textarea:focus {
  outline: none;
  box-shadow: none;
}

.panel-output {
  flex: 1;
  overflow: auto;
  min-height: 350px;
}

.panel-output--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.formatted-output {
  margin: 0;
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dt-text-primary);
  background: transparent;
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--dt-text-tertiary);
  font-size: var(--text-sm);
}

.panel-placeholder i {
  font-size: 1.25rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .formatter-panels {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .panel-textarea,
  .panel-output {
    min-height: 200px;
  }

  .formatter-toolbar {
    gap: var(--space-sm);
  }

  .toolbar-actions {
    margin-left: 0;
    flex-wrap: wrap;
  }

  .toolbar-btn span {
    display: none;
  }
}

@media (max-width: 480px) {
  .format-type-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
