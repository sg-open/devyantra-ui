<template>
  <Card class="base64-tools">
    <template #title>
      <div class="card-header">
        <i class="pi pi-code text-2xl mr-2"></i>
        Base64 Encoder/Decoder
      </div>
    </template>

    <template #subtitle>
      Encode and decode Base64 strings
    </template>

    <template #content>
      <div class="base64-container">
        <div class="input-section">
          <label class="input-label">Input:</label>
          <Textarea
            v-model="inputText"
            placeholder="Enter text or Base64 to encode/decode..."
            rows="6"
            class="text-area"
          />

          <div class="action-buttons">
            <Button
              @click="encode"
              icon="pi pi-arrow-up"
              label="Encode to Base64"
              class="encode-btn"
            />
            <Button
              @click="decode"
              icon="pi pi-arrow-down"
              label="Decode from Base64"
              severity="secondary"
              outlined
              class="decode-btn"
            />
          </div>
        </div>

        <div class="output-section">
          <label class="input-label">Output:</label>
          <div v-if="outputText" class="output-container">
            <Textarea
              :value="outputText"
              readonly
              rows="6"
              class="output-text"
            />
            <Button
              @click="copyOutput"
              icon="pi pi-copy"
              label="Copy"
              severity="secondary"
              outlined
              class="copy-btn"
              v-tooltip="'Copy to clipboard'"
            />
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-code text-4xl text-surface-400 mb-2"></i>
            <p class="text-surface-500">Output will appear here</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const inputText = ref('')
const outputText = ref('')

const encode = () => {
  if (!inputText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please enter text to encode',
      life: 3000
    })
    return
  }

  try {
    outputText.value = btoa(inputText.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Text encoded to Base64',
      life: 2000
    })
  } catch (error) {
    console.error('Encoding error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to encode text',
      life: 3000
    })
  }
}

const decode = () => {
  if (!inputText.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please enter Base64 to decode',
      life: 3000
    })
    return
  }

  try {
    outputText.value = atob(inputText.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Base64 decoded to text',
      life: 2000
    })
  } catch (error) {
    console.error('Decoding error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Invalid Base64 string',
      life: 3000
    })
  }
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Output copied to clipboard',
      life: 2000
    })
  } catch (err) {
    console.error('Copy failed:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.base64-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.input-section,
.output-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: var(--text-color);
}

.text-area {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed var(--surface-border);
  border-radius: var(--border-radius);
  text-align: center;
  min-height: 200px;
}

@media (max-width: 768px) {
  .base64-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: row;
  }
}
</style>