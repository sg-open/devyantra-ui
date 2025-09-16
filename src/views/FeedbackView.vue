<template>
  <div class="feedback-page">
    <div class="page-header">
      <h1 class="page-title">
        <i class="pi pi-comment"></i>
        Feedback
      </h1>
      <p class="page-description">
        Help us make DevYantra better for developers like you
      </p>
    </div>

    <div class="feedback-container">
      <FeedbackForm />

      <div class="feedback-info">
        <Card class="info-card">
          <template #content>
            <div class="info-section">
              <h3>
                <i class="pi pi-heart"></i>
                We Value Your Input
              </h3>
              <p>
                DevYantra is built for developers, by developers. Your feedback helps us:
              </p>
              <ul class="feedback-benefits">
                <li><i class="pi pi-check"></i> Fix bugs and improve reliability</li>
                <li><i class="pi pi-check"></i> Add features you actually need</li>
                <li><i class="pi pi-check"></i> Enhance the developer experience</li>
                <li><i class="pi pi-check"></i> Prioritize what matters most</li>
              </ul>
            </div>

            <Divider />

            <div class="info-section">
              <h3>
                <i class="pi pi-github"></i>
                Open Source
              </h3>
              <p>
                DevYantra is open source! You can also contribute directly:
              </p>
              <div class="github-links">
                <Button
                  @click="openGitHub"
                  variant="outlined"
                  class="github-btn"
                >
                  <i class="pi pi-github"></i>
                  View on GitHub
                </Button>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FeedbackForm from '@/components/FeedbackForm.vue'

const openGitHub = () => {
  window.open('https://github.com/sg-open/devyantra-ui', '_blank')
}
</script>

<style scoped>
.feedback-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.page-title i {
  color: #3b82f6;
}

.page-description {
  font-size: 1.25rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.feedback-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  align-items: start;
}

.info-card {
  position: sticky;
  top: 2rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.info-section h3 i {
  color: #3b82f6;
}

.info-section p {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.feedback-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feedback-benefits li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: var(--text-color);
}

.feedback-benefits li i {
  color: #10b981;
  font-weight: bold;
}

.github-links {
  display: flex;
  gap: 1rem;
}

.github-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.github-btn:hover {
  background: linear-gradient(135deg, #333, #000) !important;
  color: white !important;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .feedback-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-description {
    font-size: 1rem;
  }

  .feedback-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .info-card {
    position: static;
  }
}
</style>