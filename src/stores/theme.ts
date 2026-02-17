import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'dark' | 'light'

export const useThemeStore = defineStore('theme', () => {
  const getInitialTheme = (): ThemeMode => {
    if (typeof window === 'undefined') return 'light'

    const stored = localStorage.getItem('devyantra-theme')
    if (stored === 'dark' || stored === 'light') {
      return stored
    }

    // Map removed themes to closest match
    if (stored === 'terminal-green' || stored === 'terminal-amber' || stored === 'terminal-blue') {
      return 'dark'
    }
    if (stored === 'retro-light') {
      return 'light'
    }

    // Default to light mode for first-time visitors
    return 'light'
  }

  const mode = ref<ThemeMode>(getInitialTheme())

  const isDark = computed(() => mode.value === 'dark')
  const theme = computed(() => mode.value)

  const toggleTheme = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    persistTheme()
    updateDocumentClass()
  }

  const setTheme = (dark: boolean) => {
    mode.value = dark ? 'dark' : 'light'
    persistTheme()
    updateDocumentClass()
  }

  const setMode = (newMode: ThemeMode) => {
    mode.value = newMode
    persistTheme()
    updateDocumentClass()
  }

  const persistTheme = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devyantra-theme', mode.value)
    }
  }

  const updateDocumentClass = () => {
    if (typeof window === 'undefined') return

    const html = document.documentElement

    // Remove all theme classes
    html.classList.remove('p-dark', 'app-dark')

    if (mode.value === 'dark') {
      html.classList.add('app-dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.setAttribute('data-theme', 'light')
    }

    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: theme.value, isDark: isDark.value, mode: mode.value }
    }))
  }

  // Initialize theme on store creation
  const initializeTheme = () => {
    updateDocumentClass()

    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        const stored = localStorage.getItem('devyantra-theme')
        if (stored === null) {
          setTheme(e.matches)
        }
      })
    }
  }

  initializeTheme()

  return {
    isDark,
    theme,
    mode,
    toggleTheme,
    setTheme,
    setMode,
    initializeTheme
  }
})
