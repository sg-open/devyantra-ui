<!--
  DiffIndicators.vue - Pills for invisible-difference indicators (EOL, BOM,
  missing trailing newline) surfaced by src/lib/diff/normalize.ts.

  Props:
  - indicators: Indicator[]
-->

<template>
  <div v-if="indicators.length > 0" class="dv-indicators">
    <span
      v-for="(indicator, i) in indicators"
      :key="i"
      class="dv-indicator"
      :class="`dv-indicator--${indicator.kind}`"
    >{{ indicator.detail }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Indicator } from '@/lib/diff/normalize'

interface Props {
  indicators: Indicator[]
}

defineProps<Props>()
</script>

<style scoped>
.dv-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
}

.dv-indicator {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: 20px;
  border: 1px solid var(--dt-border);
  background: var(--dt-surface-2);
  color: var(--dt-text-secondary);
  line-height: 1.5;
  white-space: nowrap;
}

.dv-indicator--eol-differs,
.dv-indicator--no-trailing-newline-left,
.dv-indicator--no-trailing-newline-right {
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--dt-warning);
}

.dv-indicator--bom-left,
.dv-indicator--bom-right {
  border-color: var(--dt-border-strong);
  color: var(--dt-text-secondary);
}
</style>
