import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): boolean => {
    if (typeof window === 'undefined') return true

    const stored = localStorage.getItem('devyantra-theme')
    if (stored !== null) {
      return stored === 'dark'
    }

    // Default to system preference, fallback to dark
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const isDark = ref(getInitialTheme())
  const theme = computed(() => (isDark.value ? 'dark' : 'light'))

  const toggleTheme = () => {
    isDark.value = !isDark.value
    persistTheme()
    updateDocumentClass()
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
    persistTheme()
    updateDocumentClass()
  }

  const persistTheme = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devyantra-theme', isDark.value ? 'dark' : 'light')
    }
  }

  const updateDocumentClass = () => {
    if (typeof window === 'undefined') return

    const html = document.documentElement

    // Remove old classes
    html.classList.remove('p-dark', 'app-dark')

    if (isDark.value) {
      html.classList.add('app-dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.setAttribute('data-theme', 'light')
    }

    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: theme.value, isDark: isDark.value }
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
    toggleTheme,
    setTheme,
    initializeTheme
  }
})