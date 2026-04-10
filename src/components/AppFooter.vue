<template>
  <footer
    class="footer"
    role="contentinfo"
    aria-label="Site footer"
  >
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-section">
          <h2 class="footer-heading">Text Tools</h2>
          <nav aria-label="Text tools">
            <router-link to="/tools/text-compare">Text Compare</router-link>
            <router-link to="/tools/format-text">Code Formatter</router-link>
            <router-link to="/tools/delimiter">Delimiter Tool</router-link>
            <router-link to="/tools/character-count">Character Counter</router-link>
          </nav>
        </div>
        <div class="footer-section">
          <h2 class="footer-heading">Encoding & Security</h2>
          <nav aria-label="Encoding and security tools">
            <router-link to="/tools/hash-generator">Hash Generator</router-link>
            <router-link to="/tools/base64-tools">Base64 Tools</router-link>
            <router-link to="/tools/jwt-decoder">JWT Decoder</router-link>
            <router-link to="/tools/timestamp-converter">Timestamp Converter</router-link>
          </nav>
        </div>
        <div class="footer-section">
          <h2 class="footer-heading">DevYantra</h2>
          <nav aria-label="Site links">
            <router-link to="/feedback">Feedback</router-link>
            <a href="https://github.com/sg-open/devyantra-ui" target="_blank" rel="noopener">GitHub</a>
          </nav>
          <p class="footer-privacy">All tools process data locally in your browser. Nothing is sent to any server.</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="footer-credit">DevYantra &mdash; Free developer tools</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.footer {
  background: var(--dt-surface-1);
  border-top: 1px solid var(--dt-border);
  margin-top: auto;
  padding: var(--space-xl, 2rem) 0 var(--space-md, 0.75rem);
}

.footer-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl, 2rem);
  margin-bottom: var(--space-lg, 1rem);
}

.footer-heading {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 var(--space-sm, 0.5rem);
}

.footer-section nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-section nav a {
  font-size: var(--text-sm, 0.85rem);
  color: var(--dt-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast, 150ms);
  line-height: 1.6;
}

.footer-section nav a:hover {
  color: var(--dt-brand);
}

.footer-privacy {
  margin-top: var(--space-sm, 0.5rem);
  font-size: 0.75rem;
  color: var(--dt-text-tertiary);
  line-height: 1.4;
}

.footer-bottom {
  border-top: 1px solid var(--dt-border);
  padding-top: var(--space-sm, 0.5rem);
  text-align: center;
}

.footer-credit {
  font-size: var(--text-sm, 0.85rem);
  color: var(--dt-text-secondary);
  font-weight: 400;
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg, 1rem);
  }
}

@media (max-width: 400px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .footer {
    transition: none;
  }
}
</style>
