<template>
  <div class="tool-panel base64-tools">
    <header class="tool-hero">
      <h1>Base64 Encoder & Decoder</h1>
      <p>Encode text to Base64 or decode Base64 strings instantly. Supports standard and URL-safe Base64 — all processing stays in your browser.</p>
    </header>
    <div class="base64-container">
      <div class="input-section">
        <div class="section-header">
          <label class="input-label">Input</label>
          <div class="input-meta">
            <span v-if="inputText" class="char-count">{{ inputText.length }} chars / {{ inputByteLength }} bytes</span>
          </div>
        </div>
        <textarea
          v-model="inputText"
          placeholder="Enter text or Base64 to encode/decode..."
          rows="6"
          class="p-inputtextarea text-area"
        ></textarea>
        <div class="action-buttons">
          <button class="p-button p-button-sm encode-btn" @click="encode">
            <i class="pi pi-arrow-right"></i>
            Encode
          </button>
          <button class="p-button p-button-sm p-button-secondary p-button-outlined" @click="decode">
            <i class="pi pi-arrow-left"></i>
            Decode
          </button>
          <div class="toggle-group">
            <button :class="['toggle-btn', { active: !urlSafe }]" @click="urlSafe = false">Standard</button>
            <button :class="['toggle-btn', { active: urlSafe }]" @click="urlSafe = true">URL-safe</button>
          </div>
        </div>
      </div>

      <div class="output-section">
        <div class="section-header">
          <label class="input-label">Output</label>
          <div v-if="outputText" class="output-actions">
            <span class="char-count">{{ outputText.length }} chars</span>
            <button class="p-button p-button-sm p-button-secondary p-button-text" @click="useAsInput" v-tooltip="'Use as input'" aria-label="Use output as input">
              <i class="pi pi-replay"></i>
            </button>
            <button class="p-button p-button-sm p-button-secondary p-button-text" @click="copyOutput" v-tooltip="'Copy'" aria-label="Copy output">
              <i class="pi pi-copy"></i>
            </button>
          </div>
        </div>
        <div v-if="outputText" class="output-container">
          <textarea
            :value="outputText"
            readonly
            rows="6"
            class="p-inputtextarea output-text"
          ></textarea>
        </div>
        <div v-if="errorMessage" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ errorMessage }}</span>
        </div>
        <div v-if="!outputText && !errorMessage" class="empty-state">
          <i class="pi pi-code"></i>
          <p>Output will appear here</p>
        </div>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is Base64 Encoding?</h2>
      <p>Base64 is a binary-to-text encoding scheme that converts binary data into a string of ASCII characters. It uses 64 characters (A-Z, a-z, 0-9, +, /) to represent data, making it safe to transmit binary content through text-only channels like email, JSON APIs, and HTML. The encoded output is roughly 33% larger than the original data.</p>
      <p>Common uses include embedding images in HTML/CSS as data URIs, encoding email attachments in MIME format, transmitting binary data in JSON or XML payloads, and storing small binary objects in text-based databases. DevYantra supports both standard Base64 (RFC 4648) and URL-safe Base64 variants.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Encode text to Base64 or decode Base64 to text in real time</li>
        <li>Support for standard Base64 and URL-safe Base64 variants</li>
        <li>Handles Unicode text and multi-byte characters correctly</li>
        <li>Live character and byte count for input and output</li>
        <li>One-click copy and clear buttons</li>
      </ul>

      <h2>How to Use Base64 Tools</h2>
      <ol>
        <li>Paste your plain text or Base64-encoded string into the input field.</li>
        <li>Click "Encode" to convert text to Base64, or "Decode" to convert Base64 back to text.</li>
        <li>The result appears instantly in the output panel.</li>
        <li>Use the copy button to copy the result to your clipboard.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>What is Base64 encoding?</h3>
        <p>Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string. It is commonly used to embed images in HTML/CSS, transmit binary data in JSON APIs, encode email attachments, and store binary data in text-based formats.</p>

        <h3>How do I decode Base64?</h3>
        <p>Paste your Base64-encoded string into the input field and DevYantra will instantly decode it to readable text. The tool handles standard Base64 and URL-safe Base64 variants automatically.</p>

        <h3>When should I use Base64 encoding?</h3>
        <p>Use Base64 when you need to include binary data in text-only contexts, such as embedding images in data URIs, sending attachments via email (MIME), transmitting data in JSON or XML, or storing binary blobs in databases that only support text.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/hash-generator">Hash Generator</router-link>
        <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
        <router-link to="/tools/format-text">Code Formatter</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const urlSafe = ref(false)

const inputByteLength = computed(() => new TextEncoder().encode(inputText.value).length)

const encode = () => {
  errorMessage.value = ''
  if (!inputText.value.trim()) return

  try {
    // Use TextEncoder for proper UTF-8 support
    const bytes = new TextEncoder().encode(inputText.value)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    let result = btoa(binary)

    if (urlSafe.value) {
      result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }

    outputText.value = result
  } catch {
    outputText.value = ''
    errorMessage.value = 'Failed to encode text'
  }
}

const decode = () => {
  errorMessage.value = ''
  if (!inputText.value.trim()) return

  try {
    // Handle URL-safe Base64
    let input = inputText.value.trim()
    if (urlSafe.value || input.includes('-') || input.includes('_')) {
      input = input.replace(/-/g, '+').replace(/_/g, '/')
      // Add padding if needed
      while (input.length % 4) input += '='
    }

    const binary = atob(input)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    outputText.value = new TextDecoder().decode(bytes)
  } catch {
    outputText.value = ''
    errorMessage.value = 'Invalid Base64 string'
  }
}

const useAsInput = () => {
  inputText.value = outputText.value
  outputText.value = ''
  errorMessage.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}
</script>

<style scoped>
.base64-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.input-section,
.output-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--dt-text-primary);
}

.input-meta,
.output-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.char-count {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  font-family: var(--font-mono);
}

.text-area,
.output-text {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.action-buttons {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.toggle-group {
  display: flex;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-left: auto;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 26px;
  font-size: var(--text-xs);
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
}

.toggle-btn.active {
  background: var(--dt-brand-light);
  color: var(--dt-brand);
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--dt-border);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--dt-danger-light);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  color: var(--dt-danger);
  font-size: var(--text-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  color: var(--dt-text-secondary);
  border: 1px dashed var(--dt-border);
  border-radius: var(--radius-lg);
  min-height: 200px;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .base64-container {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
