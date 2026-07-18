<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['toast-message', `toast-${msg.severity}`]"
        role="alert"
      >
        <i :class="iconClass(msg.severity)"></i>
        <div class="toast-body">
          <div class="toast-summary">{{ msg.summary }}</div>
          <div v-if="msg.detail" class="toast-detail">{{ msg.detail }}</div>
        </div>
        <button v-if="msg.action" class="toast-action" @click="runAction(msg)">
          {{ msg.action.label }}
        </button>
        <button class="toast-close" @click="remove(msg.id)" aria-label="Close">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast, type ToastMessage } from '@/composables/useToast'

const { messages, remove } = useToast()

const iconClass = (severity: string) => {
  switch (severity) {
    case 'success': return 'pi pi-check-circle'
    case 'info': return 'pi pi-info-circle'
    case 'warn': return 'pi pi-exclamation-triangle'
    case 'error': return 'pi pi-times-circle'
    default: return 'pi pi-info-circle'
  }
}

const runAction = (msg: ToastMessage) => {
  msg.action?.handler()
  remove(msg.id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 60px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 380px;
  pointer-events: none;
}

.toast-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--dt-border);
  background: var(--dt-surface-1);
  color: var(--dt-text-primary);
  box-shadow: var(--elevation-3);
  pointer-events: auto;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.toast-message > i {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-summary {
  font-weight: var(--font-weight-semibold);
}

.toast-detail {
  margin-top: 2px;
  color: var(--dt-text-secondary);
  font-size: var(--text-xs);
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--dt-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.toast-close:hover {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
}

.toast-close i {
  font-size: 12px;
}

.toast-action {
  align-self: center;
  flex-shrink: 0;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--dt-brand);
  border-radius: var(--radius-sm);
  color: var(--dt-brand);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toast-action:hover {
  background: var(--dt-brand);
  color: #ffffff;
}

/* Severity colors */
.toast-success {
  border-color: rgba(16, 185, 129, 0.3);
}
.toast-success > i { color: var(--dt-success); }

.toast-info {
  border-color: rgba(var(--dt-brand-rgb), 0.3);
}
.toast-info > i { color: var(--dt-brand); }

.toast-warn {
  border-color: rgba(245, 158, 11, 0.3);
}
.toast-warn > i { color: var(--dt-warning); }

.toast-error {
  border-color: rgba(239, 68, 68, 0.3);
}
.toast-error > i { color: var(--dt-danger); }

/* Transition */
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
