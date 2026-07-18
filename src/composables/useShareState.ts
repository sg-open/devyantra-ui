import { ref, watch, type Ref } from 'vue'
import LZString from 'lz-string'

export interface DiffShareOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
}

export interface ShareableState {
  leftText: string
  rightText: string
  options: Partial<DiffShareOptions>
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

export type ShareResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'empty' | 'too-large' | 'clipboard-failed'; size?: number }

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
  options: Ref<Partial<DiffShareOptions>>,
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

      return validateState(JSON.parse(json))
    } catch (error) {
      console.error('Failed to decompress state:', error)
      return null
    }
  }

  // Strict validation: unknown versions and malformed payloads are rejected
  // (a lenient "migration" here used to blank both panes on garbage input).
  const validateState = (value: unknown): ShareableState | null => {
    if (!value || typeof value !== 'object') return null
    const obj = value as Record<string, unknown>
    if (obj.version !== CURRENT_VERSION) return null
    if (typeof obj.leftText !== 'string' || typeof obj.rightText !== 'string') return null

    const rawOptions =
      obj.options && typeof obj.options === 'object'
        ? (obj.options as Record<string, unknown>)
        : {}
    const options: Partial<DiffShareOptions> = {}
    if (typeof rawOptions.ignoreWhitespace === 'boolean') options.ignoreWhitespace = rawOptions.ignoreWhitespace
    if (typeof rawOptions.ignoreCase === 'boolean') options.ignoreCase = rawOptions.ignoreCase

    return {
      leftText: obj.leftText,
      rightText: obj.rightText,
      options,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
      version: CURRENT_VERSION
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

  const buildShareUrl = (): { url: string; length: number; tooLarge: boolean } => {
    const state = createState()
    const compressed = compressState(state)
    const url = new URL(window.location.href)
    url.hash = compressed
    const str = url.toString()
    return { url: str, length: str.length, tooLarge: str.length > mergedConfig.maxUrlLength }
  }

  // Generate shareable URL ('' when over the length cap — legacy contract)
  const generateShareUrl = (): string => {
    try {
      const built = buildShareUrl()
      if (built.tooLarge) {
        console.warn('Share URL exceeds maximum length, consider using localStorage sharing instead')
        return ''
      }
      shareUrl.value = built.url
      return built.url
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

  // Copy share URL to clipboard, reporting the outcome for UI feedback
  const copyShareUrl = async (): Promise<ShareResult> => {
    if (!leftText.value && !rightText.value) {
      return { ok: false, reason: 'empty' }
    }
    const built = buildShareUrl()
    if (built.tooLarge) {
      return { ok: false, reason: 'too-large', size: built.length }
    }
    shareUrl.value = built.url
    try {
      await navigator.clipboard.writeText(built.url)
      return { ok: true, url: built.url }
    } catch {
      return { ok: false, reason: 'clipboard-failed' }
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

  // Clean up hash from URL after loading
  const cleanupUrl = () => {
    if (window.location.hash) {
      const url = new URL(window.location.href)
      url.hash = ''
      window.history.replaceState(null, '', url.toString())
    }
  }

  const flushSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    saveToLocalStorage()
  }

  // Auto-load BEFORE registering the autosave watcher: restoring shared or
  // stored content must never count as a user edit (it used to overwrite the
  // visitor's own saved state within 1s of opening a share link).
  if (mergedConfig.autoLoad) {
    if (loadFromUrl()) {
      // Strip #hash so a reload restores the user's own state, not the link's
      cleanupUrl()
    } else {
      loadFromLocalStorage()
    }
  }

  // Watch for changes and auto-save (registered after restore on purpose)
  if (mergedConfig.autoSave) {
    watch([leftText, rightText, options], debouncedSave, { deep: true })
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
    flushSave,

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