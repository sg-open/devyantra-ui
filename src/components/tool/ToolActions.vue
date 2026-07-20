<template>
  <div class="tool-actions">
    <!-- Copy button -->
    <button
      class="p-button p-button-sm p-button-outlined"
      :disabled="!copyText?.trim()"
      @click="handleCopy"
    >
      <i class="pi pi-copy"></i>
      Copy
    </button>

    <!-- Clear button -->
    <button
      class="p-button p-button-sm p-button-outlined"
      @click="handleClear"
    >
      <i class="pi pi-trash"></i>
      {{ clearLabel ?? 'Clear' }}
    </button>

    <!-- Sample button - only rendered when sample prop is provided -->
    <button
      v-if="sample"
      class="p-button p-button-sm p-button-outlined"
      @click="sample"
    >
      <i class="pi pi-file"></i>
      Sample
    </button>

    <!-- Extra slot for tool-specific controls -->
    <slot name="extra"></slot>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@/composables/useClipboard'

interface Props {
  copyText?: string
  copyLabel?: string
  clearLabel?: string
  sample?: () => void
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  clear: []
}>()

const { copyWithFeedback } = useClipboard()

const handleCopy = async () => {
  if (props.copyText?.trim()) {
    await copyWithFeedback(props.copyText, props.copyLabel ?? 'Result')
  }
}

const handleClear = () => {
  // The PARENT is responsible for the actual clearing + undo toast.
  // This component only emits the event; state ownership stays with the tool.
  emit('clear')
}
</script>

<style scoped>
.tool-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--dt-surface-2);
  border-radius: 8px;
  border: 1px solid var(--dt-border);
}

.p-button {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.p-button:hover:not(:disabled) {
  background: var(--dt-surface-3);
  border-color: var(--dt-border-strong);
}
</style>
