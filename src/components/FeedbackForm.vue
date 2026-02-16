<template>
  <form @submit.prevent="submitFeedback" class="feedback-form">
    <!-- Feedback Type -->
    <div class="form-field">
      <label class="field-label">Type</label>
      <div class="type-track">
        <button
          v-for="type in feedbackTypes"
          :key="type.value"
          type="button"
          @click="selectedType = type.value"
          :class="['type-item', { active: selectedType === type.value }]"
        >
          <i :class="type.icon" aria-hidden="true"></i>
          <span>{{ type.label }}</span>
        </button>
      </div>
    </div>

    <!-- Message -->
    <div class="form-field">
      <label class="field-label" for="feedback-message">Message <span class="required">*</span></label>
      <textarea
        id="feedback-message"
        v-model="message"
        placeholder="What's on your mind?"
        rows="5"
        class="p-inputtextarea"
        :class="{ 'p-invalid': submitted && !message.trim() }"
        required
      ></textarea>
      <small v-if="submitted && !message.trim()" class="field-error">Message is required</small>
    </div>

    <!-- Email -->
    <div class="form-field">
      <label class="field-label" for="feedback-email">
        Email <span class="optional">(optional — for follow-up)</span>
      </label>
      <input
        id="feedback-email"
        v-model="email"
        placeholder="you@example.com"
        type="email"
        class="p-inputtext"
      />
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button type="submit" class="p-button submit-btn" :disabled="!message.trim() || isSubmitting">
        <i :class="isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'"></i>
        {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
      </button>
      <button type="button" class="p-button p-button-outlined clear-btn" :disabled="isSubmitting" @click="clearForm">
        Clear
      </button>
    </div>

    <!-- Success -->
    <div v-if="showSuccess" class="form-message success" role="alert">
      <i class="pi pi-check-circle"></i>
      Thanks for your feedback! We appreciate it.
    </div>

    <!-- Error -->
    <div v-if="showError" class="form-message error" role="alert">
      <i class="pi pi-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const selectedType = ref('general')
const message = ref('')
const email = ref('')

const isSubmitting = ref(false)
const submitted = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

const feedbackTypes = [
  { value: 'bug', label: 'Bug', icon: 'pi pi-exclamation-triangle' },
  { value: 'feature', label: 'Feature', icon: 'pi pi-plus-circle' },
  { value: 'improvement', label: 'Improvement', icon: 'pi pi-cog' },
  { value: 'general', label: 'General', icon: 'pi pi-comment' }
]

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
      setTimeout(() => { showSuccess.value = false }, 5000)
    } else {
      throw new Error('Failed to send feedback')
    }
  } catch {
    showError.value = true
    errorMessage.value = 'Failed to send feedback. Please try again later.'
  } finally {
    isSubmitting.value = false
  }
}

const clearForm = () => {
  selectedType.value = 'general'
  message.value = ''
  email.value = ''
  submitted.value = false
  showSuccess.value = false
  showError.value = false
}

const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (message.value.trim() && !isSubmitting.value) {
        submitFeedback()
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl, 1.5rem);
}

/* Form fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 0.5rem);
}

.field-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--dt-text-primary);
}

.required {
  color: var(--dt-danger);
}

.optional {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--dt-text-secondary);
}

.field-error {
  color: var(--dt-danger);
  font-size: 0.85rem;
}

/* Type selector — segmented control matching nav */
.type-track {
  display: flex;
  gap: 2px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg, 10px);
  padding: 3px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--dt-text-secondary);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.type-item i {
  font-size: 14px;
}

.type-item:hover {
  color: var(--dt-text-primary);
  background: var(--dt-surface-3);
}

.type-item.active {
  color: var(--dt-brand);
  background: var(--dt-surface-1);
  font-weight: 600;
  border-color: var(--dt-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Actions */
.form-actions {
  display: flex;
  gap: var(--space-sm, 0.5rem);
}

.submit-btn {
  background: var(--dt-brand);
  border-color: var(--dt-brand);
  color: var(--button-primary-text);
  font-weight: 600;
  flex: 1;
}

.submit-btn:hover:not(:disabled) {
  background: var(--dt-brand-hover);
  border-color: var(--dt-brand-hover);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  color: var(--dt-text-secondary);
}

/* Messages */
.form-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: var(--space-md, 0.75rem) var(--space-lg, 1rem);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-message.success {
  background: var(--dt-success-light);
  color: var(--dt-success);
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.form-message.error {
  background: var(--dt-danger-light);
  color: var(--dt-danger);
  border: 1px solid rgba(198, 40, 40, 0.2);
}

/* Responsive */
@media (max-width: 480px) {
  .type-track {
    flex-wrap: wrap;
  }

  .type-item {
    flex: 1 1 calc(50% - 2px);
  }

  .type-item span {
    display: none;
  }

  .type-item i {
    font-size: 16px;
  }
}
</style>
