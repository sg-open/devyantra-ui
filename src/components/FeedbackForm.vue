<template>
  <Card class="feedback-card">
    <template #title>
      <div class="card-header">
        <i class="pi pi-comment text-2xl mr-2"></i>
        Developer Feedback
      </div>
    </template>

    <template #subtitle>
      Help us improve DevYantra with your thoughts
    </template>

    <template #content>
      <form @submit.prevent="submitFeedback" class="feedback-form">
        <!-- Feedback Type Quick Buttons -->
        <div class="feedback-type-section">
          <h4 class="type-title">
            <i class="pi pi-tag"></i>
            Feedback Type
          </h4>
          <div class="type-buttons">
            <Button
              v-for="type in feedbackTypes"
              :key="type.value"
              @click="selectedType = type.value"
              :class="['type-btn', type.value, { active: selectedType === type.value }]"
              size="small"
              :variant="selectedType === type.value ? 'filled' : 'outlined'"
            >
              <i :class="type.icon"></i>
              {{ type.label }}
            </Button>
          </div>
        </div>

        <Divider />

        <!-- Message -->
        <div class="message-section">
          <label class="input-label">Message *</label>
          <Textarea
            v-model="message"
            placeholder="What's on your mind? Bug reports, feature requests, or general feedback..."
            rows="4"
            class="message-textarea enhanced-textarea"
            :class="{ 'error': submitted && !message.trim() }"
            required
          />
          <div v-if="submitted && !message.trim()" class="error-text">
            Message is required
          </div>
        </div>

        <!-- Optional Contact -->
        <div class="contact-section">
          <label class="input-label">
            Email (optional)
            <span class="optional-text">- for follow-up</span>
          </label>
          <InputText
            v-model="email"
            placeholder="your.email@example.com"
            type="email"
            class="contact-input enhanced-input"
          />
        </div>

        <!-- Submit Actions -->
        <div class="submit-actions">
          <Button
            type="submit"
            :loading="isSubmitting"
            :disabled="!message.trim()"
            class="submit-btn enhanced-submit-btn"
          >
            <i class="pi pi-send"></i>
            {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
          </Button>
          <Button
            @click="clearForm"
            variant="outlined"
            severity="secondary"
            :disabled="isSubmitting"
            class="clear-btn"
          >
            <i class="pi pi-refresh"></i>
            Clear
          </Button>
        </div>

        <!-- Success Message -->
        <Message
          v-if="showSuccess"
          severity="success"
          :closable="false"
          class="success-message"
        >
          <i class="pi pi-check-circle"></i>
          Thanks for your feedback! We appreciate you helping make DevYantra better.
        </Message>

        <!-- Error Message -->
        <Message
          v-if="showError"
          severity="error"
          :closable="false"
          class="error-message"
        >
          <i class="pi pi-exclamation-triangle"></i>
          {{ errorMessage }}
        </Message>
      </form>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Form data
const selectedType = ref('general')
const message = ref('')
const email = ref('')

// Form state
const isSubmitting = ref(false)
const submitted = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

// Feedback types
const feedbackTypes = ref([
  { value: 'bug', label: 'Bug Report', icon: 'pi pi-bug' },
  { value: 'feature', label: 'Feature Request', icon: 'pi pi-plus-circle' },
  { value: 'improvement', label: 'Improvement', icon: 'pi pi-cog' },
  { value: 'general', label: 'General', icon: 'pi pi-comment' }
])

// Submit feedback
const submitFeedback = async () => {
  submitted.value = true

  if (!message.value.trim()) {
    return
  }

  isSubmitting.value = true
  showSuccess.value = false
  showError.value = false

  try {
    const formData = new FormData()
    formData.append('type', selectedType.value)
    formData.append('message', message.value.trim())
    formData.append('email', email.value.trim())
    formData.append('tool', 'DevYantra')
    formData.append('timestamp', new Date().toISOString())

    const response = await fetch('https://formspree.io/f/mjkedeyl', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      showSuccess.value = true
      clearForm()

      toast.add({
        severity: 'success',
        summary: 'Feedback Sent',
        detail: 'Your feedback has been sent successfully!',
        life: 3000
      })

      // Hide success message after 5 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 5000)
    } else {
      throw new Error('Failed to send feedback')
    }
  } catch (error) {
    showError.value = true
    errorMessage.value = 'Failed to send feedback. Please try again later.'

    toast.add({
      severity: 'error',
      summary: 'Send Failed',
      detail: 'Could not send feedback. Please try again.',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

// Clear form
const clearForm = () => {
  selectedType.value = 'general'
  message.value = ''
  email.value = ''
  submitted.value = false
  showSuccess.value = false
  showError.value = false
}

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    if (event.shiftKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          if (message.value.trim() && !isSubmitting.value) {
            submitFeedback()
          }
          break
        case 'R':
        case 'r':
          event.preventDefault()
          clearForm()
          break
      }
    }
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style scoped>
.feedback-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Feedback Type Section */
.feedback-type-section {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.type-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.type-title i {
  color: #3b82f6;
}

.type-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
}

.type-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.type-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.type-btn:hover::before {
  left: 100%;
}

.type-btn.bug.active,
.type-btn.bug:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.type-btn.feature.active,
.type-btn.feature:hover {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.type-btn.improvement.active,
.type-btn.improvement:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.type-btn.general.active,
.type-btn.general:hover {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Form Fields */
.message-section,
.contact-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
  margin: 0;
}

.optional-text {
  font-weight: 400;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.enhanced-textarea,
.enhanced-input {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  font-family: 'JetBrains Mono', monospace;
}

.enhanced-textarea:focus,
.enhanced-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.message-textarea {
  min-height: 100px;
  resize: vertical;
}

.enhanced-textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Submit Actions */
.submit-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.enhanced-submit-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  flex: 1;
  max-width: 200px;
}

.enhanced-submit-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.enhanced-submit-btn:hover::after {
  width: 300px;
  height: 300px;
}

.enhanced-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.clear-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-btn:hover {
  background: linear-gradient(135deg, #6b7280, #4b5563) !important;
  color: white !important;
  transform: translateY(-1px);
}

/* Messages */
.success-message,
.error-message {
  margin-top: 1rem;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.success-message .pi,
.error-message .pi {
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .type-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .submit-actions {
    flex-direction: column;
  }

  .enhanced-submit-btn {
    max-width: none;
  }
}

/* Animation keyframes */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>