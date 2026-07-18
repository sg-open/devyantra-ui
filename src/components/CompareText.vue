<template>
  <div class="tool-panel compare-text">
    <header class="tool-hero">
      <h1>Text Compare Online</h1>
      <p>Compare two texts side by side and instantly see every difference. Supports JSON, SQL, and plain text with syntax-aware formatting.</p>
    </header>
      <div class="comparison-container">
        <!-- Left Text Area -->
        <div class="text-input-section">
          <div class="input-header">
            <label class="input-label">Original Text:</label>
            <div class="format-controls">
              <div
                :class="`status-indicator ${text1Type}`"
              >
                {{ text1Type.toUpperCase() }}
              </div>
              <button class="p-button p-button-sm p-button-outlined format-btn" :disabled="!text1Content.trim() || isFormatting1" @click="formatText1">
                <i class="pi pi-refresh" :class="{ 'pi-spin': isFormatting1 }"></i>
                {{ isFormatting1 ? 'Formatting...' : 'Format' }}
              </button>
            </div>
          </div>

          <!-- Smart Detection Suggestion for Left -->
          <div v-if="smartSuggestion1" class="smart-suggestion left-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>{{ smartSuggestion1.message }}</span>
              <button class="p-button p-button-sm use-suggestion-btn" @click="applySuggestion1">
                Apply
              </button>
              <button class="p-button p-button-sm p-button-text dismiss-btn" @click="smartSuggestion1 = null">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging1 }"
            @dragover.prevent="isDragging1 = true"
            @dragleave="isDragging1 = false"
            @drop.prevent="handleDrop($event, 'left')"
          >
            <textarea
              v-model="text1Content"
              placeholder="Paste your original text here, or drag & drop a file..."
              rows="12"
              class="p-inputtextarea text-area enhanced-textarea"
              @input="onText1Input"
              @paste="onText1Paste"
            ></textarea>
            <div v-if="isDragging1" class="drop-overlay">
              <i class="pi pi-upload"></i>
              <span>Drop file here</span>
            </div>
          </div>
          <input
            ref="fileInput1"
            type="file"
            accept=".txt,.json,.js,.ts,.vue,.css,.html,.xml,.sql,.py,.java,.cpp,.c,.md,.csv,.log"
            @change="handleFileInput($event, 'left')"
            style="display: none"
          />

          <!-- Quick Actions for Left -->
          <div class="quick-actions left-actions">
            <button class="p-button p-button-sm p-button-outlined quick-btn upload-btn" @click="fileInput1?.click()" v-tooltip="'Upload file'">
              <i class="pi pi-upload"></i>
              Upload
            </button>
            <button class="p-button p-button-sm p-button-outlined quick-btn copy-btn" :disabled="!text1Content.trim()" @click="copyText1" v-tooltip="'Copy (Cmd+Shift+1)'">
              <i class="pi pi-copy"></i>
              Copy
            </button>
            <button class="p-button p-button-sm p-button-outlined p-button-secondary quick-btn clear-btn" :disabled="!text1Content.trim()" @click="clearText1" v-tooltip="'Clear (Cmd+Shift+R)'">
              <i class="pi pi-trash"></i>
              Clear
            </button>
            <button class="p-button p-button-sm p-button-outlined quick-btn sample-btn" @click="loadSampleData" v-tooltip="'Load Sample (Cmd+Shift+L)'">
              <i class="pi pi-file"></i>
              Sample
            </button>
            <button class="p-button p-button-sm p-button-outlined quick-btn swap-btn" :disabled="!text1Content.trim() && !text2Content.trim()" @click="swapTexts" v-tooltip="'Swap Sides (Cmd+Shift+S)'">
              <i class="pi pi-arrow-right-arrow-left"></i>
              Swap
            </button>
          </div>
        </div>

        <!-- Right Text Area -->
        <div class="text-input-section">
          <div class="input-header">
            <label class="input-label">Changed Text:</label>
            <div class="format-controls">
              <div
                :class="`status-indicator ${text2Type}`"
              >
                {{ text2Type.toUpperCase() }}
              </div>
              <button class="p-button p-button-sm p-button-outlined format-btn" :disabled="!text2Content.trim() || isFormatting2" @click="formatText2">
                <i class="pi pi-refresh" :class="{ 'pi-spin': isFormatting2 }"></i>
                {{ isFormatting2 ? 'Formatting...' : 'Format' }}
              </button>
            </div>
          </div>

          <!-- Smart Detection Suggestion for Right -->
          <div v-if="smartSuggestion2" class="smart-suggestion right-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>{{ smartSuggestion2.message }}</span>
              <button class="p-button p-button-sm use-suggestion-btn" @click="applySuggestion2">
                Apply
              </button>
              <button class="p-button p-button-sm p-button-text dismiss-btn" @click="smartSuggestion2 = null">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging2 }"
            @dragover.prevent="isDragging2 = true"
            @dragleave="isDragging2 = false"
            @drop.prevent="handleDrop($event, 'right')"
          >
            <textarea
              v-model="text2Content"
              placeholder="Paste your changed text here, or drag & drop a file..."
              rows="12"
              class="p-inputtextarea text-area enhanced-textarea"
              @input="onText2Input"
              @paste="onText2Paste"
            ></textarea>
            <div v-if="isDragging2" class="drop-overlay">
              <i class="pi pi-upload"></i>
              <span>Drop file here</span>
            </div>
          </div>
          <input
            ref="fileInput2"
            type="file"
            accept=".txt,.json,.js,.ts,.vue,.css,.html,.xml,.sql,.py,.java,.cpp,.c,.md,.csv,.log"
            @change="handleFileInput($event, 'right')"
            style="display: none"
          />

          <!-- Quick Actions for Right -->
          <div class="quick-actions right-actions">
            <button class="p-button p-button-sm p-button-outlined quick-btn upload-btn" @click="fileInput2?.click()" v-tooltip="'Upload file'">
              <i class="pi pi-upload"></i>
              Upload
            </button>
            <button class="p-button p-button-sm p-button-outlined quick-btn copy-btn" :disabled="!text2Content.trim()" @click="copyText2" v-tooltip="'Copy (Cmd+Shift+2)'">
              <i class="pi pi-copy"></i>
              Copy
            </button>
            <button class="p-button p-button-sm p-button-outlined p-button-secondary quick-btn clear-btn" :disabled="!text2Content.trim()" @click="clearText2" v-tooltip="'Clear (Cmd+Shift+E)'">
              <i class="pi pi-trash"></i>
              Clear
            </button>
            <button class="p-button p-button-sm p-button-outlined quick-btn share-btn" :disabled="!text1Content.trim() && !text2Content.trim()" @click="onShareClick" v-tooltip="'Share comparison'">
              <i class="pi pi-share-alt"></i>
              Share
            </button>
            <button class="p-button p-button-sm p-button-outlined p-button-secondary quick-btn clear-btn" :disabled="!text1Content.trim() && !text2Content.trim()" @click="clearAll" v-tooltip="'Clear All'">
              <i class="pi pi-trash"></i>
              Clear All
            </button>
          </div>
        </div>
      </div>

      <!-- Compare Button -->
      <div class="compare-action">
        <button class="p-button compare-btn" :disabled="!text1Content.trim() || !text2Content.trim()" @click="onCompare">
          <i class="pi pi-search"></i>
          Compare
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="textProcessor.error.value" class="p-message p-message-error error-message" role="alert">
        <div class="p-message-text">{{ textProcessor.error.value }}</div>
      </div>

      <!-- Diff Renderer (shown after clicking Compare) -->
      <div v-if="showDiff && hasBothInputs" class="comparison-results">
        <hr class="p-divider" />
        <DiffRenderer
          :left-text="text1Content"
          :right-text="text2Content"
          :mode="diffViewMode"
          :ignore-whitespace="diffOptions.ignoreWhitespace"
          :ignore-case="diffOptions.ignoreCase"
          :language="detectedLanguage"
          @mode-changed="diffViewMode = $event"
          @options-changed="diffOptions = $event"
          class="enhanced-diff"
        />
      </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Diff Tool?</h2>
      <p>A diff tool (short for "difference") compares two versions of text and highlights what changed between them. Additions appear in green, deletions in red, and modifications are marked so you can spot every change at a glance. Diff tools are essential for code reviews, document revision tracking, and configuration file comparison.</p>
      <p>DevYantra's Text Compare works entirely in your browser — your data never leaves your device. It supports plain text, JSON, SQL, XML, and automatically formats structured data before comparing so you can see meaningful structural differences, not just whitespace changes.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Side-by-side and inline diff views with color-coded highlighting</li>
        <li>Smart JSON and SQL detection with auto-formatting before comparison</li>
        <li>File upload and drag-and-drop support for comparing documents</li>
        <li>Line-by-line navigation with keyboard shortcuts</li>
        <li>Copy diff output or download as a patch file</li>
      </ul>

      <h2>How to Use Text Compare</h2>
      <ol>
        <li>Paste or type your original text in the left panel.</li>
        <li>Paste or type the modified text in the right panel.</li>
        <li>Differences are highlighted automatically — green for additions, red for deletions.</li>
        <li>Use the toggle to switch between side-by-side and inline views.</li>
        <li>Navigate between changes using the arrow buttons or keyboard shortcuts.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I compare two text files online?</h3>
        <p>Paste or type your original text in the left panel and the modified text in the right panel. DevYantra instantly highlights additions, deletions, and modifications with color-coded diff markers. You can switch between side-by-side and inline views.</p>

        <h3>What is a diff tool?</h3>
        <p>A diff tool compares two pieces of text and shows the differences between them. It highlights added lines in green, removed lines in red, and changed sections in yellow. Developers use diff tools to review code changes, compare configuration files, and track document revisions.</p>

        <h3>Can I compare JSON or SQL files?</h3>
        <p>Yes. DevYantra automatically detects and formats JSON and SQL before comparing, so structural differences are clear. The tool also supports plain text, XML, and other formats.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/format-text">Code Formatter</router-link>
        <router-link to="/tools/delimiter">Delimiter Tool</router-link>
        <router-link to="/tools/character-count">Character Counter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'
import { useShareState } from '@/composables/useShareState'
import DiffRenderer from '@/components/DiffRenderer.vue'

const toast = useToast()
const textProcessor = useTextProcessor()

// Text content
const text1Content = ref('')
const text2Content = ref('')

// File upload refs
const fileInput1 = ref<HTMLInputElement>()
const fileInput2 = ref<HTMLInputElement>()

// Drag state
const isDragging1 = ref(false)
const isDragging2 = ref(false)

// File upload constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = ['txt', 'json', 'js', 'ts', 'html', 'css', 'xml', 'sql', 'py', 'java', 'cpp', 'c', 'vue', 'md', 'csv', 'log']
const ALLOWED_MIME_PREFIXES = ['text/', 'application/json', 'application/javascript', 'application/xml', 'application/sql']

// Diff comparison options — updated by DiffRenderer's options-changed event
// and persisted/shared through useShareState.
const diffOptions = ref<{ ignoreWhitespace: boolean; ignoreCase: boolean }>({
  ignoreWhitespace: false,
  ignoreCase: false
})
const shareState = useShareState(text1Content, text2Content, diffOptions, {
  autoSave: true,
  autoLoad: true
})

const hasBothInputs = computed(() => text1Content.value.trim().length > 0 && text2Content.value.trim().length > 0)

// Text types
const text1Type = ref<TextType>('text')
const text2Type = ref<TextType>('text')

// Loading states for individual format operations
const isFormatting1 = ref(false)
const isFormatting2 = ref(false)

// Diff view mode
const diffViewMode = ref<'split' | 'unified'>('split')

// Whether to show diff results (toggled by Compare button)
const showDiff = ref(false)

// Smart suggestions
const smartSuggestion1 = ref<{ message: string; action: string; data?: unknown } | null>(null)
const smartSuggestion2 = ref<{ message: string; action: string; data?: unknown } | null>(null)

// Debounce timers for type detection
let text1Timer: ReturnType<typeof setTimeout> | null = null
let text2Timer: ReturnType<typeof setTimeout> | null = null

// Language detection for DiffRenderer
const detectedLanguage = computed(() => {
  const text = text1Content.value || text2Content.value
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
})

// Compare button handler
const onCompare = () => {
  showDiff.value = true
}

// Share handler
const onShareClick = async () => {
  await shareState.copyShareUrl()
}

const onText1Input = () => {
  showDiff.value = false
  if (text1Timer) clearTimeout(text1Timer)
  text1Timer = setTimeout(async () => {
    text1Type.value = await textProcessor.detectType(text1Content.value)
  }, 500)
}

const onText2Input = () => {
  showDiff.value = false
  if (text2Timer) clearTimeout(text2Timer)
  text2Timer = setTimeout(async () => {
    text2Type.value = await textProcessor.detectType(text2Content.value)
  }, 500)
}

const formatText1 = async () => {
  if (!text1Content.value.trim()) return

  isFormatting1.value = true
  try {
    const result = await textProcessor.formatText(text1Content.value)
    if (result.success && result.formatted) {
      text1Content.value = result.formatted
      text1Type.value = result.type
    }
  } finally {
    isFormatting1.value = false
  }
}

const formatText2 = async () => {
  if (!text2Content.value.trim()) return

  isFormatting2.value = true
  try {
    const result = await textProcessor.formatText(text2Content.value)
    if (result.success && result.formatted) {
      text2Content.value = result.formatted
      text2Type.value = result.type
    }
  } finally {
    isFormatting2.value = false
  }
}


// Smart detection for paste events
const detectContentType = (text: string) => {
  if (!text.trim()) return null

  const trimmed = text.trim()

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return { type: 'json', message: 'JSON detected! Auto-format for better comparison?' }
    } catch {
      // Continue checking
    }
  }

  // SQL detection
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(trimmed)) {
    return { type: 'sql', message: 'SQL detected! Format for cleaner comparison?' }
  }

  // CSV detection
  if (trimmed.includes(',') && trimmed.includes('\n') && trimmed.split('\n').length > 2) {
    const lines = trimmed.split('\n')
    const avgCommas = lines.reduce((sum, line) => sum + (line.match(/,/g)?.length || 0), 0) / lines.length
    if (avgCommas > 1) {
      return { type: 'csv', message: 'CSV data detected! Format for structured comparison?' }
    }
  }

  return null
}

// Paste event handlers with smart detection
const onText1Paste = async (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') || ''
  const detection = detectContentType(text)

  if (detection) {
    smartSuggestion1.value = {
      message: detection.message,
      action: 'format',
      data: { type: detection.type, text }
    }
  }
}

const onText2Paste = async (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') || ''
  const detection = detectContentType(text)

  if (detection) {
    smartSuggestion2.value = {
      message: detection.message,
      action: 'format',
      data: { type: detection.type, text }
    }
  }
}

// Apply smart suggestions
const applySuggestion1 = async () => {
  if (!smartSuggestion1.value) return

  if (smartSuggestion1.value.action === 'format') {
    await formatText1()
  }
  smartSuggestion1.value = null
}

const applySuggestion2 = async () => {
  if (!smartSuggestion2.value) return

  if (smartSuggestion2.value.action === 'format') {
    await formatText2()
  }
  smartSuggestion2.value = null
}

// Quick action methods
const copyText1 = async () => {
  if (!text1Content.value.trim()) return

  try {
    await navigator.clipboard.writeText(text1Content.value)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

const copyText2 = async () => {
  if (!text2Content.value.trim()) return

  try {
    await navigator.clipboard.writeText(text2Content.value)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

const clearText1 = () => {
  text1Content.value = ''
  text1Type.value = 'text'
  smartSuggestion1.value = null
}

const clearText2 = () => {
  text2Content.value = ''
  text2Type.value = 'text'
  smartSuggestion2.value = null
}

const swapTexts = () => {
  const temp = text1Content.value
  text1Content.value = text2Content.value
  text2Content.value = temp

  const tempType = text1Type.value
  text1Type.value = text2Type.value
  text2Type.value = tempType

  // Clear suggestions when swapping
  smartSuggestion1.value = null
  smartSuggestion2.value = null
}

const loadSampleData = () => {
  const sampleData = [
    {
      original: '{"name":"John","age":30,"city":"New York","hobbies":["reading","cycling"]}',
      changed: '{"name":"John","age":31,"city":"Boston","country":"USA","hobbies":["reading","swimming","cycling"]}'
    },
    {
      original: 'SELECT id, name, email FROM users WHERE active = 1;',
      changed: 'SELECT id, name, email, created_at FROM users WHERE active = 1 AND verified = 1;'
    },
    {
      original: 'Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles',
      changed: 'Name,Age,City,Country\nJohn,31,Boston,USA\nJane,25,Los Angeles,USA\nBob,35,Chicago,USA'
    }
  ]

  const sample = sampleData[Math.floor(Math.random() * sampleData.length)]!
  text1Content.value = sample.original
  text2Content.value = sample.changed

  // Trigger type detection
  onText1Input()
  onText2Input()
}

// Keyboard shortcut handler
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    if (event.shiftKey) {
      switch (event.key) {
        case '1':
          event.preventDefault()
          copyText1()
          break
        case '2':
          event.preventDefault()
          copyText2()
          break
        case 'R':
        case 'r':
          event.preventDefault()
          clearText1()
          break
        case 'E':
        case 'e':
          event.preventDefault()
          clearText2()
          break
        case 'S':
        case 's':
          event.preventDefault()
          swapTexts()
          break
        case 'L':
        case 'l':
          event.preventDefault()
          loadSampleData()
          break
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

// File validation
const isFileAllowed = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not supported. Use text-based files only.`
  }

  if (file.type && !ALLOWED_MIME_PREFIXES.some(p => file.type.startsWith(p)) && file.type !== '') {
    return 'Only text-based files are allowed for comparison.'
  }

  return null
}

// Check for binary content
const isBinaryContent = (text: string): boolean => {
  // Check first 8KB for null bytes or high concentration of non-printable chars
  const sample = text.slice(0, 8192)
  let nonPrintable = 0
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i)
    if (code === 0) return true
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) nonPrintable++
  }
  return nonPrintable / sample.length > 0.1
}

const loadFile = async (file: File, side: 'left' | 'right') => {
  const error = isFileAllowed(file)
  if (error) {
    toast.add({ severity: 'error', summary: 'Invalid File', detail: error, life: 5000 })
    return
  }

  try {
    const text = await file.text()

    if (isBinaryContent(text)) {
      toast.add({
        severity: 'error',
        summary: 'Binary File',
        detail: 'This appears to be a binary file. Only text files are supported.',
        life: 5000
      })
      return
    }

    if (side === 'left') {
      text1Content.value = text
      onText1Input()
    } else {
      text2Content.value = text
      onText2Input()
    }

  } catch {
    toast.add({
      severity: 'error',
      summary: 'Read Error',
      detail: 'Failed to read the file',
      life: 5000
    })
  }
}

const handleFileInput = (event: Event, side: 'left' | 'right') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadFile(file, side)
  target.value = '' // Reset so same file can be re-uploaded
}

const handleDrop = (event: DragEvent, side: 'left' | 'right') => {
  isDragging1.value = false
  isDragging2.value = false

  const file = event.dataTransfer?.files?.[0]
  if (file) loadFile(file, side)
}

const clearAll = () => {
  text1Content.value = ''
  text2Content.value = ''
  text1Type.value = 'text'
  text2Type.value = 'text'
  showDiff.value = false
  smartSuggestion1.value = null
  smartSuggestion2.value = null

  if (text1Timer) clearTimeout(text1Timer)
  if (text2Timer) clearTimeout(text2Timer)
}
</script>

<style scoped>
.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.text-input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--dt-text-primary);
  margin: 0;
}

.text-area {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  width: 100%;
}

.format-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--dt-surface-1);
  color: var(--dt-text-secondary);
  border: 1px solid var(--dt-border);
}

.status-indicator.json {
  background: rgba(16, 185, 129, 0.15);
  color: var(--dt-success);
  border-color: var(--dt-success);
}

.status-indicator.sql {
  background: rgba(var(--dt-brand-rgb), 0.15);
  color: var(--dt-brand);
  border-color: var(--dt-brand);
}

.comparison-results {
  margin-top: 1.5rem;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .comparison-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .input-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .format-controls {
    align-self: flex-end;
  }
}

.empty-state {
  margin-top: var(--space-xl);
}

/* ===== ENHANCED UX FEATURES ===== */

/* Enhanced text areas */
.enhanced-textarea {
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.enhanced-textarea:focus {
  border-color: var(--dt-brand);
  box-shadow: var(--focus-ring);
}

/* Smart suggestions */
.smart-suggestion {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--dt-brand-light);
  border: 1px solid rgba(var(--dt-brand-rgb), 0.2);
  border-radius: var(--radius-md);
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--dt-text-primary);
}

.suggestion-content i {
  color: #fbbf24;
  font-size: 1rem;
}

.use-suggestion-btn {
  background: var(--dt-brand);
  border: none;
  color: white;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.use-suggestion-btn:hover {
  opacity: 0.9;
}

.dismiss-btn {
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.dismiss-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Quick actions */
.compare-action {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.compare-btn {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 2.5rem;
  gap: 0.5rem;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--dt-surface-2);
  border-radius: 8px;
  border: 1px solid var(--dt-border);
}

.quick-btn {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.quick-btn:hover {
  background: var(--dt-surface-3);
  border-color: var(--dt-border-strong);
}

/* Drop zone */
.drop-zone {
  position: relative;
}

.drop-zone--active {
  border-radius: 8px;
  outline: 2px dashed var(--dt-brand);
  outline-offset: 2px;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(var(--dt-brand-rgb), 0.1);
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--dt-brand);
}

.drop-overlay i {
  font-size: 1.5rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .quick-actions {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }

  .quick-actions::-webkit-scrollbar {
    display: none;
  }

  .quick-btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .suggestion-content {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}


</style>
