<template>
  <Card class="hash-generator">
    <template #title>
      <div class="card-header">
        <i class="pi pi-key text-2xl mr-2"></i>
        Hash Generator
      </div>
    </template>

    <template #subtitle>
      Generate SHA1, SHA256 hashes from your text input
    </template>

    <template #content>
      <div class="input-section">
        <label class="input-label">Input Text:</label>
        <Textarea
          v-model="inputText"
          placeholder="Enter text to hash..."
          rows="4"
          class="text-area"
          @input="generateHashes"
        />
      </div>

      <div v-if="inputText" class="hash-results">
        <div class="hash-item">
          <label class="hash-label">SHA1:</label>
          <div class="hash-output">
            <InputText
              :value="hashes.sha1"
              readonly
              class="hash-value"
            />
            <Button
              icon="pi pi-copy"
              @click="copyHash('sha1')"
              severity="secondary"
              outlined
              class="copy-btn"
              v-tooltip="'Copy SHA1 hash'"
            />
          </div>
        </div>

        <div class="hash-item">
          <label class="hash-label">SHA256:</label>
          <div class="hash-output">
            <InputText
              :value="hashes.sha256"
              readonly
              class="hash-value"
            />
            <Button
              icon="pi pi-copy"
              @click="copyHash('sha256')"
              severity="secondary"
              outlined
              class="copy-btn"
              v-tooltip="'Copy SHA256 hash'"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const inputText = ref('')

const hashes = reactive({
  sha1: '',
  sha256: ''
})

const generateHashes = async () => {
  if (!inputText.value) {
    hashes.sha1 = ''
    hashes.sha256 = ''
    return
  }

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(inputText.value)

    // Generate SHA256
    const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
    hashes.sha256 = Array.from(new Uint8Array(sha256Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Generate SHA1
    const sha1Buffer = await crypto.subtle.digest('SHA-1', data)
    hashes.sha1 = Array.from(new Uint8Array(sha1Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    console.error('Hash generation error:', error)
  }
}

const copyHash = async (type: string) => {
  try {
    await navigator.clipboard.writeText(hashes[type as keyof typeof hashes])
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: `${type.toUpperCase()} hash copied to clipboard`,
      life: 2000
    })
  } catch (err) {
    console.error('Copy failed:', err)
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.text-area {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
}

.hash-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hash-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hash-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.hash-output {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.hash-value {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.copy-btn {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .hash-output {
    flex-direction: column;
    align-items: stretch;
  }

  .copy-btn {
    align-self: flex-end;
  }
}
</style>