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

          <Textarea
            v-model="text1Content"
            placeholder="Paste your original text here..."
            rows="12"
            class="text-area enhanced-textarea"
            @input="onText1Input"
            @paste="onText1Paste"
          />

          <!-- Quick Actions for Left -->
          <div class="quick-actions left-actions">
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

          <Textarea
            v-model="text2Content"
            placeholder="Paste your changed text here..."
            rows="12"
            class="text-area enhanced-textarea"
            @input="onText2Input"
            @paste="onText2Paste"
          />

          <!-- Quick Actions for Right -->
          <div class="quick-actions right-actions">
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
          </div>
        </div>
      </div>

      <Divider />

      <!-- Action Buttons - Unified CTA Toolbar -->
      <Toolbar class="cta-toolbar">
        <template #center>
          <div class="cta-group">
            <Button
              @click="showDiff = true"
              :disabled="!text1Content.trim() || !text2Content.trim()"
              class="compare-btn animate-glow"
                          >
              <i class="pi pi-search"></i>
              Find differences
            </Button>
            <Button
              @click="clearAll"
              :disabled="!text1Content.trim() && !text2Content.trim()"
              variant="outlined"
              severity="secondary"
              class="clear-btn"
            >
              <i class="pi pi-trash"></i>
              Clear all
            </Button>
          </div>
        </template>
      </Toolbar>

      <!-- Error Message -->
      <Message
        v-if="textProcessor.error.value"
        severity="error"
        :closable="false"
        class="error-message"
      >
        {{ textProcessor.error.value }}
      </Message>

      <!-- Enhanced Diff Renderer -->
      <div v-if="showDiff && (text1Content.trim() || text2Content.trim())" class="comparison-results">
        <Divider />
        <DiffRenderer
          :left-text="text1Content"
          :right-text="text2Content"
          :mode="diffViewMode"
          :granularity="'line'"
          :ignore-whitespace="false"
          :ignore-case="false"
          :language="detectedLanguage"
          :virtual-scroll-enabled="false"
          @diff-computed="onDiffRendererComputed"
          @mode-changed="diffViewMode = $event"
          class="enhanced-diff"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="showDiff" class="empty-state">
        <Message severity="info" :closable="false">
          <i class="pi pi-info-circle"></i>
          No differences found - the texts are identical!
        </Message>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'
import DiffRenderer from '@/components/DiffRenderer.vue'

const toast = useToast()
const textProcessor = useTextProcessor()

// Text content
const text1Content = ref('')
const text2Content = ref('')

// Text types
const text1Type = ref<TextType>('text')
const text2Type = ref<TextType>('text')

// Loading states for individual format operations
const isFormatting1 = ref(false)
const isFormatting2 = ref(false)

// Diff view mode and display state
const diffViewMode = ref<'split' | 'unified'>('split')
const showDiff = ref(false)

// Smart suggestions
const smartSuggestion1 = ref<{ message: string; action: string; data?: any } | null>(null)
const smartSuggestion2 = ref<{ message: string; action: string; data?: any } | null>(null)

// Debounce timers for type detection
let text1Timer: ReturnType<typeof setTimeout> | null = null
let text2Timer: ReturnType<typeof setTimeout> | null = null

// Language detection for DiffRenderer
const detectedLanguage = computed(() => {
  // Simple language detection based on text content
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

// DiffRenderer event handler
const onDiffRendererComputed = (stats: { additions: number; deletions: number; modifications: number; totalLines: number; computeTime: number }) => {
  // Show toast with diff results
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

const onText1Input = () => {
  if (text1Timer) clearTimeout(text1Timer)
  text1Timer = setTimeout(async () => {
    text1Type.value = await textProcessor.detectType(text1Content.value)
  }, 500)
  showDiff.value = false
}

const onText2Input = () => {
  if (text2Timer) clearTimeout(text2Timer)
  text2Timer = setTimeout(async () => {
    text2Type.value = await textProcessor.detectType(text2Content.value)
  }, 500)
  showDiff.value = false
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
  } catch (error) {
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
  } catch (error) {
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
  showDiff.value = false

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
  showDiff.value = false

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
  showDiff.value = false

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
        case 'Enter':
          event.preventDefault()
          if (text1Content.value.trim() && text2Content.value.trim()) {
            showDiff.value = true
          }
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

.cta-toolbar {
  margin: 1.5rem 0;
  background: transparent;
  border: none;
  padding: 0;
}

.cta-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.comparison-results {
  margin-top: 1.5rem;
}

.result-summary {
  margin-bottom: 1rem;
}

.differences-section {
  margin-top: 1rem;
}

/* Difference Items */
.difference-item {
  border-left: var(--space-xs) solid var(--dt-warning); /* 4px accent */
  border-radius: var(--radius-lg);
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
}

.difference-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-md); /* 12px = 1.5 baseline */
  padding: var(--space-lg); /* 16px = 2 baseline */
}

.difference-path {
  display: flex;
  align-items: center;
  gap: var(--space-sm); /* 8px = 1 baseline */
}

.path-label {
  font-size: var(--text-xs); /* 12px */
}

.path-value {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  border: 1px solid var(--dt-border);
}

.difference-type {
  display: flex;
  align-items: center;
}

.type-label {
  font-size: var(--text-xs); /* 12px */
}

.difference-values {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm); /* 8px = 1 baseline */
}

.value-item {
  padding: var(--space-md); /* 12px = 1.5 baseline */
  border-radius: var(--radius-md);
  border: 1px solid var(--dt-border);
  background: var(--dt-surface-1);
}

.value-item strong {
  display: block;
  margin-bottom: var(--space-sm); /* 8px = 1 baseline */
  font-size: var(--text-sm); /* 14px */
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
}

.value-item code {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  word-break: break-all;
  border: 1px solid var(--dt-border);
}

.value-first {
  background: var(--dt-warning-light);
  border-color: var(--dt-warning);
}

.value-second {
  background: var(--dt-brand-light);
  border-color: var(--dt-brand);
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

  .cta-group {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.empty-state {
  margin-top: var(--space-xl);
}

/* ===== DIFF CONTAINERS ===== */
.diff-container {
  margin-bottom: var(--space-xl); /* 24px = 3 baseline */
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-1);
}

/* ===== UNIFIED DIFF STYLING ===== */
.unified-diff {
  width: 100%;
}

.diff-content-wrapper {
  background: var(--dt-surface-1);
  border-radius: var(--radius-md);
  border: 1px solid var(--dt-border);
  overflow: hidden;
}

.diff-output {
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-relaxed);
  padding: var(--space-lg); /* 16px = 2 baseline */
  margin: 0;
  background: transparent;
  color: var(--dt-text-primary);
  white-space: pre;
  overflow-x: auto;
  max-height: 600px; /* 75 baseline = 600px */
  overflow-y: auto;
}

/* Color coding for unified diff lines */
.diff-output {
  background: linear-gradient(
    to right,
    transparent 0,
    transparent 50px,
    var(--dt-surface-2) 50px,
    var(--dt-surface-2) 52px,
    transparent 52px
  );
}


/* ===== STRUCTURAL DIFFERENCES ===== */
.structural-differences {
  margin-top: var(--space-xl); /* 24px = 3 baseline */
}

.structural-title {
  display: flex;
  align-items: center;
  font-size: var(--text-lg); /* 18px */
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  margin: 0;
  margin-bottom: var(--space-lg); /* 16px = 2 baseline */
}

.structural-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md); /* 12px = 1.5 baseline */
}

.structural-item {
  border-left: var(--space-xs) solid var(--dt-brand); /* 4px accent */
  border-radius: var(--radius-lg);
}

.structural-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm); /* 8px = 1 baseline */
}

.structural-path,
.structural-type {
  display: flex;
  align-items: center;
  gap: var(--space-sm); /* 8px = 1 baseline */
}

.structural-values {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs); /* 4px = 0.5 baseline */
}

.structural-values strong {
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-primary);
}

.structural-values code {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  border: 1px solid var(--dt-border);
  margin-top: var(--space-xs); /* 4px = 0.5 baseline */
}


/* ===== UNIFIED DIFF STYLING - DESIGN SYSTEM ALIGNED ===== */
.unified-diff-content {
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-relaxed); /* 20px = 2.5 baseline */
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
  border-radius: var(--radius-lg); /* 8px = 1 baseline */
  max-height: 480px; /* 60 baseline = 480px */
  overflow-y: auto;
  border: 1px solid var(--dt-border);
}

/* Unified diff hunk headers */
.diff-hunk-header {
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  padding: var(--space-sm) var(--space-lg); /* 8px 16px */
  border-top: 1px solid var(--dt-border);
  border-bottom: 1px solid var(--dt-border);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-xs); /* 12px */
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Unified diff lines */
.diff-line-added,
.diff-line-removed,
.diff-line-context {
  display: flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md); /* 4px 12px */
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-relaxed); /* 20px = 2.5 baseline */
  border-left: var(--space-xs) solid transparent; /* 4px indicator */
}

.diff-line-added {
  background: var(--dt-success-light);
  border-left-color: var(--dt-success);
}

.diff-line-removed {
  background: var(--dt-danger-light);
  border-left-color: var(--dt-danger);
}

.diff-line-context {
  background: transparent;
}

/* Unified diff markers */
.diff-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-lg); /* 16px = 2 baseline */
  height: var(--space-lg); /* 16px = 2 baseline */
  margin-right: var(--space-sm); /* 8px = 1 baseline */
  font-weight: var(--font-weight-bold);
  font-size: var(--text-xs); /* 12px */
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.diff-line-added .diff-marker {
  background: var(--dt-success);
  color: white;
}

.diff-line-removed .diff-marker {
  background: var(--dt-danger);
  color: white;
}

.diff-line-context .diff-marker {
  background: transparent;
  color: var(--dt-text-tertiary);
}

/* Unified diff content */
.diff-content {
  flex: 1;
  white-space: pre;
  word-break: break-all;
  font-family: var(--font-mono);
}

/* ===== SIDE-BY-SIDE DIFF STYLING - DESIGN SYSTEM ALIGNED ===== */
.side-by-side-content {
  width: 100%;
}

.diff-container-wrapper {
  background: var(--dt-surface-1);
  border-radius: var(--radius-lg); /* 8px = 1 baseline */
  border: 1px solid var(--dt-border);
  overflow: hidden;
}

.diff-side-by-side {
  display: flex;
  flex-direction: column;
}

/* Side-by-side header */
.side-by-side-content .diff-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--dt-surface-2);
  border-bottom: 1px solid var(--dt-border);
}

.side-by-side-content .diff-column-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm); /* 8px = 1 baseline */
  padding: var(--space-md) var(--space-lg); /* 12px 16px */
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm); /* 14px */
  color: var(--dt-text-primary);
  border-right: 1px solid var(--dt-border);
}

.side-by-side-content .diff-column-header:last-child {
  border-right: none;
}

.side-by-side-content .original-header {
  background: rgba(239, 68, 68, 0.05); /* Subtle red tint */
}

.side-by-side-content .changed-header {
  background: rgba(34, 197, 94, 0.05); /* Subtle green tint */
}

/* Side-by-side columns */
.side-by-side-content .diff-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-height: 480px; /* 60 baseline = 480px */
  overflow: auto;
}

.side-by-side-content .diff-column {
  overflow: hidden;
  background: var(--dt-surface-1);
  border-right: 1px solid var(--dt-border);
}

.side-by-side-content .diff-column:last-child {
  border-right: none;
}

.side-by-side-content .original-column {
  border-right: 1px solid var(--dt-border);
}

.side-by-side-content .changed-column {
  border-left: none;
}

.side-by-side-content .diff-column .diff-content {
  padding: var(--space-md); /* 12px = 1.5 baseline */
}

/* Side-by-side diff lines */
.side-by-side-content .diff-column .diff-line {
  display: flex;
  align-items: center;
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  margin: 1px 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-relaxed); /* 20px = 2.5 baseline */
  border-radius: var(--radius-sm);
  border-left: var(--space-xs) solid transparent; /* 4px indicator */
}

/* Side-by-side line states */
.side-by-side-content .diff-column .diff-line-added {
  background: var(--dt-success-light);
  border-left-color: var(--dt-success);
}

.side-by-side-content .diff-column .diff-line-removed {
  background: var(--dt-danger-light);
  border-left-color: var(--dt-danger);
}

.side-by-side-content .diff-column .diff-line-modified {
  background: var(--dt-warning-light);
  border-left-color: var(--dt-warning);
}

.side-by-side-content .diff-column .diff-line-empty {
  background: var(--dt-surface-2);
  opacity: 0.5;
}

/* Side-by-side line components */
.side-by-side-content .diff-column .line-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--space-2xl); /* 32px = 4 baseline */
  padding: 0 var(--space-xs); /* 4px horizontal */
  font-size: var(--text-xs); /* 12px */
  font-weight: var(--font-weight-medium);
  color: var(--dt-text-secondary);
  background: var(--dt-surface-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--dt-border);
  margin-right: var(--space-sm); /* 8px = 1 baseline */
  flex-shrink: 0;
}

.side-by-side-content .diff-column .line-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-lg); /* 16px = 2 baseline */
  height: var(--space-lg); /* 16px = 2 baseline */
  font-weight: var(--font-weight-bold);
  font-size: var(--text-xs); /* 12px */
  border-radius: var(--radius-sm);
  margin-right: var(--space-sm); /* 8px = 1 baseline */
  flex-shrink: 0;
}

.side-by-side-content .diff-line-added .line-marker {
  background: var(--dt-success);
  color: white;
}

.side-by-side-content .diff-line-removed .line-marker {
  background: var(--dt-danger);
  color: white;
}

.side-by-side-content .diff-line-modified .line-marker {
  background: var(--dt-warning);
  color: white;
}

.side-by-side-content .diff-line-empty .line-marker {
  background: transparent;
  color: var(--dt-text-tertiary);
}

.side-by-side-content .diff-column .line-content {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--text-sm); /* 14px */
  color: var(--dt-text-primary);
  white-space: pre;
  word-break: break-all;
}

/* No differences message */
.no-diff-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm); /* 8px = 1 baseline */
  padding: var(--space-2xl); /* 32px = 4 baseline */
  color: var(--dt-text-secondary);
  font-style: italic;
}

/* ===== DARK MODE ADJUSTMENTS ===== */
.app-dark .diff-line-added {
  background: rgba(16, 185, 129, 0.15);
}

.app-dark .diff-line-removed {
  background: rgba(239, 68, 68, 0.15);
}

.app-dark .diff-line-modified {
  background: rgba(245, 158, 11, 0.15);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .side-by-side-content .diff-columns {
    grid-template-columns: 1fr;
    max-height: 320px; /* 40 baseline = 320px */
  }

  .side-by-side-content .diff-header {
    grid-template-columns: 1fr;
  }

  .side-by-side-content .original-column,
  .side-by-side-content .changed-column {
    border: none;
    border-bottom: 1px solid var(--dt-border);
  }

  .side-by-side-content .changed-column {
    border-bottom: none;
  }

  .side-by-side-content .diff-column-header {
    border-right: none;
    border-bottom: 1px solid var(--dt-border);
  }

  .side-by-side-content .diff-column-header:last-child {
    border-bottom: none;
  }
}

/* ===== ANIMATION CLASSES ===== */
.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: var(--elevation-1);
  }
  to {
    box-shadow: var(--elevation-2), 0 0 20px rgba(59, 130, 246, 0.2);
  }
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

/* Enhanced compare button */
.compare-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.compare-btn::after {
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

.compare-btn:hover::after {
  width: 300px;
  height: 300px;
}

.compare-btn:hover {
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