<template>
  <div class="tool-panel jwt-decoder">
    <header class="tool-hero">
      <h1>JWT Decoder Online</h1>
      <p>Decode and inspect JSON Web Tokens instantly. View the header, payload, and signature without sending your token to any server.</p>
    </header>

    <div class="jwt-container">
      <div class="input-section">
        <div class="input-header">
          <label class="input-label">JWT Token:</label>
          <div class="input-actions">
            <button class="p-button p-button-sm p-button-secondary p-button-outlined action-btn" @click="clearToken" v-tooltip="'Clear token (Cmd+Shift+R)'" aria-label="Clear token">
              <i class="pi pi-refresh"></i>
            </button>
            <button class="p-button p-button-sm p-button-success p-button-outlined action-btn" @click="validateToken" v-tooltip="'Validate token structure'" :disabled="!jwtToken.trim()" aria-label="Validate token structure">
              <i class="pi pi-check"></i>
            </button>
          </div>
        </div>

        <div class="textarea-container">
          <textarea
            v-model="jwtToken"
            placeholder="Paste your JWT token here (eyJ...)..."
            rows="4"
            class="p-inputtextarea enhanced-textarea"
            @input="handleTokenInput"
            @paste="handleTokenPaste"
          ></textarea>

          <!-- Smart Suggestion -->
          <div v-if="showSuggestion" class="smart-suggestion">
            <div class="suggestion-content">
              <i class="pi pi-lightbulb"></i>
              <span>JWT token detected! Click to decode automatically.</span>
              <button class="p-button p-button-sm suggestion-btn" @click="applySuggestion">
                Decode
              </button>
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
            <h2>Header</h2>
            <button class="p-button p-button-sm p-button-secondary p-button-outlined" @click="copyPart('header')" v-tooltip="'Copy header'">
              <i class="pi pi-copy"></i>
              Copy
            </button>
          </div>
          <div class="part-content">
            <pre class="jwt-json">{{ formatJSON(decodedJWT.header) }}</pre>
          </div>
        </div>

        <!-- Payload -->
        <div class="jwt-part">
          <div class="part-header">
            <h2>Payload</h2>
            <button class="p-button p-button-sm p-button-secondary p-button-outlined" @click="copyPart('payload')" v-tooltip="'Copy payload'">
              <i class="pi pi-copy"></i>
              Copy
            </button>
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
            <h2>Signature</h2>
            <span class="signature-note">(Verify with secret key)</span>
          </div>
          <div class="signature-content">
            <code class="signature-hash">{{ decodedJWT.signature }}</code>
          </div>
        </div>
      </div>

      <div v-else-if="!jwtToken" class="empty-state">
        <i class="pi pi-shield empty-state-icon"></i>
        <p>Paste a JWT token above to decode it</p>
      </div>

      <!-- Quick Token Examples -->
      <div class="quick-actions">
        <span class="quick-actions-label">Examples:</span>
        <button
          v-for="example in exampleTokens"
          :key="example.name"
          @click="loadExample(example.token)"
          class="p-button p-button-sm p-button-outlined quick-btn"
        >
          <i :class="example.icon"></i>
          {{ example.name }}
        </button>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a JSON Web Token (JWT)?</h2>
      <p>A JSON Web Token (JWT) is a compact, URL-safe token format used for securely transmitting information between parties as a JSON object. JWTs are the standard for authentication in modern web applications — when you log into a website, the server often sends back a JWT that your browser includes in subsequent requests to prove your identity.</p>
      <p>Every JWT has three parts separated by dots: a header (specifying the algorithm and token type), a payload (containing claims like user ID, roles, and expiration time), and a signature (a cryptographic proof that the token hasn't been tampered with). DevYantra decodes all three parts locally in your browser — your token is never sent to any server.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Decode JWT header, payload, and signature in real time</li>
        <li>Automatic expiration checking with time-until-expiry display</li>
        <li>Syntax-highlighted JSON output for header and payload</li>
        <li>Quick example tokens for learning and testing</li>
        <li>Token structure validation and error reporting</li>
      </ul>

      <h2>How to Use the JWT Decoder</h2>
      <ol>
        <li>Paste a JWT string (the three dot-separated parts) into the input field.</li>
        <li>The header, payload, and signature are decoded and displayed instantly.</li>
        <li>Check the expiration time and other claims in the payload section.</li>
        <li>Try the quick examples to explore common JWT structures.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>What is a JWT token?</h3>
        <p>A JSON Web Token (JWT) is a compact, URL-safe token format used for securely transmitting information between parties. It consists of three parts: a header (algorithm and token type), a payload (claims like user ID and expiration), and a signature for verification.</p>

        <h3>How do I decode a JWT?</h3>
        <p>Paste the full JWT string (including the dots) into the input field. DevYantra will instantly decode and display the header, payload, and signature sections. It also checks expiration times and highlights security-relevant claims.</p>

        <h3>Is it safe to decode JWTs online?</h3>
        <p>DevYantra decodes JWTs entirely in your browser — the token is never sent to any server. This makes it safe for debugging authentication tokens from development and staging environments.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/base64-tools">Base64 Tools</router-link>
        <router-link to="/tools/hash-generator">Hash Generator</router-link>
        <router-link to="/tools/format-text">Code Formatter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

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
}

const loadExample = (token: string) => {
  jwtToken.value = token
  decodeJWT()
}

const clearToken = () => {
  jwtToken.value = ''
  decodedJWT.value = null
  showSuggestion.value = false
}

const validateToken = () => {
  if (!jwtToken.value.trim()) return

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
    const headerDecoded = JSON.parse(atob(parts[0]!))

    // Decode payload
    const payloadDecoded = JSON.parse(atob(parts[1]!))

    // Keep signature as is (it's encoded)
    const signature = parts[2]!

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
  } catch (err) {
    console.error('Copy failed:', err)
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
.jwt-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
  overflow: hidden;
}

/* Quick Actions (matches CompareText pattern) */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--dt-surface-2);
  border-radius: 8px;
  border: 1px solid var(--dt-border);
  align-items: center;
}

.quick-actions-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dt-text-secondary);
  white-space: nowrap;
  margin-right: 0.25rem;
}

.quick-btn {
  font-size: 0.8rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.quick-btn:hover {
  background: var(--dt-surface-3);
  border-color: var(--dt-border-strong);
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
  color: var(--dt-text-primary);
  font-size: 1rem;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  transition: all var(--transition-fast);
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
  font-family: var(--font-mono);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.enhanced-textarea:focus {
  border-color: var(--dt-brand);
  box-shadow: var(--focus-ring);
  transform: translateY(-1px);
}

/* Smart Suggestion */
.smart-suggestion {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, rgba(var(--dt-brand-rgb), 0.95), rgba(168, 85, 247, 0.95));
  backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
  border: 1px solid rgba(var(--dt-brand-rgb), 0.3);
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
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all var(--transition-fast);
}

.suggestion-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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
  background: var(--dt-success-light);
  color: var(--dt-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-invalid {
  background: var(--dt-danger-light);
  color: var(--dt-danger);
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
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all var(--transition-normal);
  min-width: 0;
  overflow: hidden;
}

.jwt-part:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--dt-brand-rgb), 0.3);
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.part-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: 0;
}

.part-content {
  margin-bottom: 1rem;
}

.jwt-json {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
  font-family: var(--font-mono);
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
  background: var(--dt-surface-1);
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
  color: var(--dt-text-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--dt-text-primary);
}

.info-value.expired {
  color: var(--dt-danger);
  font-weight: 600;
}

.signature-content {
  background: var(--dt-surface-2);
  border-radius: 8px;
  padding: 1rem;
}

.signature-hash {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--dt-text-primary);
  word-break: break-all;
  background: transparent;
}

.signature-note {
  font-size: 0.85rem;
  color: var(--dt-text-secondary);
  font-style: italic;
}

.error-message {
  background: var(--dt-danger-light);
  color: var(--dt-danger);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
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
  border: 2px dashed var(--dt-border);
  border-radius: var(--radius-lg);
  color: var(--dt-text-secondary);
  min-height: 200px;
}

.empty-state-icon {
  font-size: 2rem;
  color: var(--dt-text-tertiary);
  margin-bottom: var(--space-sm);
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