import { ref, watch, type Ref } from 'vue'
import LZString from 'lz-string'
import type { DiffOptions } from './useDiff'

export interface ShareableState {
  leftText: string
  rightText: string
  options: Partial<DiffOptions>
  timestamp: number
  version: string
}

export interface ShareStateConfig {
  maxUrlLength: number
  compressionLevel: 'none' | 'base64' | 'lz'
  storageKey: string
  autoSave: boolean
  autoLoad: boolean
}

const DEFAULT_CONFIG: ShareStateConfig = {
  maxUrlLength: 8000, // Conservative limit for URL length
  compressionLevel: 'lz',
  storageKey: 'diffTool_state',
  autoSave: true,
  autoLoad: true
}

const CURRENT_VERSION = '1.0.0'

export function useShareState(
  leftText: Ref<string>,
  rightText: Ref<string>,
  options: Ref<Partial<DiffOptions>>,
  config: Partial<ShareStateConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  const shareUrl = ref('')

  // Compress state for URL/storage
  const compressState = (state: ShareableState): string => {
    const json = JSON.stringify(state)

    switch (mergedConfig.compressionLevel) {
      case 'lz':
        return LZString.compressToEncodedURIComponent(json)
      case 'base64':
        return btoa(encodeURIComponent(json))
      case 'none':
      default:
        return encodeURIComponent(json)
    }
  }

  // Decompress state from URL/storage
  const decompressState = (compressed: string): ShareableState | null => {
    try {
      let json: string

      switch (mergedConfig.compressionLevel) {
        case 'lz':
          json = LZString.decompressFromEncodedURIComponent(compressed) || ''
          break
        case 'base64':
          json = decodeURIComponent(atob(compressed))
          break
        case 'none':
        default:
          json = decodeURIComponent(compressed)
          break
      }

      if (!json) return null

      const state = JSON.parse(json) as ShareableState

      // Version compatibility check
      if (!state.version || state.version !== CURRENT_VERSION) {
        console.warn('State version mismatch, attempting to migrate...')
        return migrateState(state)
      }

      return state
    } catch (error) {
      console.error('Failed to decompress state:', error)
      return null
    }
  }

  // Simple state migration logic
  const migrateState = (state: unknown): ShareableState | null => {
    try {
      // Type guard to ensure state is an object with the expected properties
      if (!state || typeof state !== 'object') return null
      const stateObj = state as Record<string, unknown>

      return {
        leftText: (typeof stateObj.leftText === 'string' ? stateObj.leftText : '') || '',
        rightText: (typeof stateObj.rightText === 'string' ? stateObj.rightText : '') || '',
        options: (typeof stateObj.options === 'object' && stateObj.options ? stateObj.options as Record<string, unknown> : {}) || {},
        timestamp: (typeof stateObj.timestamp === 'number' ? stateObj.timestamp : Date.now()) || Date.now(),
        version: CURRENT_VERSION
      }
    } catch (error) {
      console.error('Failed to migrate state:', error)
      return null
    }
  }

  // Create shareable state object
  const createState = (): ShareableState => ({
    leftText: leftText.value,
    rightText: rightText.value,
    options: options.value,
    timestamp: Date.now(),
    version: CURRENT_VERSION
  })

  // Save to localStorage
  const saveToLocalStorage = () => {
    try {
      isSaving.value = true
      const state = createState()
      const compressed = compressState(state)
      localStorage.setItem(mergedConfig.storageKey, compressed)
      lastSaved.value = new Date()
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Load from localStorage
  const loadFromLocalStorage = (): boolean => {
    try {
      isLoading.value = true
      const stored = localStorage.getItem(mergedConfig.storageKey)
      if (!stored) return false

      const state = decompressState(stored)
      if (!state) return false

      // Apply loaded state
      leftText.value = state.leftText
      rightText.value = state.rightText
      options.value = { ...options.value, ...state.options }

      return true
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(mergedConfig.storageKey)
      lastSaved.value = null
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }

  // Generate shareable URL
  const generateShareUrl = (): string => {
    try {
      const state = createState()
      const compressed = compressState(state)

      const url = new URL(window.location.href)
      url.hash = compressed

      // Check URL length
      if (url.toString().length > mergedConfig.maxUrlLength) {
        console.warn('Share URL exceeds maximum length, consider using localStorage sharing instead')
        return ''
      }

      shareUrl.value = url.toString()
      return shareUrl.value
    } catch (error) {
      console.error('Failed to generate share URL:', error)
      return ''
    }
  }

  // Load from URL hash
  const loadFromUrl = (url?: string): boolean => {
    try {
      isLoading.value = true
      const targetUrl = url || window.location.href
      const urlObj = new URL(targetUrl)

      if (!urlObj.hash || urlObj.hash.length <= 1) {
        return false
      }

      const compressed = urlObj.hash.substring(1) // Remove #
      const state = decompressState(compressed)

      if (!state) return false

      // Apply loaded state
      leftText.value = state.leftText
      rightText.value = state.rightText
      options.value = { ...options.value, ...state.options }

      return true
    } catch (error) {
      console.error('Failed to load from URL:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Copy share URL to clipboard
  const copyShareUrl = async (): Promise<boolean> => {
    const url = generateShareUrl()
    if (!url) return false

    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch (error) {
      console.error('Failed to copy share URL:', error)
      return false
    }
  }

  // Get state size for debugging
  const getStateSize = (): { raw: number; compressed: number } => {
    const state = createState()
    const raw = JSON.stringify(state).length
    const compressed = compressState(state).length

    return { raw, compressed }
  }

  // Auto-save functionality
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  const debouncedSave = () => {
    if (!mergedConfig.autoSave) return

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      saveToLocalStorage()
    }, 1000) // 1 second debounce
  }

  // Watch for changes and auto-save
  if (mergedConfig.autoSave) {
    watch([leftText, rightText, options], debouncedSave, { deep: true })
  }

  // Auto-load on initialization
  if (mergedConfig.autoLoad) {
    // Try URL first, then localStorage
    if (!loadFromUrl()) {
      loadFromLocalStorage()
    }
  }

  // Clean up hash from URL after loading
  const cleanupUrl = () => {
    if (window.location.hash) {
      const url = new URL(window.location.href)
      url.hash = ''
      window.history.replaceState(null, '', url.toString())
    }
  }

  return {
    // State
    isLoading,
    isSaving,
    lastSaved,
    shareUrl,

    // localStorage methods
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,

    // URL sharing methods
    generateShareUrl,
    loadFromUrl,
    copyShareUrl,
    cleanupUrl,

    // Utility methods
    getStateSize,
    createState,
    compressState,
    decompressState
  }
}