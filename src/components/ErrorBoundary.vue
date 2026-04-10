<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-card">
      <i class="pi pi-exclamation-triangle error-icon" aria-hidden="true"></i>
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-description">
        This tool encountered an error. Click below to try again.
      </p>
      <button class="retry-button" @click="reset">Try Again</button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)

onErrorCaptured((err: unknown) => {
  hasError.value = true
  console.error('[ErrorBoundary] Captured error:', err)
  // Prevent propagation to parent error handlers
  return false
})

function reset() {
  hasError.value = false
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  min-height: 200px;
}

.error-card {
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-left: 3px solid var(--dt-danger);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  max-width: 480px;
  width: 100%;
  text-align: center;
  background-color: var(--dt-danger-light);
}

.error-icon {
  font-size: 32px;
  color: var(--dt-danger);
  display: block;
  margin-bottom: var(--space-md);
}

.error-title {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  margin: 0 0 var(--space-md) 0;
}

.error-description {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--dt-text-secondary);
  margin: 0 0 var(--space-lg) 0;
  line-height: var(--leading-normal);
}

.retry-button {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border: none;
  border-radius: var(--button-radius);
  padding: var(--button-padding-md);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
  height: var(--button-height-md);
  display: inline-flex;
  align-items: center;
}

.retry-button:hover {
  background: var(--button-primary-hover);
}

.retry-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
