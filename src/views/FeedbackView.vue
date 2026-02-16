<template>
  <div class="tool-panel feedback-page">
    <header class="tool-hero">
      <h1>Feedback</h1>
      <p>Help us make DevYantra better. Report bugs, request features, or share your thoughts.</p>
    </header>

    <FeedbackForm />

    <section class="feedback-note">
      <p>DevYantra is open source — you can also <a href="https://github.com/sg-open/devyantra-ui" target="_blank" rel="noopener">contribute on GitHub</a>.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import FeedbackForm from '@/components/FeedbackForm.vue'
</script>

<style scoped>
.feedback-page {
  max-width: 640px;
}

.feedback-note {
  margin-top: var(--space-xl, 2rem);
  padding-top: var(--space-lg, 1rem);
  border-top: 1px solid var(--dt-border);
}

.feedback-note p {
  font-size: 0.9rem;
  color: var(--dt-text-secondary);
  margin: 0;
}

.feedback-note a {
  color: var(--dt-brand);
  text-decoration: none;
  font-weight: 500;
}

.feedback-note a:hover {
  text-decoration: underline;
}
</style>
