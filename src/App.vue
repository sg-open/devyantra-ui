<template>
  <div class="app-container">
    <!-- Accessibility Skip Links -->
    <div class="skip-links">
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    </div>

    <!-- Luxury Background Patterns -->
    <div class="background-patterns">
      <div class="pattern-layer-1"></div>
      <div class="pattern-layer-2"></div>
      <div class="luxury-glow"></div>
    </div>

    <!-- Premium Toolbar -->
    <div id="navigation" class="luxury-toolbar glass-card" role="banner">
      <div class="toolbar-content">
        <div class="app-title">
          <div class="logo-container">
            <svg class="devyantra-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Outer Protection Circle -->
              <circle cx="50" cy="50" r="42" stroke="var(--logo-primary)" stroke-width="1.5" fill="none" opacity="0.8"/>

              <!-- Inner Sacred Hexagon (represents balance) -->
              <path d="M50,15 L72,30 L72,55 L50,70 L28,55 L28,30 Z" stroke="var(--logo-primary)" stroke-width="1.5" fill="var(--logo-primary)" opacity="0.1"/>

              <!-- Central Yantra Star -->
              <g transform="translate(50,50)">
                <!-- Main 6-pointed star (Shatkona - represents perfect balance) -->
                <path d="M0,-18 L12,9 L-12,9 Z" fill="var(--logo-primary)" opacity="0.9"/>
                <path d="M0,18 L-12,-9 L12,-9 Z" fill="var(--logo-primary)" opacity="0.9"/>

                <!-- Inner sacred circle -->
                <circle cx="0" cy="0" r="8" fill="none" stroke="var(--logo-accent)" stroke-width="2" opacity="0.8"/>

                <!-- Central bindu (source point) -->
                <circle cx="0" cy="0" r="3" fill="var(--logo-accent)"/>

                <!-- Tech nodes at cardinal points -->
                <g opacity="0.7">
                  <rect x="-1" y="-15" width="2" height="4" fill="var(--logo-accent)"/>
                  <rect x="-1" y="11" width="2" height="4" fill="var(--logo-accent)"/>
                  <rect x="11" y="-1" width="4" height="2" fill="var(--logo-accent)"/>
                  <rect x="-15" y="-1" width="4" height="2" fill="var(--logo-accent)"/>
                </g>
              </g>

              <!-- Corner Code Brackets -->
              <g opacity="0.6" stroke="var(--logo-primary)" stroke-width="1.5" fill="none">
                <path d="M20,20 L15,20 L15,25"/>
                <path d="M80,20 L85,20 L85,25"/>
                <path d="M20,80 L15,80 L15,75"/>
                <path d="M80,80 L85,80 L85,75"/>
              </g>
            </svg>
            <div class="logo-shine"></div>
          </div>
          <div class="title-group">
            <h1 class="luxury-title">DevYantra</h1>
            <span class="subtitle">Simple tools for everyday coding</span>
            <div class="privacy-features">
              <div class="free-badge">100% FREE</div>
              <div class="open-source-badge" @click="openGitHub" v-tooltip.bottom="'View source code on GitHub'" role="button" tabindex="0" @keydown.enter="openGitHub" @keydown.space="openGitHub">
                <svg class="github-logo" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Open Source</span>
              </div>
              <div class="privacy-badge" v-tooltip.top="'Privacy First: All your data is processed locally in your browser. Nothing is sent to our servers or stored anywhere else. Your sensitive information stays 100% private and secure.'">
                <i class="pi pi-shield"></i>
                <span>Privacy First</span>
              </div>
            </div>
          </div>
        </div>

        <div class="premium-controls">
          <router-link to="/feedback" class="feedback-btn" v-tooltip.bottom="'Share feedback and help improve DevYantra'">
            <i class="pi pi-comment"></i>
            <span class="feedback-text">Feedback</span>
          </router-link>

          <div class="theme-toggle-container">
            <span class="theme-label">Theme</span>
            <button class="theme-toggle-btn" @click="themeStore.toggleTheme" :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'">
              <i class="pi pi-sun theme-icon light-icon" :class="{ active: !themeStore.isDark }"></i>
              <i class="pi pi-moon theme-icon dark-icon" :class="{ active: themeStore.isDark }"></i>
              <div class="toggle-slider" :class="{ dark: themeStore.isDark }"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div id="main-content" class="main-content" role="main" tabindex="-1">
      <div class="content-wrapper glass-card">
        <RouterView />
      </div>
    </div>

    <!-- Premium Footer -->
    <AppFooter />

    <!-- Premium Toast -->
    <Toast position="top-right" class="luxury-toast" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useSEO } from '@/composables/useSEO'
import AppFooter from '@/components/AppFooter.vue'

const themeStore = useThemeStore()
const { preloadCriticalResources, trackCoreWebVitals } = useSEO()

const openGitHub = () => {
  window.open('https://github.com/sg-open/devyantra-ui', '_blank')
}

onMounted(() => {
  // Initialize SEO optimizations
  preloadCriticalResources()
  trackCoreWebVitals()

  // Set up viewport meta tag for mobile optimization
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover')
  }

  // Add theme-color meta tag for mobile browsers
  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColorMeta)
  }

  // Update theme color based on current theme
  const updateThemeColor = () => {
    const isDark = document.documentElement.classList.contains('dark')
    themeColorMeta?.setAttribute('content', isDark ? '#0f0f23' : '#ffffff')
  }

  updateThemeColor()

  // Watch for theme changes
  const observer = new MutationObserver(updateThemeColor)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
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
  color: white;
  padding: 8px 12px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 4px 0;
  transition: all 0.2s ease;
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
  overflow-x: hidden;
}

/* Luxury Background */
.background-patterns {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.pattern-layer-1 {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(212, 175, 55, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 70% 80%,
    rgba(15, 82, 186, 0.06) 0%,
    transparent 50%
  );
  animation: luxuryRotate 20s linear infinite;
}

.pattern-layer-2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 100px,
    rgba(255, 255, 255, 0.01) 100px,
    rgba(255, 255, 255, 0.01) 102px
  );
}

.luxury-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 60%;
  background: radial-gradient(
    ellipse at center,
    rgba(212, 175, 55, 0.05) 0%,
    transparent 70%
  );
  animation: breathe 6s ease-in-out infinite;
}

@keyframes luxuryRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
  50% { transform: translateX(-50%) scale(1.1); opacity: 0.8; }
}

/* Premium Toolbar */
.luxury-toolbar {
  margin: 0.75rem;
  margin-bottom: 0;
  padding: 0;
  border-radius: 16px;
  background: var(--glass-bg);
  border: 2px solid var(--glass-border);
  box-shadow: var(--shadow-luxury);
  backdrop-filter: blur(30px);
  position: relative;
  overflow: hidden;
}

.luxury-toolbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-gold);
  opacity: 0.8;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.25rem;
  min-height: 44px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-accent) 100%);
  box-shadow: var(--elevation-2);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.devyantra-logo {
  width: 32px;
  height: 32px;
  z-index: 2;
  position: relative;
  animation: yantraFloat 3s ease-in-out infinite;
}

@keyframes yantraFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}

.logo-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: logoSpin 3s linear infinite;
}

@keyframes logoSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.luxury-title {
  font-size: var(--text-fluid-xl); /* Fluid 19px-20px */
  font-weight: var(--font-weight-bold);
  font-family: var(--font-display);
  margin: 0;
  background: linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-shadow: none;
  white-space: nowrap;
  line-height: var(--leading-tight);
}

.subtitle {
  font-size: var(--text-xs); /* 12px */
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  white-space: nowrap;
  line-height: var(--leading-normal);
}

.privacy-features {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.free-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  background: linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-accent) 100%);
  color: white;
  font-size: var(--text-xs); /* 12px */
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  border-radius: var(--radius-md);
  box-shadow: var(--elevation-1);
  animation: freeBadgePulse 2s ease-in-out infinite;
}

.open-source-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs); /* 4px */
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  font-size: var(--text-xs); /* 12px */
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
  cursor: pointer;
  transition: all var(--transition-normal);
  user-select: none;
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
}

.open-source-badge:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.open-source-badge:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.open-source-badge:active {
  transform: translateY(0);
}

.github-logo {
  opacity: 0.9;
  flex-shrink: 0;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs); /* 4px */
  padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  background: var(--dt-success-light);
  border: 1px solid var(--dt-success);
  color: var(--dt-success);
  font-size: var(--text-xs); /* 12px */
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
  cursor: help;
  transition: all 0.2s ease;
}

.privacy-badge:hover {
  background: var(--dt-success);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.privacy-badge i {
  font-size: var(--text-sm); /* 14px */
  opacity: 0.9;
}

@keyframes freeBadgePulse {
  0%, 100% {
    box-shadow: var(--elevation-1);
    transform: scale(1);
  }
  50% {
    box-shadow: var(--elevation-2);
    transform: scale(1.02);
  }
}

/* Premium Controls */
.premium-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Feedback Button */
.feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  color: var(--text-color);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.feedback-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.feedback-btn:hover::before {
  left: 100%;
}

.feedback-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.feedback-btn i {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.feedback-btn:hover i {
  transform: scale(1.1);
}

.feedback-text {
  transition: all 0.3s ease;
}

.theme-toggle-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-label {
  font-size: var(--text-sm); /* 14px */
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
}

.theme-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  border: 2px solid var(--glass-border);
  border-radius: 25px;
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 70px;
  height: 36px;
  backdrop-filter: blur(10px);
}

.theme-toggle-btn:hover {
  border-color: var(--dt-brand);
  box-shadow: var(--elevation-2);
}

.theme-icon {
  position: relative;
  z-index: 2;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.light-icon {
  color: var(--logo-accent);
  opacity: 0.5;
}

.light-icon.active {
  color: var(--logo-accent);
  opacity: 1;
  text-shadow: 0 0 8px var(--logo-accent);
}

.dark-icon {
  color: var(--logo-primary);
  opacity: 0.5;
}

.dark-icon.active {
  color: var(--logo-primary);
  opacity: 1;
  text-shadow: 0 0 8px var(--logo-primary);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--logo-accent) 0%, var(--logo-primary) 100%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--elevation-1);
  z-index: 1;
}

.toggle-slider.dark {
  transform: translateX(32px);
  background: linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-accent) 100%);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 1400px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-luxury);
  position: relative;
}

.content-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gradient-gold);
  opacity: 0.3;
}

/* Premium Toast Styling */
:deep(.luxury-toast .p-toast-message) {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--shadow-luxury);
}

:deep(.luxury-toast .p-toast-message.p-toast-message-success) {
  border-left: 4px solid var(--luxury-emerald);
}

:deep(.luxury-toast .p-toast-message.p-toast-message-error) {
  border-left: 4px solid var(--luxury-ruby);
}

:deep(.luxury-toast .p-toast-message.p-toast-message-info) {
  border-left: 4px solid var(--luxury-sapphire);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .title-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .privacy-features {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .luxury-toolbar {
    margin: 0.5rem;
    margin-bottom: 0;
  }

  .toolbar-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    min-height: auto;
  }

  .app-title {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    width: 100%;
  }

  .title-group {
    align-items: center;
    text-align: center;
    width: 100%;
  }

  .logo-container {
    width: 50px;
    height: 50px;
  }

  .devyantra-logo {
    width: 40px;
    height: 40px;
  }

  .luxury-title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.7rem;
    text-align: center;
  }

  .privacy-features {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
  }

  .premium-controls {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;
  }

  .feedback-btn {
    padding: 0.4rem 0.8rem;
    font-size: var(--text-xs);
  }

  .feedback-text {
    display: none;
  }

  .theme-toggle-container {
    gap: 0.5rem;
  }

  .theme-label {
    font-size: 0.75rem;
  }

  .main-content {
    padding: 0.5rem;
  }

  .content-wrapper {
    padding: 1rem;
    border-radius: 16px;
  }

  .theme-toggle-btn {
    width: 60px;
    height: 32px;
    padding: 0.3rem;
  }

  .toggle-slider {
    width: 24px;
    height: 24px;
  }

  .toggle-slider.dark {
    transform: translateX(26px);
  }

  .theme-icon {
    font-size: 0.9rem;
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .luxury-toolbar {
    margin: 0.25rem;
    margin-bottom: 0;
  }

  .toolbar-content {
    padding: 0.75rem;
  }

  .luxury-title {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.65rem;
  }

  .privacy-features {
    gap: 0.25rem;
  }

  .free-badge,
  .open-source-badge,
  .privacy-badge {
    padding: 2px 6px;
    font-size: 10px;
  }

  .main-content {
    padding: 0.25rem;
  }

  .content-wrapper {
    padding: 0.75rem;
    border-radius: 12px;
  }

  .theme-toggle-btn {
    width: 50px;
    height: 28px;
  }

  .toggle-slider {
    width: 20px;
    height: 20px;
  }

  .toggle-slider.dark {
    transform: translateX(22px);
  }

  .theme-icon {
    font-size: 0.8rem;
    width: 16px;
    height: 16px;
  }
}
</style>
