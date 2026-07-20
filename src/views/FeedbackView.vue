<template>
  <div class="tool-panel feedback-page">
    <header class="tool-hero">
      <h1>Feedback</h1>
      <p>Help us make DevYantra better. Report bugs, request features, or share your thoughts.</p>
    </header>

    <section class="feedback-links">
      <a
        href="https://github.com/sg-open/devyantra-ui/issues/new?template=bug_report.yml"
        target="_blank"
        rel="noopener"
        class="feedback-link-card"
      >
        <i class="pi pi-times-circle" aria-hidden="true"></i>
        <h3>Report a bug</h3>
        <p>Found something broken? Let us know so we can fix it.</p>
      </a>

      <a
        href="https://github.com/sg-open/devyantra-ui/issues/new?template=feature_request.yml"
        target="_blank"
        rel="noopener"
        class="feedback-link-card"
      >
        <i class="pi pi-lightbulb" aria-hidden="true"></i>
        <h3>Request a feature</h3>
        <p>Have an idea to make DevYantra better? We'd love to hear it.</p>
      </a>

      <a
        href="https://github.com/sg-open/devyantra-ui/discussions"
        target="_blank"
        rel="noopener"
        class="feedback-link-card"
      >
        <i class="pi pi-comments" aria-hidden="true"></i>
        <h3>Ask a question</h3>
        <p>Curious about how to use DevYantra? Start a discussion.</p>
      </a>
    </section>

    <section class="feedback-note">
      <p>DevYantra is open source — you can also <a href="https://github.com/sg-open/devyantra-ui" target="_blank" rel="noopener">contribute on GitHub</a>.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.feedback-page {
  max-width: 640px;
}

.feedback-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 1rem);
  margin-top: var(--space-xl, 2rem);
  margin-bottom: var(--space-xl, 2rem);
}

.feedback-link-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 0.75rem);
  padding: var(--space-lg, 1rem);
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md, 8px);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.feedback-link-card:hover {
  border-color: var(--dt-brand);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feedback-link-card i {
  font-size: 1.5rem;
  color: var(--dt-brand);
}

.feedback-link-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: 0;
}

.feedback-link-card p {
  font-size: 0.9rem;
  color: var(--dt-text-secondary);
  margin: 0;
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
