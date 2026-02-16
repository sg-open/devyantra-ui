<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p class="not-found-message">Page not found</p>
      <p class="not-found-hint">The page you're looking for doesn't exist or has been moved.</p>
      <div class="not-found-actions">
        <router-link to="/tools/text-compare" class="not-found-link primary">Go to Tools</router-link>
        <router-link to="/" class="not-found-link secondary">Home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Page Not Found | DEVYANTRA'

  let robotsMeta = document.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta')
    robotsMeta.setAttribute('name', 'robots')
    document.head.appendChild(robotsMeta)
  }
  robotsMeta.setAttribute('content', 'noindex')
})
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: var(--space-xl, 2rem);
}

.not-found-content {
  text-align: center;
  max-width: 480px;
}

.not-found h1 {
  font-size: 6rem;
  font-weight: 800;
  color: var(--dt-brand);
  margin: 0;
  line-height: 1;
}

.not-found-message {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: var(--space-sm, 0.5rem) 0;
}

.not-found-hint {
  color: var(--dt-text-secondary);
  margin-bottom: var(--space-lg, 1.5rem);
}

.not-found-actions {
  display: flex;
  gap: var(--space-sm, 0.5rem);
  justify-content: center;
}

.not-found-link {
  padding: 8px 20px;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background var(--transition-fast, 150ms);
}

.not-found-link.primary {
  background: var(--dt-brand);
  color: white;
}

.not-found-link.primary:hover {
  opacity: 0.9;
}

.not-found-link.secondary {
  background: var(--dt-surface-2);
  color: var(--dt-text-primary);
  border: 1px solid var(--dt-border);
}

.not-found-link.secondary:hover {
  background: var(--dt-surface-3, var(--dt-surface-2));
}
</style>
