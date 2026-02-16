<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="open" class="palette-overlay" @click.self="emit('update:open', false)">
        <div class="palette-panel" role="dialog" aria-label="Command palette">
          <div class="palette-header">
            <i class="pi pi-search palette-search-icon"></i>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              class="palette-input"
              placeholder="Search tools..."
              @keydown.escape="emit('update:open', false)"
              @keydown.enter="executeSelected"
              @keydown.arrow-down.prevent="moveSelection(1)"
              @keydown.arrow-up.prevent="moveSelection(-1)"
            />
            <kbd class="palette-esc">ESC</kbd>
          </div>
          <div class="palette-results" v-if="filteredCommands.length">
            <button
              v-for="(cmd, i) in filteredCommands"
              :key="cmd.id"
              :class="['palette-item', { selected: selectedIndex === i }]"
              @click="executeCommand(cmd)"
              @mouseenter="selectedIndex = i"
            >
              <i :class="cmd.icon"></i>
              <div class="palette-item-text">
                <span class="palette-item-label">{{ cmd.label }}</span>
                <span class="palette-item-desc">{{ cmd.description }}</span>
              </div>
            </button>
          </div>
          <div v-else class="palette-empty">
            No results found
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

interface Command {
  id: string
  label: string
  description: string
  icon: string
  action: () => void
}

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const router = useRouter()
const themeStore = useThemeStore()
const query = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement>()

const commands = computed<Command[]>(() => [
  { id: 'text-compare', label: 'Text Compare', description: 'Compare & diff text', icon: 'pi pi-sync', action: () => router.push('/tools/text-compare') },
  { id: 'delimiter', label: 'Delimiter', description: 'Split & join text', icon: 'pi pi-arrows-h', action: () => router.push('/tools/delimiter') },
  { id: 'format-text', label: 'Code Formatter', description: 'JSON, SQL & more', icon: 'pi pi-file-edit', action: () => router.push('/tools/format-text') },
  { id: 'jwt-decoder', label: 'JWT Decoder', description: 'Decode & inspect tokens', icon: 'pi pi-shield', action: () => router.push('/tools/jwt-decoder') },
  { id: 'hash-generator', label: 'Hash Generator', description: 'MD5, SHA1, SHA256', icon: 'pi pi-key', action: () => router.push('/tools/hash-generator') },
  { id: 'base64-tools', label: 'Base64 Tools', description: 'Encode & decode', icon: 'pi pi-code', action: () => router.push('/tools/base64-tools') },
  { id: 'timestamp', label: 'Timestamp', description: 'Unix & ISO converter', icon: 'pi pi-calendar', action: () => router.push('/tools/timestamp-converter') },
  { id: 'character-count', label: 'Character Count', description: 'Text analytics', icon: 'pi pi-hashtag', action: () => router.push('/tools/character-count') },
  { id: 'toggle-theme', label: 'Toggle Theme', description: themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode', icon: themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon', action: () => themeStore.toggleTheme() },
])

const filteredCommands = computed(() => {
  if (!query.value.trim()) return commands.value
  const q = query.value.toLowerCase()
  return commands.value.filter(c =>
    c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

const moveSelection = (delta: number) => {
  const len = filteredCommands.value.length
  if (len === 0) return
  selectedIndex.value = (selectedIndex.value + delta + len) % len
}

const executeSelected = () => {
  const cmd = filteredCommands.value[selectedIndex.value]
  if (cmd) executeCommand(cmd)
}

const executeCommand = (cmd: Command) => {
  cmd.action()
  emit('update:open', false)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => searchInput.value?.focus())
  }
})

watch(query, () => {
  selectedIndex.value = 0
})
</script>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
}

.palette-panel {
  width: 100%;
  max-width: 560px;
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.palette-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--dt-border);
}

.palette-search-icon {
  font-size: 16px;
  color: var(--dt-text-tertiary);
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--dt-text-primary);
}

.palette-input::placeholder {
  color: var(--dt-text-tertiary);
}

.palette-esc {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  padding: 2px 5px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: 3px;
  color: var(--dt-text-tertiary);
}

.palette-results {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
  color: var(--dt-text-primary);
  font-family: var(--font-sans);
}

.palette-item.selected {
  background: var(--dt-surface-2);
}

.palette-item i {
  font-size: 16px;
  color: var(--dt-text-secondary);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.palette-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-item-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--dt-text-primary);
}

.palette-item-desc {
  font-size: 12px;
  color: var(--dt-text-tertiary);
}

.palette-empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--dt-text-tertiary);
}

/* Transition */
.palette-enter-active,
.palette-leave-active {
  transition: opacity 100ms ease;
}

.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}

.palette-enter-active .palette-panel,
.palette-leave-active .palette-panel {
  transition: transform 100ms ease;
}

.palette-enter-from .palette-panel {
  transform: scale(0.98);
}

.palette-leave-to .palette-panel {
  transform: scale(0.98);
}
</style>
