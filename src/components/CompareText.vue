<template>
  <Card class="compare-text">
    <template #title>
      <div class="card-header">
        <i class="pi pi-sync text-2xl mr-2"></i>
        Text Compare
      </div>
    </template>

    <template #subtitle>
      Spot the differences between your text, JSON, or SQL
    </template>

    <template #content>
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
              <Button
                @click="formatText1"
                :disabled="!text1Content.trim() || isFormatting1"
                size="small"
                variant="outlined"
                class="format-btn"
              >
                <i class="pi pi-refresh" :class="{ 'pi-spin': isFormatting1 }"></i>
                {{ isFormatting1 ? 'Formatting...' : 'Format' }}
              </Button>
            </div>
          </div>

          <!-- Smart Detection Suggestion for Left -->
          <div v-if="smartSuggestion1" class="smart-suggestion left-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>{{ smartSuggestion1.message }}</span>
              <Button
                @click="applySuggestion1"
                size="small"
                class="use-suggestion-btn"
              >
                Apply
              </Button>
              <Button
                @click="smartSuggestion1 = null"
                size="small"
                variant="text"
                class="dismiss-btn"
              >
                <i class="pi pi-times"></i>
              </Button>
            </div>
          </div>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging1 }"
            @dragover.prevent="isDragging1 = true"
            @dragleave="isDragging1 = false"
            @drop.prevent="handleDrop($event, 'left')"
          >
            <Textarea
              v-model="text1Content"
              placeholder="Paste your original text here, or drag & drop a file..."
              rows="12"
              class="text-area enhanced-textarea"
              @input="onText1Input"
              @paste="onText1Paste"
            />
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
            <Button
              @click="fileInput1?.click()"
              size="small"
              variant="outlined"
              class="quick-btn upload-btn"
              v-tooltip="'Upload file'"
            >
              <i class="pi pi-upload"></i>
              Upload
            </Button>
            <Button
              @click="copyText1"
              :disabled="!text1Content.trim()"
              size="small"
              variant="outlined"
              class="quick-btn copy-btn"
              v-tooltip="'Copy (Cmd+Shift+1)'"
            >
              <i class="pi pi-copy"></i>
              Copy
            </Button>
            <Button
              @click="clearText1"
              :disabled="!text1Content.trim()"
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
              @click="swapTexts"
              :disabled="!text1Content.trim() && !text2Content.trim()"
              size="small"
              variant="outlined"
              class="quick-btn swap-btn"
              v-tooltip="'Swap Sides (Cmd+Shift+S)'"
            >
              <i class="pi pi-refresh"></i>
              Swap
            </Button>
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
              <Button
                @click="formatText2"
                :disabled="!text2Content.trim() || isFormatting2"
                size="small"
                variant="outlined"
                class="format-btn"
              >
                <i class="pi pi-refresh" :class="{ 'pi-spin': isFormatting2 }"></i>
                {{ isFormatting2 ? 'Formatting...' : 'Format' }}
              </Button>
            </div>
          </div>

          <!-- Smart Detection Suggestion for Right -->
          <div v-if="smartSuggestion2" class="smart-suggestion right-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>{{ smartSuggestion2.message }}</span>
              <Button
                @click="applySuggestion2"
                size="small"
                class="use-suggestion-btn"
              >
                Apply
              </Button>
              <Button
                @click="smartSuggestion2 = null"
                size="small"
                variant="text"
                class="dismiss-btn"
              >
                <i class="pi pi-times"></i>
              </Button>
            </div>
          </div>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging2 }"
            @dragover.prevent="isDragging2 = true"
            @dragleave="isDragging2 = false"
            @drop.prevent="handleDrop($event, 'right')"
          >
            <Textarea
              v-model="text2Content"
              placeholder="Paste your changed text here, or drag & drop a file..."
              rows="12"
              class="text-area enhanced-textarea"
              @input="onText2Input"
              @paste="onText2Paste"
            />
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
            <Button
              @click="fileInput2?.click()"
              size="small"
              variant="outlined"
              class="quick-btn upload-btn"
              v-tooltip="'Upload file'"
            >
              <i class="pi pi-upload"></i>
              Upload
            </Button>
            <Button
              @click="copyText2"
              :disabled="!text2Content.trim()"
              size="small"
              variant="outlined"
              class="quick-btn copy-btn"
              v-tooltip="'Copy (Cmd+Shift+2)'"
            >
              <i class="pi pi-copy"></i>
              Copy
            </Button>
            <Button
              @click="clearText2"
              :disabled="!text2Content.trim()"
              size="small"
              variant="outlined"
              severity="secondary"
              class="quick-btn clear-btn"
              v-tooltip="'Clear (Cmd+Shift+E)'"
            >
              <i class="pi pi-trash"></i>
              Clear
            </Button>
            <Button
              @click="loadSampleData"
              size="small"
              variant="outlined"
              class="quick-btn sample-btn"
              v-tooltip="'Load Sample (Cmd+Shift+L)'"
            >
              <i class="pi pi-file"></i>
              Sample
            </Button>
            <Button
              @click="onShareClick"
              :disabled="!text1Content.trim() && !text2Content.trim()"
              size="small"
              variant="outlined"
              class="quick-btn share-btn"
              v-tooltip="'Share comparison'"
            >
              <i class="pi pi-share-alt"></i>
              Share
            </Button>
            <Button
              @click="clearAll"
              :disabled="!text1Content.trim() && !text2Content.trim()"
              size="small"
              variant="outlined"
              severity="secondary"
              class="quick-btn clear-btn"
              v-tooltip="'Clear All'"
            >
              <i class="pi pi-trash"></i>
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <!-- Compare Button -->
      <div class="compare-action">
        <Button
          @click="onCompare"
          :disabled="!text1Content.trim() || !text2Content.trim()"
          class="compare-btn"
          severity="primary"
        >
          <i class="pi pi-sync"></i>
          Compare
        </Button>
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

      <!-- Diff Renderer (shown after clicking Compare) -->
      <div v-if="showDiff && diffEngine.hasBothInputs.value" class="comparison-results">
        <Divider />
        <DiffRenderer
          :left-text="text1Content"
          :right-text="text2Content"
          :mode="diffViewMode"
          :ignore-whitespace="false"
          :ignore-case="false"
          :language="detectedLanguage"
          :virtual-scroll-enabled="false"
          :diff-stats="diffEngine.stats.value"
          @diff-computed="onDiffRendererComputed"
          @mode-changed="diffViewMode = $event"
          @copy-diff="onCopyDiff"
          @download-patch="onDownloadPatch"
          class="enhanced-diff"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'
import { useDiffEngine } from '@/composables/useDiffEngine'
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

// Diff engine for accurate stats
const diffEngine = useDiffEngine(text1Content, text2Content)

// Share state for URL/localStorage persistence
const shareOptions = ref<{ ignoreWhitespace: boolean; ignoreCase: boolean }>({
  ignoreWhitespace: false,
  ignoreCase: false
})
const shareState = useShareState(text1Content, text2Content, shareOptions, {
  autoSave: true,
  autoLoad: true
})

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
let lastToastStatsKey = ''
const onCompare = () => {
  lastToastStatsKey = '' // Reset so next diff-computed fires a fresh toast
  showDiff.value = true
}

// DiffRenderer event handler — deduplicated to avoid double toasts
const onDiffRendererComputed = (stats: { additions: number; deletions: number; modifications: number; totalLines: number; computeTime: number }) => {
  const key = `${stats.additions}-${stats.deletions}-${stats.modifications}`
  if (key === lastToastStatsKey) return // Already shown for this result
  lastToastStatsKey = key

  if (stats.additions > 0 || stats.deletions > 0 || stats.modifications > 0) {
    toast.add({
      severity: 'info',
      summary: 'Differences Found',
      detail: `${stats.additions} additions, ${stats.deletions} deletions, ${stats.modifications} modifications`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'success',
      summary: 'No Differences',
      detail: 'The texts are identical',
      life: 3000
    })
  }
}

// Share handler
const onShareClick = async () => {
  const success = await shareState.copyShareUrl()
  toast.add({
    severity: success ? 'success' : 'error',
    summary: success ? 'Link Copied' : 'Share Failed',
    detail: success ? 'Shareable link copied to clipboard' : 'URL too long to share. Try shorter text.',
    life: 3000
  })
}

// Export handlers
const onCopyDiff = async () => {
  const success = await diffEngine.copyDiffToClipboard()
  toast.add({
    severity: success ? 'success' : 'error',
    summary: success ? 'Copied' : 'Copy Failed',
    detail: success ? 'Diff copied to clipboard' : 'Could not copy diff',
    life: 2000
  })
}

const onDownloadPatch = () => {
  diffEngine.downloadPatch()
  toast.add({
    severity: 'success',
    summary: 'Downloaded',
    detail: 'Patch file downloaded',
    life: 2000
  })
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
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Text formatted successfully',
        life: 3000
      })
    } else if (result.error) {
      toast.add({
        severity: 'error',
        summary: 'Format Error',
        detail: result.error,
        life: 5000
      })
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
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Text formatted successfully',
        life: 3000
      })
    } else if (result.error) {
      toast.add({
        severity: 'error',
        summary: 'Format Error',
        detail: result.error,
        life: 5000
      })
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
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Original text copied to clipboard',
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Could not copy to clipboard',
      life: 3000
    })
  }
}

const copyText2 = async () => {
  if (!text2Content.value.trim()) return

  try {
    await navigator.clipboard.writeText(text2Content.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Changed text copied to clipboard',
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Could not copy to clipboard',
      life: 3000
    })
  }
}

const clearText1 = () => {
  text1Content.value = ''
  text1Type.value = 'text'
  smartSuggestion1.value = null

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'Original text cleared',
    life: 2000
  })
}

const clearText2 = () => {
  text2Content.value = ''
  text2Type.value = 'text'
  smartSuggestion2.value = null

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'Changed text cleared',
    life: 2000
  })
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

  toast.add({
    severity: 'info',
    summary: 'Swapped',
    detail: 'Text content swapped between sides',
    life: 2000
  })
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

  const sample = sampleData[Math.floor(Math.random() * sampleData.length)]
  text1Content.value = sample.original
  text2Content.value = sample.changed

  // Trigger type detection
  onText1Input()
  onText2Input()

  toast.add({
    severity: 'info',
    summary: 'Sample Loaded',
    detail: 'Sample data loaded for comparison',
    life: 2000
  })
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

    toast.add({
      severity: 'success',
      summary: 'File Loaded',
      detail: `${file.name} loaded successfully`,
      life: 3000
    })
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

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'All content has been cleared',
    life: 2000
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

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
  color: var(--text-color);
  margin: 0;
}

.text-area {
  font-family: 'JetBrains Mono', monospace;
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
  background: var(--surface-card);
  color: var(--text-color-secondary);
  border: 1px solid var(--surface-border);
}

.status-indicator.json {
  background: var(--green-200);
  color: var(--green-300);
  border-color: var(--green-300);
}

.status-indicator.sql {
  background: var(--blue-200);
  color: var(--blue-300);
  border-color: var(--blue-300);
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.enhanced-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
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
  background: rgba(var(--surface-ground), 0.5);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.quick-btn {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
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

.swap-btn:hover {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.sample-btn:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.share-btn:hover {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.upload-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Drop zone */
.drop-zone {
  position: relative;
}

.drop-zone--active {
  border-radius: 8px;
  outline: 2px dashed var(--primary-color);
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
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-color);
}

.drop-overlay i {
  font-size: 1.5rem;
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

/* Mobile responsive */
@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-btn {
    flex: none;
  }

  .suggestion-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
