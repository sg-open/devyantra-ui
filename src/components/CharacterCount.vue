<template>
  <Card class="character-count">
    <template #title>
      <div class="card-header">
        <i class="pi pi-hashtag text-2xl mr-2"></i>
        Character Counter
      </div>
    </template>

    <template #subtitle>
      Analyze text statistics including characters, words, lines, and more
    </template>

    <template #content>

    <div class="counter-container">
      <!-- Input Section -->
      <div class="input-section">
        <label class="input-label">Enter your text:</label>
        <Textarea
          v-model="inputText"
          placeholder="Type or paste your text here to analyze..."
          rows="12"
          class="text-area"
          @input="analyzeText"
        />

        <div class="input-actions">
          <Button
            @click="clearText"
            :disabled="!inputText.trim()"
            icon="pi pi-trash"
            label="Clear Text"
            severity="secondary"
            outlined
          />
          <Button
            @click="copyStats"
            :disabled="!inputText.trim()"
            icon="pi pi-copy"
            label="Copy Stats"
            severity="secondary"
            outlined
          />
        </div>
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
        </div>
      </div>
    </div>

    <!-- Detailed Analysis - Full Width Below Both Sections -->
    <div v-if="inputText.trim()" class="detailed-analysis">
      <h3 class="analysis-title">
        <i class="pi pi-chart-bar mr-2"></i>
        Detailed Analysis
      </h3>

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
        <i class="pi pi-chart-bar text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-500">Enter text above to see detailed analysis</p>
      </div>
    </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'

interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  readingTime: number
  avgWordsPerSentence: number
  avgCharsPerWord: number
  longestWord: string
  mostFrequentWord: string
  uniqueWords: number
}

const toast = useToast()
const inputText = ref('')

const stats = reactive<TextStats>({
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  lines: 0,
  paragraphs: 0,
  sentences: 0,
  readingTime: 0,
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
    avgWordsPerSentence: 0,
    avgCharsPerWord: 0,
    longestWord: '',
    mostFrequentWord: '',
    uniqueWords: 0
  })
}

const clearText = () => {
  inputText.value = ''
  resetStats()

  toast.add({
    severity: 'info',
    summary: 'Cleared',
    detail: 'Text and statistics have been cleared',
    life: 2000
  })
}

const copyStats = async () => {
  if (!inputText.value.trim()) return

  const statsText = `Text Statistics:
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

  try {
    await navigator.clipboard.writeText(statsText)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Statistics copied to clipboard',
      life: 2000
    })
  } catch (err) {
    console.error('Copy failed:', err)
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy statistics',
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
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.text-area {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 300px;
  resize: vertical;
  width: 100%;
}

.input-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
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
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.primary {
  border-color: var(--blue-300);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
}

.stat-card.secondary {
  border-color: var(--gray-300);
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.05));
}

.stat-card.success {
  border-color: var(--green-300);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
}

.stat-card.info {
  border-color: var(--cyan-300);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
}

.stat-card.warning {
  border-color: var(--yellow-300);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
}

.stat-card.danger {
  border-color: var(--red-300);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
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
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
  font-weight: 500;
}

.detailed-analysis {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
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
  color: var(--text-color);
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
  border-bottom: 1px solid var(--surface-border);
}

.analysis-item:last-child {
  border-bottom: none;
}

.analysis-label {
  font-weight: 500;
  color: var(--text-color-secondary);
}

.analysis-value {
  font-weight: 600;
  color: var(--text-color);
  font-family: 'JetBrains Mono', monospace;
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
  .input-actions {
    flex-direction: column;
  }

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