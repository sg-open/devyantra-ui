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
        <div class="input-header">
          <label class="input-label">JWT Token:</label>
          <div class="input-actions">
            <Button
              @click="clearToken"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              size="small"
              v-tooltip="'Clear token (Cmd+Shift+R)'"
              class="action-btn"
            />
            <Button
              @click="validateToken"
              icon="pi pi-check"
              severity="success"
              outlined
              size="small"
              v-tooltip="'Validate token structure'"
              class="action-btn"
              :disabled="!jwtToken.trim()"
            />
          </div>
        </div>

        <div class="textarea-container">
          <Textarea
            v-model="jwtToken"
            placeholder="Paste your JWT token here (eyJ...)..."
            rows="4"
            class="enhanced-textarea"
            @input="handleTokenInput"
            @paste="handleTokenPaste"
          />

          <!-- Smart Suggestion -->
          <div v-if="showSuggestion" class="smart-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>JWT token detected! Click to decode automatically.</span>
              <Button
                @click="applySuggestion"
                size="small"
                class="suggestion-btn"
              >
                Decode
              </Button>
            </div>
          </div>
        </div>

        <!-- Token Status -->
        <div v-if="jwtToken" class="token-status">
          <div v-if="decodedJWT" class="status-item status-valid">
            <i class="pi pi-check-circle"></i>
            <span>Valid JWT structure</span>
          </div>
          <div v-else class="status-item status-invalid">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Invalid JWT format</span>
          </div>
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

      <!-- Quick Token Examples - moved below main action -->
      <Divider />

      <div class="quick-examples-section">
        <h4 class="examples-title">
          <i class="pi pi-bolt"></i>
          Quick Examples
        </h4>
        <div class="examples-grid">
          <Button
            v-for="example in exampleTokens"
            :key="example.name"
            @click="loadExample(example.token)"
            :class="['example-btn', example.type]"
            size="small"
            outlined
          >
            <i :class="example.icon"></i>
            {{ example.name }}
          </Button>
        </div>
      </div>
    </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

interface ExampleToken {
  name: string
  type: string
  icon: string
  token: string
}

const toast = useToast()
const jwtToken = ref('')
const decodedJWT = ref<DecodedJWT | null>(null)
const showSuggestion = ref(false)
const suggestionToken = ref('')

// Example JWT tokens for testing
const exampleTokens = ref<ExampleToken[]>([
  {
    name: 'Valid Token',
    type: 'valid',
    icon: 'pi pi-check',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldllyISBEZXZlbG9wZXIiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6OTk5OTk5OTk5OX0.GjJ0D48L05bR-HNv3KT-W_6V3EWYQl3KQu0KJU2iFkI'
  },
  {
    name: 'Expired Token',
    type: 'expired',
    icon: 'pi pi-clock',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkV4cGlyZWQgVG9rZW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MDAwMH0.B2_XFUP_x7NqFQm0Z1J6Qo1G8XHJO_7-zw9Sk8-K4kY'
  },
  {
    name: 'Role Based',
    type: 'role',
    icon: 'pi pi-users',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.XL0fqGdKZ5c_OQ5Bx1a2Z8y9vK6W2s4d7mNz3Q9gRvY'
  }
])

const tokenInfo = computed((): TokenInfo | null => {
  if (!decodedJWT.value?.payload) return null

  const payload = decodedJWT.value.payload
  const now = Math.floor(Date.now() / 1000)

  return {
    issued: payload.iat ? new Date((payload.iat as number) * 1000).toLocaleString() : undefined,
    expires: payload.exp ? new Date((payload.exp as number) * 1000).toLocaleString() : undefined,
    isExpired: payload.exp ? (payload.exp as number) < now : false
  }
})

// Smart detection function
const detectJWTToken = (text: string): boolean => {
  // JWT should have 3 parts separated by dots
  const parts = text.split('.')
  if (parts.length !== 3) return false

  // Each part should be base64-like (but URL-safe)
  const base64Pattern = /^[A-Za-z0-9_-]+$/
  return parts.every(part => base64Pattern.test(part) && part.length > 0)
}

const handleTokenInput = () => {
  decodeJWT()
  showSuggestion.value = false
}

const handleTokenPaste = async (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || ''

  if (detectJWTToken(pastedText.trim())) {
    suggestionToken.value = pastedText.trim()
    showSuggestion.value = true

    // Hide suggestion after 5 seconds
    setTimeout(() => {
      showSuggestion.value = false
    }, 5000)
  }
}

const applySuggestion = () => {
  jwtToken.value = suggestionToken.value
  decodeJWT()
  showSuggestion.value = false

  toast.add({
    severity: 'success',
    summary: 'JWT Applied',
    detail: 'Token has been decoded successfully',
    life: 2000
  })
}

const loadExample = (token: string) => {
  jwtToken.value = token
  decodeJWT()

  toast.add({
    severity: 'info',
    summary: 'Example Loaded',
    detail: 'Example JWT token loaded and decoded',
    life: 2000
  })
}

const clearToken = () => {
  jwtToken.value = ''
  decodedJWT.value = null
  showSuggestion.value = false

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'JWT token cleared',
    life: 1500
  })
}

const validateToken = () => {
  if (!jwtToken.value.trim()) return

  const isValid = !!decodedJWT.value

  toast.add({
    severity: isValid ? 'success' : 'error',
    summary: isValid ? 'Valid JWT' : 'Invalid JWT',
    detail: isValid ? 'Token structure is valid' : 'Token format is invalid',
    life: 3000
  })
}

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

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    if (event.shiftKey) {
      switch (event.key) {
        case 'R':
        case 'r':
          event.preventDefault()
          clearToken()
          break
        case 'V':
        case 'v':
          event.preventDefault()
          validateToken()
          break
        case 'H':
        case 'h':
          if (decodedJWT.value) {
            event.preventDefault()
            copyPart('header')
          }
          break
        case 'P':
        case 'p':
          if (decodedJWT.value) {
            event.preventDefault()
            copyPart('payload')
          }
          break
        case 'S':
        case 's':
          if (decodedJWT.value) {
            event.preventDefault()
            copyPart('signature')
          }
          break
      }
    }
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
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

/* Quick Examples Section */
.quick-examples-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.quick-examples-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0.6;
}

.examples-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.examples-title i {
  color: #3b82f6;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.example-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
}

.example-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.example-btn:hover::before {
  left: 100%;
}

.example-btn.valid:hover {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: white !important;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.example-btn.expired:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.example-btn.role:hover {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Input Section */
.input-section {
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
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-1px);
}

/* Enhanced Textarea */
.textarea-container {
  position: relative;
}

.enhanced-textarea {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.enhanced-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

/* Smart Suggestion */
.smart-suggestion {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(168, 85, 247, 0.95));
  backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-top: none;
  z-index: 10;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: white;
}

.suggestion-content i {
  color: #fbbf24;
  font-size: 1.1rem;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  transition: all 0.2s ease;
}

.suggestion-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-1px);
}

/* Token Status */
.token-status {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
}

.status-valid {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-invalid {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-valid i,
.status-invalid i {
  font-size: 1rem;
}

/* JWT Parts Display */
.jwt-parts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.jwt-part {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.jwt-part:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
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

/* Animation keyframes */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .example-btn {
    font-size: 0.75rem;
    padding: 0.4rem 0.6rem;
  }

  .input-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

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

  .suggestion-content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
}
</style>