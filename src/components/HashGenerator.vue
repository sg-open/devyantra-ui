<template>
  <div class="tool-panel hash-generator">
    <header class="tool-hero">
      <h1>Hash Generator</h1>
      <p>Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text. All hashing is done locally in your browser using the Web Crypto API.</p>
    </header>
    <div class="input-section">
      <div class="input-header">
        <label class="input-label">Input Text</label>
        <div class="input-meta">
          <span v-if="inputText" class="byte-count">{{ byteLength }} bytes</span>
        </div>
      </div>
      <textarea
        v-model="inputText"
        placeholder="Enter or paste text to hash..."
        rows="4"
        class="p-inputtextarea text-area"
        @input="generateHashes"
      ></textarea>
    </div>

    <div class="hash-controls">
      <div class="control-row">
        <label class="control-label">Case:</label>
        <div class="toggle-group">
          <button :class="['toggle-btn', { active: !uppercase }]" @click="uppercase = false; generateHashes()">lowercase</button>
          <button :class="['toggle-btn', { active: uppercase }]" @click="uppercase = true; generateHashes()">UPPERCASE</button>
        </div>
      </div>
    </div>

    <div v-if="inputText" class="hash-results">
      <div class="results-header">
        <span class="results-title">Hashes</span>
      </div>

      <div v-for="algo in algorithms" :key="algo.key" class="hash-item">
        <div class="hash-label-row">
          <label class="hash-label">{{ algo.label }}</label>
          <button class="p-button p-button-sm p-button-secondary p-button-text" @click="copyHash(algo.key)" v-tooltip="'Copy'" :aria-label="`Copy ${algo.label} hash`">
            <i class="pi pi-copy"></i>
          </button>
        </div>
        <code class="hash-value">{{ hashes[algo.key] || 'Computing...' }}</code>
      </div>

      <ToolActions
        :copy-text="allHashesText"
        copy-label="All hashes"
        @clear="clearInput"
      />
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-key"></i>
      <p>Enter text above to generate hashes</p>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is Cryptographic Hashing?</h2>
      <p>A cryptographic hash function takes any input — a password, a file, or a block of text — and produces a fixed-length string of characters called a "hash" or "digest." The same input always produces the same hash, but even a tiny change in the input produces a completely different output. This makes hashes ideal for verifying data integrity, storing passwords securely, and creating digital signatures.</p>
      <p>DevYantra generates hashes using the Web Crypto API built into your browser. Your data never leaves your device — there are no network requests, no server-side processing, and no logging. This makes it safe to hash sensitive data like passwords and API keys.</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes simultaneously</li>
        <li>Real-time hashing — results update as you type</li>
        <li>Toggle between uppercase and lowercase hex output</li>
        <li>One-click copy for any hash result</li>
        <li>100% client-side processing using the Web Crypto API</li>
      </ul>

      <h2>How to Use the Hash Generator</h2>
      <ol>
        <li>Type or paste the text you want to hash into the input field.</li>
        <li>All supported hash algorithms produce output simultaneously.</li>
        <li>Click the copy icon next to any hash to copy it to your clipboard.</li>
        <li>Toggle the case switch to switch between uppercase and lowercase output.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>What is SHA-256?</h3>
        <p>SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic hash function that produces a fixed 256-bit (32-byte) output for any input. It is widely used for data integrity verification, digital signatures, and blockchain technology. SHA-256 is considered secure and collision-resistant.</p>

        <h3>How do I generate an MD5 hash?</h3>
        <p>Type or paste your text in the input field and DevYantra instantly generates the MD5 hash along with SHA-1, SHA-256, and SHA-512 hashes. All processing happens in your browser — your data never leaves your device.</p>

        <h3>Is it safe to generate hashes online?</h3>
        <p>DevYantra processes all hashes locally in your browser using the Web Crypto API. Your data is never sent to any server, making it safe for sensitive information like passwords and API keys.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/base64-tools">Base64 Tools</router-link>
        <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
        <router-link to="/tools/text-compare">Text Compare</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useToolState } from '@/composables/useToolState'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

const clipboard = useClipboard()
const toast = useToast()

const inputText = ref('')
const uppercase = ref(false)

// Per-tool persistence (D2) — input text plus the case-selection toggle;
// the computed hashes are derived output and are recomputed below rather
// than persisted.
const toolState = useToolState('hash-generator', { input: inputText, uppercase })

const algorithms = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'sha384', label: 'SHA-384' },
  { key: 'sha512', label: 'SHA-512' },
] as const

type AlgoKey = (typeof algorithms)[number]['key']

const hashes = reactive<Record<AlgoKey, string>>({
  md5: '',
  sha1: '',
  sha256: '',
  sha384: '',
  sha512: '',
})

const byteLength = computed(() => new TextEncoder().encode(inputText.value).length)

// Lightweight MD5 implementation
function md5(input: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff)
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  const bytes = new TextEncoder().encode(input)
  const len = bytes.length
  const words: number[] = []
  for (let i = 0; i < len; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | (bytes[i]! << ((i % 4) << 3))
  }
  words[len >> 2] = (words[len >> 2] ?? 0) | (0x80 << ((len % 4) << 3))
  const bitLen = len * 8
  const needed = (((len + 8) >> 6) + 1) * 16
  while (words.length < needed) words.push(0)
  words[needed - 2] = bitLen & 0xffffffff
  words[needed - 1] = 0

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
  const w = (idx: number) => words[idx]!
  for (let i = 0; i < needed; i += 16) {
    const oa = a, ob = b, oc = c, od = d
    a = md5ff(a, b, c, d, w(i), 7, -680876936); d = md5ff(d, a, b, c, w(i+1), 12, -389564586)
    c = md5ff(c, d, a, b, w(i+2), 17, 606105819); b = md5ff(b, c, d, a, w(i+3), 22, -1044525330)
    a = md5ff(a, b, c, d, w(i+4), 7, -176418897); d = md5ff(d, a, b, c, w(i+5), 12, 1200080426)
    c = md5ff(c, d, a, b, w(i+6), 17, -1473231341); b = md5ff(b, c, d, a, w(i+7), 22, -45705983)
    a = md5ff(a, b, c, d, w(i+8), 7, 1770035416); d = md5ff(d, a, b, c, w(i+9), 12, -1958414417)
    c = md5ff(c, d, a, b, w(i+10), 17, -42063); b = md5ff(b, c, d, a, w(i+11), 22, -1990404162)
    a = md5ff(a, b, c, d, w(i+12), 7, 1804603682); d = md5ff(d, a, b, c, w(i+13), 12, -40341101)
    c = md5ff(c, d, a, b, w(i+14), 17, -1502002290); b = md5ff(b, c, d, a, w(i+15), 22, 1236535329)
    a = md5gg(a, b, c, d, w(i+1), 5, -165796510); d = md5gg(d, a, b, c, w(i+6), 9, -1069501632)
    c = md5gg(c, d, a, b, w(i+11), 14, 643717713); b = md5gg(b, c, d, a, w(i), 20, -373897302)
    a = md5gg(a, b, c, d, w(i+5), 5, -701558691); d = md5gg(d, a, b, c, w(i+10), 9, 38016083)
    c = md5gg(c, d, a, b, w(i+15), 14, -660478335); b = md5gg(b, c, d, a, w(i+4), 20, -405537848)
    a = md5gg(a, b, c, d, w(i+9), 5, 568446438); d = md5gg(d, a, b, c, w(i+14), 9, -1019803690)
    c = md5gg(c, d, a, b, w(i+3), 14, -187363961); b = md5gg(b, c, d, a, w(i+8), 20, 1163531501)
    a = md5gg(a, b, c, d, w(i+13), 5, -1444681467); d = md5gg(d, a, b, c, w(i+2), 9, -51403784)
    c = md5gg(c, d, a, b, w(i+7), 14, 1735328473); b = md5gg(b, c, d, a, w(i+12), 20, -1926607734)
    a = md5hh(a, b, c, d, w(i+5), 4, -378558); d = md5hh(d, a, b, c, w(i+8), 11, -2022574463)
    c = md5hh(c, d, a, b, w(i+11), 16, 1839030562); b = md5hh(b, c, d, a, w(i+14), 23, -35309556)
    a = md5hh(a, b, c, d, w(i+1), 4, -1530992060); d = md5hh(d, a, b, c, w(i+4), 11, 1272893353)
    c = md5hh(c, d, a, b, w(i+7), 16, -155497632); b = md5hh(b, c, d, a, w(i+10), 23, -1094730640)
    a = md5hh(a, b, c, d, w(i+13), 4, 681279174); d = md5hh(d, a, b, c, w(i), 11, -358537222)
    c = md5hh(c, d, a, b, w(i+3), 16, -722521979); b = md5hh(b, c, d, a, w(i+6), 23, 76029189)
    a = md5hh(a, b, c, d, w(i+9), 4, -640364487); d = md5hh(d, a, b, c, w(i+12), 11, -421815835)
    c = md5hh(c, d, a, b, w(i+15), 16, 530742520); b = md5hh(b, c, d, a, w(i+2), 23, -995338651)
    a = md5ii(a, b, c, d, w(i), 6, -198630844); d = md5ii(d, a, b, c, w(i+7), 10, 1126891415)
    c = md5ii(c, d, a, b, w(i+14), 15, -1416354905); b = md5ii(b, c, d, a, w(i+5), 21, -57434055)
    a = md5ii(a, b, c, d, w(i+12), 6, 1700485571); d = md5ii(d, a, b, c, w(i+3), 10, -1894986606)
    c = md5ii(c, d, a, b, w(i+10), 15, -1051523); b = md5ii(b, c, d, a, w(i+1), 21, -2054922799)
    a = md5ii(a, b, c, d, w(i+8), 6, 1873313359); d = md5ii(d, a, b, c, w(i+15), 10, -30611744)
    c = md5ii(c, d, a, b, w(i+6), 15, -1560198380); b = md5ii(b, c, d, a, w(i+13), 21, 1309151649)
    a = md5ii(a, b, c, d, w(i+4), 6, -145523070); d = md5ii(d, a, b, c, w(i+11), 10, -1120210379)
    c = md5ii(c, d, a, b, w(i+2), 15, 718787259); b = md5ii(b, c, d, a, w(i+9), 21, -343485551)
    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od)
  }

  function toHex(n: number) {
    let s = ''
    for (let i = 0; i < 4; i++) s += ((n >> (i * 8 + 4)) & 0xf).toString(16) + ((n >> (i * 8)) & 0xf).toString(16)
    return s
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

const formatHash = (hex: string) => uppercase.value ? hex.toUpperCase() : hex

const generateHashes = async () => {
  if (!inputText.value) {
    Object.keys(hashes).forEach(k => { hashes[k as AlgoKey] = '' })
    return
  }

  try {
    const data = new TextEncoder().encode(inputText.value)

    // MD5 (inline)
    hashes.md5 = formatHash(md5(inputText.value))

    // Web Crypto hashes
    const algoMap: Record<string, string> = {
      sha1: 'SHA-1',
      sha256: 'SHA-256',
      sha384: 'SHA-384',
      sha512: 'SHA-512',
    }

    for (const [key, algo] of Object.entries(algoMap)) {
      const buf = await crypto.subtle.digest(algo, data)
      hashes[key as AlgoKey] = formatHash(
        Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      )
    }
  } catch (error) {
    console.error('Hash generation error:', error)
  }
}

// A restored input has no hashes yet (they are derived, never persisted) —
// compute them once so results are visible without an extra keystroke.
if (toolState.restored) generateHashes()

const allHashesText = computed(() =>
  algorithms
    .filter(a => hashes[a.key])
    .map(a => `${a.label}: ${hashes[a.key]}`)
    .join('\n')
)

const clearInput = () => {
  const previousInput = inputText.value
  inputText.value = ''
  Object.keys(hashes).forEach(k => { hashes[k as AlgoKey] = '' })

  if (previousInput) {
    toast.add({
      severity: 'info',
      summary: 'Input cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          inputText.value = previousInput
          generateHashes()
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared text.
  toolState.flushSave()
}

const copyHash = async (type: AlgoKey) => {
  if (!hashes[type]) return
  const label = algorithms.find(a => a.key === type)?.label ?? 'Hash'
  await clipboard.copyWithFeedback(hashes[type], label)
}
</script>

<style scoped>
.input-section {
  margin-bottom: var(--space-lg);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--dt-text-primary);
}

.input-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.byte-count {
  font-size: var(--text-xs);
  color: var(--dt-text-secondary);
  font-family: var(--font-mono);
}

.text-area {
  width: 100%;
  font-family: var(--font-mono);
}

.hash-controls {
  margin-bottom: var(--space-lg);
}

.control-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.control-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--dt-text-secondary);
}

.toggle-group {
  display: flex;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 26px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--dt-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: var(--dt-brand-light);
  color: var(--dt-brand);
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--dt-border);
}

.hash-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--dt-text-primary);
}

.hash-item {
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.hash-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.hash-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--dt-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hash-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--dt-text-primary);
  word-break: break-all;
  line-height: 1.5;
  background: transparent;
  padding: 0;
  border-radius: 0;
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
  .hash-value {
    font-size: 11px;
  }
}
</style>
