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
          <Textarea
            v-model="text1Content"
            placeholder="Paste your original text here..."
            rows="12"
            class="text-area"
            @input="onText1Input"
          />
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
          <Textarea
            v-model="text2Content"
            placeholder="Paste your changed text here..."
            rows="12"
            class="text-area"
            @input="onText2Input"
          />
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
import { ref, computed } from 'vue'
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


const clearAll = () => {
  text1Content.value = ''
  text2Content.value = ''
  text1Type.value = 'text'
  text2Type.value = 'text'
  showDiff.value = false

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
</style>