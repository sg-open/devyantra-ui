<template>
  <div class="app-container">
    <!-- Accessibility Skip Links -->
    <div class="skip-links">
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    </div>

    <!-- Compact Toolbar -->
    <div id="navigation" class="luxury-toolbar" role="banner">
      <div class="toolbar-content">
        <div class="toolbar-left">
        <router-link to="/" class="app-title">
          <div class="logo-container">
            <svg class="devyantra-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="42" stroke="var(--logo-primary)" stroke-width="1.5" fill="none" opacity="0.8"/>
              <path d="M50,15 L72,30 L72,55 L50,70 L28,55 L28,30 Z" stroke="var(--logo-primary)" stroke-width="1.5" fill="var(--logo-primary)" opacity="0.1"/>
              <g transform="translate(50,50)">
                <path d="M0,-18 L12,9 L-12,9 Z" fill="var(--logo-primary)" opacity="0.9"/>
                <path d="M0,18 L-12,-9 L12,-9 Z" fill="var(--logo-primary)" opacity="0.9"/>
                <circle cx="0" cy="0" r="8" fill="none" stroke="var(--logo-accent)" stroke-width="2" opacity="0.8"/>
                <circle cx="0" cy="0" r="3" fill="var(--logo-accent)"/>
                <g opacity="0.7">
                  <rect x="-1" y="-15" width="2" height="4" fill="var(--logo-accent)"/>
                  <rect x="-1" y="11" width="2" height="4" fill="var(--logo-accent)"/>
                  <rect x="11" y="-1" width="4" height="2" fill="var(--logo-accent)"/>
                  <rect x="-15" y="-1" width="4" height="2" fill="var(--logo-accent)"/>
                </g>
              </g>
              <g opacity="0.6" stroke="var(--logo-primary)" stroke-width="1.5" fill="none">
                <path d="M20,20 L15,20 L15,25"/>
                <path d="M80,20 L85,20 L85,25"/>
                <path d="M20,80 L15,80 L15,75"/>
                <path d="M80,80 L85,80 L85,75"/>
              </g>
            </svg>
          </div>
          <span class="app-name" role="heading" aria-level="2">DevYantra</span>
        </router-link>
        <div class="privacy-features">
          <div class="free-badge" v-tooltip.bottom="'Always free, no sign-up'">FREE</div>
          <div class="open-source-badge" v-tooltip.bottom="'View source on GitHub'" @click="openGitHub" role="button" tabindex="0" @keydown.enter="openGitHub" @keydown.space="openGitHub">
            <svg class="github-logo" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>Open Source</span>
          </div>
          <div class="privacy-badge" v-tooltip.bottom="'All processing happens in your browser locally'">
            <i class="pi pi-shield"></i>
            <span>Privacy First</span>
          </div>
        </div>
        </div>

        <div class="header-actions">
          <button class="cmdk-trigger" @click="commandPaletteOpen = true" v-tooltip.bottom="'Search tools (⌘K)'" aria-label="Search tools, ⌘K">
            <i class="pi pi-search"></i>
            <kbd>⌘K</kbd>
          </button>

          <router-link to="/feedback" class="feedback-btn" v-tooltip.bottom="'Share feedback'" aria-label="Share feedback">
            <i class="pi pi-comment"></i>
            <span class="feedback-text">Feedback</span>
          </router-link>

          <div class="theme-switcher" role="radiogroup" aria-label="Theme">
            <button
              class="theme-option"
              :class="{ active: !themeStore.isDark }"
              @click="themeStore.setMode('light')"
              role="radio"
              :aria-checked="!themeStore.isDark"
              aria-label="Light theme"
            >
              <i class="pi pi-sun"></i>
              <span class="theme-option-label">Light</span>
            </button>
            <button
              class="theme-option"
              :class="{ active: themeStore.isDark }"
              @click="themeStore.setMode('dark')"
              role="radio"
              :aria-checked="themeStore.isDark"
              aria-label="Dark theme"
            >
              <i class="pi pi-moon"></i>
              <span class="theme-option-label">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div id="main-content" class="main-content" role="main" tabindex="-1">
      <div class="content-wrapper">
        <RouterView />
      </div>
    </div>

    <!-- Footer -->
    <AppFooter />

    <!-- Toast -->
    <AppToast />

    <!-- Command Palette -->
    <CommandPalette v-model:open="commandPaletteOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppFooter from '@/components/AppFooter.vue'
import AppToast from '@/components/AppToast.vue'
import CommandPalette from '@/components/CommandPalette.vue'

const themeStore = useThemeStore()

const commandPaletteOpen = ref(false)

const openGitHub = () => {
  window.open('https://github.com/sg-open/devyantra-ui', '_blank')
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    commandPaletteOpen.value = !commandPaletteOpen.value
  }
}

onMounted(() => {
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover')
  }

  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColorMeta)
  }

  const updateThemeColor = () => {
    const isDark = document.documentElement.classList.contains('app-dark')
    themeColorMeta?.setAttribute('content', isDark ? '#0a0a0a' : '#F5F0E8')
  }

  updateThemeColor()

  const observer = new MutationObserver(updateThemeColor)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  document.addEventListener('keydown', handleKeydown)

})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Accessibility Skip Links */
.skip-links {
  position: absolute;
  top: -50px;
  left: 0;
  z-index: 1000;
}

.skip-link {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  background: var(--dt-brand);
  color: var(--button-primary-text);
  padding: 8px 12px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 4px 0;
  transition: all var(--transition-fast);
}

.skip-link:focus {
  position: static;
  left: auto;
  width: auto;
  height: auto;
  overflow: visible;
  z-index: 1001;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Compact Toolbar — 48px sticky header */
.luxury-toolbar {
  height: 48px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--dt-surface-1);
  border-bottom: 1px solid var(--dt-border);
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 var(--space-lg);
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.app-title {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
  color: inherit;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.devyantra-logo {
  width: 24px;
  height: 24px;
}

.app-name {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-sans);
  margin: 0;
  color: var(--dt-text-primary);
  white-space: nowrap;
  line-height: 1;
}

.privacy-features {
  display: flex;
  align-items: center;
  gap: 6px;
}

.free-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--dt-brand-light);
  color: var(--dt-brand);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--dt-brand-rgb), 0.2);
}

.open-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  color: var(--dt-text-secondary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
}

.open-source-badge:hover {
  background: var(--dt-brand-light);
  border-color: var(--dt-brand);
  color: var(--dt-brand);
}

.open-source-badge:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.github-logo {
  opacity: 0.8;
  flex-shrink: 0;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--dt-success-light);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: var(--dt-success);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: var(--radius-sm);
}

.privacy-badge i {
  font-size: 11px;
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cmdk-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  height: 32px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  color: var(--dt-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cmdk-trigger:hover {
  border-color: var(--dt-border-strong);
  color: var(--dt-text-primary);
}

.cmdk-trigger i {
  font-size: 14px;
}

.cmdk-trigger kbd {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  padding: 1px 4px;
  background: var(--dt-surface-1);
  border: 1px solid var(--dt-border);
  border-radius: 3px;
  color: var(--dt-text-tertiary);
}

.feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  color: var(--dt-text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.feedback-btn:hover {
  border-color: var(--dt-border-strong);
  color: var(--dt-text-primary);
  background: var(--dt-surface-2);
}

.feedback-btn i {
  font-size: 14px;
}

/* Theme Switcher — segmented pill */
.theme-switcher {
  display: inline-flex;
  align-items: center;
  height: 32px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 0;
}

.theme-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dt-text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: background var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.theme-option:hover:not(.active) {
  color: var(--dt-text-primary);
}

.theme-option.active {
  background: var(--dt-brand);
  color: var(--button-primary-text);
}

.theme-option i {
  font-size: 12px;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--space-lg);
}

/* Mobile */
@media (max-width: 768px) {
  .privacy-features {
    display: none;
  }

  .feedback-text {
    display: none;
  }

  .theme-option-label {
    display: none;
  }

  .theme-option {
    padding: 0 6px;
  }

  .cmdk-trigger kbd {
    display: none;
  }

  .toolbar-content {
    padding: 0 var(--space-md);
  }

  .content-wrapper {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .feedback-btn {
    padding: 4px 8px;
  }

  .feedback-btn .feedback-text {
    display: none;
  }

  .content-wrapper {
    padding: var(--space-sm);
  }
}
</style>
