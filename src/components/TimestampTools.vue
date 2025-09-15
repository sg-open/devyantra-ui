<template>
  <Card class="timestamp-tools">
    <template #title>
      <div class="card-header">
        <i class="pi pi-calendar text-2xl mr-2"></i>
        Timestamp Converter
      </div>
    </template>

    <template #subtitle>
      Convert between timestamps and human-readable dates
    </template>

    <template #content>

    <div class="timestamp-container">
      <div class="current-time">
        <h3>Current Time</h3>
        <div class="time-display">
          <div class="time-item">
            <label>Unix Timestamp:</label>
            <code>{{ currentTimestamp }}</code>
          </div>
          <div class="time-item">
            <label>ISO String:</label>
            <code>{{ currentISO }}</code>
          </div>
          <div class="time-item">
            <label>Human Readable:</label>
            <code>{{ currentHuman }}</code>
          </div>
        </div>
      </div>

      <div class="converter">
        <h3>Convert Timestamp</h3>
        <div class="converter-input">
          <InputText
            v-model="inputTimestamp"
            type="number"
            placeholder="Enter Unix timestamp..."
            class="timestamp-input"
            @input="convertTimestamp"
          />
        </div>

        <div v-if="convertedDate" class="converted-result">
          <div class="result-item">
            <label>Date:</label>
            <code>{{ convertedDate }}</code>
          </div>
          <div class="result-item">
            <label>ISO:</label>
            <code>{{ convertedISO }}</code>
          </div>
        </div>
      </div>
    </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTimestamp = ref(0)
const currentISO = ref('')
const currentHuman = ref('')
const inputTimestamp = ref('')
const convertedDate = ref('')
const convertedISO = ref('')

let interval: ReturnType<typeof setInterval>

const updateCurrentTime = () => {
  const now = new Date()
  currentTimestamp.value = Math.floor(now.getTime() / 1000)
  currentISO.value = now.toISOString()
  currentHuman.value = now.toLocaleString()
}

const convertTimestamp = () => {
  if (!inputTimestamp.value) {
    convertedDate.value = ''
    convertedISO.value = ''
    return
  }

  try {
    const timestamp = parseInt(inputTimestamp.value)
    const date = new Date(timestamp * 1000)
    convertedDate.value = date.toLocaleString()
    convertedISO.value = date.toISOString()
  } catch {
    convertedDate.value = 'Invalid timestamp'
    convertedISO.value = ''
  }
}

onMounted(() => {
  updateCurrentTime()
  interval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.timestamp-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.current-time,
.converter {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
}

.current-time h3,
.converter h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.time-display,
.converted-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-item,
.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-item label,
.result-item label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.time-item code,
.result-item code {
  background: var(--surface-ground);
  color: var(--text-color);
  padding: 0.75rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  border: 1px solid var(--surface-border);
  word-break: break-all;
  display: block;
}

.timestamp-input {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
}

.converter-input {
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .timestamp-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>