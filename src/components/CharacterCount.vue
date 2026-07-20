<template>
  <div class="tool-panel character-count">
    <header class="tool-hero">
      <h1>Character & Word Counter</h1>
      <p>Count characters, words, sentences, and paragraphs in any text. Get reading time estimates and check against platform character limits.</p>
    </header>

    <div class="counter-container">
      <!-- Input Section -->
      <div class="input-section">
        <label class="input-label">Enter your text:</label>
        <textarea
          v-model="inputText"
          placeholder="Type or paste your text here to analyze..."
          rows="12"
          class="p-inputtextarea text-area"
          @input="analyzeText"
        ></textarea>

        <ToolActions :copy-text="statsText" copy-label="Stats" @clear="clearText" />
      </div>

      <!-- Statistics Section -->
      <div class="stats-section">
        <div class="stats-grid">
          <!-- Basic Stats -->
          <div class="stat-card primary">
            <div class="stat-icon">
              <i class="pi pi-font"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.characters }}</div>
              <div class="stat-label">Characters</div>
            </div>
          </div>

          <div class="stat-card secondary">
            <div class="stat-icon">
              <i class="pi pi-align-left"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.charactersNoSpaces }}</div>
              <div class="stat-label">Characters (no spaces)</div>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <i class="pi pi-book"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.words }}</div>
              <div class="stat-label">Words</div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <i class="pi pi-list"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.lines }}</div>
              <div class="stat-label">Lines</div>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="pi pi-file"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.paragraphs }}</div>
              <div class="stat-label">Paragraphs</div>
            </div>
          </div>

          <div class="stat-card danger">
            <div class="stat-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.readingTime }}</div>
              <div class="stat-label">Reading Time (min)</div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <i class="pi pi-microphone"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.speakingTime }}</div>
              <div class="stat-label">Speaking Time (min)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Analysis - Full Width Below Both Sections -->
    <div v-if="inputText.trim()" class="detailed-analysis">
      <h2 class="analysis-title">
        <i class="pi pi-chart-bar mr-2"></i>
        Detailed Analysis
      </h2>

      <div class="analysis-grid">
        <div class="analysis-item">
          <span class="analysis-label">Sentences:</span>
          <span class="analysis-value">{{ stats.sentences }}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Average words per sentence:</span>
          <span class="analysis-value">{{ stats.avgWordsPerSentence }}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Average characters per word:</span>
          <span class="analysis-value">{{ stats.avgCharsPerWord }}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Longest word:</span>
          <span class="analysis-value">{{ stats.longestWord }}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Most frequent word:</span>
          <span class="analysis-value">{{ stats.mostFrequentWord }}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Unique words:</span>
          <span class="analysis-value">{{ stats.uniqueWords }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State for Detailed Analysis -->
    <div v-else class="detailed-analysis-empty">
      <div class="empty-state">
        <i class="pi pi-chart-bar empty-state-icon"></i>
        <p>Enter text above to see detailed analysis</p>
      </div>
    </div>

    <!-- SEO Content Section -->
    <section class="tool-info" aria-label="About this tool">
      <h2>What is a Character Counter?</h2>
      <p>A character counter is a tool that analyzes text and reports its length in multiple units — characters (with and without spaces), words, sentences, lines, and paragraphs. Writers, marketers, and developers use character counters to meet length requirements for social media posts, meta descriptions, SMS messages, academic papers, and API field limits.</p>
      <p>DevYantra's Character Counter goes beyond simple counting. It estimates reading and speaking time, calculates text density metrics like average word length, identifies the longest word, counts unique words, and checks your text against common platform limits like Twitter/X (280 characters), SMS (160 characters), and Google meta descriptions (160 characters).</p>

      <h2>Key Features</h2>
      <ul class="feature-list">
        <li>Real-time character, word, sentence, line, and paragraph counting</li>
        <li>Reading time and speaking time estimates</li>
        <li>Platform limit checks (Twitter, SMS, meta descriptions, and more)</li>
        <li>Text density analytics: average word length, longest word, unique words</li>
        <li>Characters with spaces and characters without spaces counts</li>
      </ul>

      <h2>How to Use the Character Counter</h2>
      <ol>
        <li>Paste or type your text into the input area.</li>
        <li>Character, word, line, and paragraph counts update instantly.</li>
        <li>Check the stats cards for reading time, speaking time, and more.</li>
        <li>Expand "Detailed Analysis" for word frequency and text density metrics.</li>
      </ol>

      <h2>Frequently Asked Questions</h2>
      <div class="faq-section">
        <h3>How do I count characters in text?</h3>
        <p>Paste or type your text into the input area and DevYantra instantly displays the character count, word count, line count, and paragraph count. It also shows reading time estimates and checks against common platform character limits.</p>

        <h3>What is a word counter?</h3>
        <p>A word counter is a tool that counts the number of words in a piece of text. It typically also provides character counts, sentence counts, and reading time estimates. Writers use word counters for meeting article length requirements, social media post limits, and academic paper constraints.</p>

        <h3>Does it count characters with or without spaces?</h3>
        <p>DevYantra shows both: total characters (with spaces) and characters without spaces. This is useful for platforms like Twitter/X that count all characters, and services that only count non-space characters.</p>
      </div>

      <h2>Related Tools</h2>
      <nav class="related-tools" aria-label="Related developer tools">
        <router-link to="/tools/timestamp-converter">Timestamp Converter</router-link>
        <router-link to="/tools/text-compare">Text Compare</router-link>
        <router-link to="/tools/delimiter">Delimiter Tool</router-link>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useToolState } from '@/composables/useToolState'
import { useToast } from '@/composables/useToast'
import ToolActions from '@/components/tool/ToolActions.vue'

interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  readingTime: number
  speakingTime: number
  avgWordsPerSentence: number
  avgCharsPerWord: number
  longestWord: string
  mostFrequentWord: string
  uniqueWords: number
}


const toast = useToast()

const inputText = ref('')

// Per-tool persistence (D2) — only the input round-trips; `stats` is fully
// derived output, recomputed below rather than persisted.
const toolState = useToolState('character-count', { input: inputText })

const stats = reactive<TextStats>({
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  lines: 0,
  paragraphs: 0,
  sentences: 0,
  readingTime: 0,
  speakingTime: 0,
  avgWordsPerSentence: 0,
  avgCharsPerWord: 0,
  longestWord: '',
  mostFrequentWord: '',
  uniqueWords: 0
})

const analyzeText = () => {
  const text = inputText.value

  if (!text) {
    resetStats()
    return
  }

  // Basic counts
  stats.characters = text.length
  stats.charactersNoSpaces = text.replace(/\s/g, '').length
  stats.lines = text.split('\n').length

  // Word analysis
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  stats.words = words.length

  // Paragraphs (split by double newlines or more)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  stats.paragraphs = paragraphs.length

  // Sentences (split by period, exclamation, question mark)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  stats.sentences = sentences.length

  // Reading time (assuming 200 words per minute)
  stats.readingTime = Math.ceil(stats.words / 200)

  // Speaking time (assuming 150 words per minute)
  stats.speakingTime = Math.ceil(stats.words / 150)

  // Averages
  stats.avgWordsPerSentence = stats.sentences > 0 ? Math.round((stats.words / stats.sentences) * 10) / 10 : 0
  stats.avgCharsPerWord = stats.words > 0 ? Math.round((stats.charactersNoSpaces / stats.words) * 10) / 10 : 0

  // Longest word
  if (words.length > 0) {
    stats.longestWord = words.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    )
  } else {
    stats.longestWord = ''
  }

  // Word frequency analysis
  if (words.length > 0) {
    const wordFreq = new Map<string, number>()
    const cleanWords = words.map(word => word.toLowerCase().replace(/[^\w]/g, ''))

    cleanWords.forEach(word => {
      if (word.length > 0) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    let maxFreq = 0
    let mostFrequent = ''

    wordFreq.forEach((freq, word) => {
      if (freq > maxFreq) {
        maxFreq = freq
        mostFrequent = word
      }
    })

    stats.mostFrequentWord = mostFrequent
    stats.uniqueWords = wordFreq.size
  } else {
    stats.mostFrequentWord = ''
    stats.uniqueWords = 0
  }
}

const resetStats = () => {
  Object.assign(stats, {
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0,
    speakingTime: 0,
    avgWordsPerSentence: 0,
    avgCharsPerWord: 0,
    longestWord: '',
    mostFrequentWord: '',
    uniqueWords: 0
  })
}

// A restored input has no stats yet (derived, never persisted) — compute
// them once so the counts are visible without an extra keystroke. Placed
// after resetStats (analyzeText calls it on an empty/falsy restored value).
if (toolState.restored) analyzeText()

// Bound to ToolActions' Copy button — same summary the old ad-hoc
// "Copy Stats" button produced. Empty when there's nothing to analyze, so
// ToolActions' Copy button auto-disables (mirrors the old :disabled guard).
const statsText = computed(() => {
  if (!inputText.value.trim()) return ''
  return `Text Statistics:
• Characters: ${stats.characters}
• Characters (no spaces): ${stats.charactersNoSpaces}
• Words: ${stats.words}
• Lines: ${stats.lines}
• Paragraphs: ${stats.paragraphs}
• Sentences: ${stats.sentences}
• Reading Time: ${stats.readingTime} min
• Average words per sentence: ${stats.avgWordsPerSentence}
• Average characters per word: ${stats.avgCharsPerWord}
• Longest word: ${stats.longestWord}
• Most frequent word: ${stats.mostFrequentWord}
• Unique words: ${stats.uniqueWords}`
})

const clearText = () => {
  const previousInput = inputText.value
  inputText.value = ''
  resetStats()

  if (previousInput) {
    toast.add({
      severity: 'info',
      summary: 'Text cleared',
      life: 10000,
      action: {
        label: 'Undo',
        handler: () => {
          inputText.value = previousInput
          analyzeText()
        }
      }
    })
  }

  // Persist the cleared state immediately — a reload inside the debounce
  // window would otherwise resurrect the cleared text.
  toolState.flushSave()
}
</script>

<style scoped>
.counter-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: var(--dt-text-primary);
  margin-bottom: 0.5rem;
}

.text-area {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 300px;
  resize: vertical;
  width: 100%;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--dt-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--dt-text-secondary);
  margin-top: 0.25rem;
  font-weight: 500;
}

.detailed-analysis {
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.detailed-analysis-empty {
  margin-top: 1.5rem;
}

.analysis-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--dt-border);
}

.analysis-item:last-child {
  border-bottom: none;
}

.analysis-label {
  font-weight: 500;
  color: var(--dt-text-secondary);
}

.analysis-value {
  font-weight: 600;
  color: var(--dt-text-primary);
  font-family: var(--font-mono);
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

@media (max-width: 1024px) {
  .counter-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>