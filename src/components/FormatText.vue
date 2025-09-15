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
              class="type-indicator"
            />
          </div>
        </div>

        <Textarea
          v-model="inputText"
          placeholder="Paste your text here..."
          rows="10"
          class="text-area input-area"
          @input="onInputChange"
        />

        <div class="input-actions">
          <Button
            label="Format Text"
            icon="pi pi-refresh"
            @click="formatText"
            :loading="textProcessor.isLoading.value"
            :disabled="!inputText.trim()"
            class="format-btn"
          />
          <Button
            label="Clear"
            icon="pi pi-trash"
            severity="secondary"
            outlined
            @click="clearInput"
            :disabled="!inputText.trim()"
          />
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
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTextProcessor, type TextType } from '@/composables/useTextProcessor'

const toast = useToast()
const textProcessor = useTextProcessor()

// Text content
const inputText = ref('')
const formattedText = ref('')

// Detected type
const detectedType = ref<TextType>('text')

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
}
</style>