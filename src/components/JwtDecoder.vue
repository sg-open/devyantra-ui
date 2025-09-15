<template>
  <Card class="jwt-decoder">
    <template #title>
      <div class="card-header">
        <i class="pi pi-shield text-2xl mr-2"></i>
        JWT Decoder
      </div>
    </template>

    <template #subtitle>
      Decode and analyze JSON Web Tokens with header, payload, and signature inspection
    </template>

    <template #content>

    <div class="jwt-container">
      <div class="input-section">
        <label class="input-label">JWT Token:</label>
        <Textarea
          v-model="jwtToken"
          placeholder="Paste your JWT token here (eyJ...)..."
          rows="4"
          class="text-area"
          @input="decodeJWT"
        />

        <div v-if="jwtToken && !decodedJWT" class="error-message">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Invalid JWT format
        </div>
      </div>

      <div v-if="decodedJWT" class="jwt-parts">
        <!-- Header -->
        <div class="jwt-part">
          <div class="part-header">
            <h3>Header</h3>
            <Button
              @click="copyPart('header')"
              icon="pi pi-copy"
              label="Copy"
              severity="secondary"
              outlined
              size="small"
              v-tooltip="'Copy header'"
            />
          </div>
          <div class="part-content">
            <pre class="jwt-json">{{ formatJSON(decodedJWT.header) }}</pre>
          </div>
        </div>

        <!-- Payload -->
        <div class="jwt-part">
          <div class="part-header">
            <h3>Payload</h3>
            <Button
              @click="copyPart('payload')"
              icon="pi pi-copy"
              label="Copy"
              severity="secondary"
              outlined
              size="small"
              v-tooltip="'Copy payload'"
            />
          </div>
          <div class="part-content">
            <pre class="jwt-json">{{ formatJSON(decodedJWT.payload) }}</pre>
          </div>

          <!-- Token Info -->
          <div v-if="tokenInfo" class="token-info">
            <div class="info-item">
              <span class="info-label">Issued:</span>
              <span class="info-value">{{ tokenInfo.issued || 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Expires:</span>
              <span class="info-value" :class="{ expired: tokenInfo.isExpired }">
                {{ tokenInfo.expires || 'Not specified' }}
              </span>
            </div>
            <div v-if="tokenInfo.isExpired" class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value expired">⚠️ Token Expired</span>
            </div>
          </div>
        </div>

        <!-- Signature -->
        <div class="jwt-part">
          <div class="part-header">
            <h3>Signature</h3>
            <span class="signature-note">(Verify with secret key)</span>
          </div>
          <div class="signature-content">
            <code class="signature-hash">{{ decodedJWT.signature }}</code>
          </div>
        </div>
      </div>

      <div v-else-if="!jwtToken" class="empty-state">
        <i class="pi pi-shield text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-500">Paste a JWT token above to decode it</p>
      </div>
    </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

interface DecodedJWT {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

interface TokenInfo {
  issued?: string
  expires?: string
  isExpired: boolean
}

const toast = useToast()
const jwtToken = ref('')
const decodedJWT = ref<DecodedJWT | null>(null)

const tokenInfo = computed((): TokenInfo | null => {
  if (!decodedJWT.value?.payload) return null

  const payload = decodedJWT.value.payload
  const now = Math.floor(Date.now() / 1000)

  return {
    issued: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : undefined,
    expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : undefined,
    isExpired: payload.exp ? payload.exp < now : false
  }
})

const decodeJWT = () => {
  if (!jwtToken.value.trim()) {
    decodedJWT.value = null
    return
  }

  try {
    const parts = jwtToken.value.split('.')

    if (parts.length !== 3) {
      decodedJWT.value = null
      return
    }

    // Decode header
    const headerDecoded = JSON.parse(atob(parts[0]))

    // Decode payload
    const payloadDecoded = JSON.parse(atob(parts[1]))

    // Keep signature as is (it's encoded)
    const signature = parts[2]

    decodedJWT.value = {
      header: headerDecoded,
      payload: payloadDecoded,
      signature: signature
    }
  } catch {
    decodedJWT.value = null
  }
}

const formatJSON = (obj: Record<string, unknown>): string => {
  return JSON.stringify(obj, null, 2)
}

const copyPart = async (part: 'header' | 'payload' | 'signature') => {
  if (!decodedJWT.value) return

  let textToCopy = ''

  switch (part) {
    case 'header':
      textToCopy = formatJSON(decodedJWT.value.header)
      break
    case 'payload':
      textToCopy = formatJSON(decodedJWT.value.payload)
      break
    case 'signature':
      textToCopy = decodedJWT.value.signature
      break
  }

  try {
    await navigator.clipboard.writeText(textToCopy)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: `JWT ${part} copied to clipboard`,
      life: 2000
    })
  } catch (err) {
    console.error('Copy failed:', err)
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
.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.jwt-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.text-area {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.jwt-parts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.jwt-part {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.part-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.part-content {
  margin-bottom: 1rem;
}

.jwt-json {
  background: var(--surface-ground);
  color: var(--text-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  padding: 1rem;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  margin-top: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--text-color);
}

.info-value.expired {
  color: var(--red-500);
  font-weight: 600;
}

.signature-content {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
}

.signature-hash {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: var(--text-color);
  word-break: break-all;
  background: transparent;
}

.signature-note {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.error-message {
  background: var(--red-50);
  color: var(--red-600);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--red-200);
  margin-top: 1rem;
  display: flex;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  border: 2px dashed var(--surface-border);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
  min-height: 200px;
}

@media (max-width: 768px) {
  .part-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .jwt-json {
    font-size: 0.8rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>