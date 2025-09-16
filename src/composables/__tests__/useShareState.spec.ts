import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useShareState } from '../useShareState'
import type { DiffOptions } from '../useDiff'

// Mock LZ-string
vi.mock('lz-string', () => ({
  default: {
    compressToEncodedURIComponent: vi.fn((str) => `compressed_${btoa(str)}`),
    decompressFromEncodedURIComponent: vi.fn((str) => {
      if (str.startsWith('compressed_')) {
        return atob(str.replace('compressed_', ''))
      }
      return null
    })
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn()
}
Object.assign(navigator, { clipboard: mockClipboard })

// Mock URL
const originalURL = global.URL
const mockLocation = {
  href: 'https://example.com/diff',
  hash: ''
}
Object.defineProperty(window, 'location', { value: mockLocation })

// Mock history API
const mockHistory = {
  replaceState: vi.fn()
}
Object.defineProperty(window, 'history', { value: mockHistory })

describe('useShareState', () => {
  let leftText: any
  let rightText: any
  let options: any

  beforeEach(() => {
    leftText = ref('')
    rightText = ref('')
    options = ref<Partial<DiffOptions>>({})
    vi.clearAllMocks()

    // Reset location mock
    mockLocation.href = 'https://example.com/diff'
    mockLocation.hash = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('localStorage operations', () => {
    it('should save state to localStorage', () => {
      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'original text'
      rightText.value = 'modified text'
      options.value = { ignoreCase: true }

      const result = shareState.saveToLocalStorage()

      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should load state from localStorage', () => {
      const mockCompressedState = 'compressed_' + btoa(JSON.stringify({
        leftText: 'loaded left',
        rightText: 'loaded right',
        options: { ignoreCase: true },
        timestamp: Date.now(),
        version: '1.0.0'
      }))

      mockLocalStorage.getItem.mockReturnValue(mockCompressedState)

      const shareState = useShareState(leftText, rightText, options, {
        autoLoad: false // Disable auto-load for manual testing
      })

      const result = shareState.loadFromLocalStorage()

      expect(result).toBe(true)
      expect(leftText.value).toBe('loaded left')
      expect(rightText.value).toBe('loaded right')
      expect(options.value.ignoreCase).toBe(true)
    })

    it('should handle missing localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const shareState = useShareState(leftText, rightText, options, {
        autoLoad: false
      })

      const result = shareState.loadFromLocalStorage()

      expect(result).toBe(false)
    })

    it('should clear localStorage', () => {
      const shareState = useShareState(leftText, rightText, options)

      const result = shareState.clearLocalStorage()

      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    it('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test'
      const result = shareState.saveToLocalStorage()

      expect(result).toBe(false)
    })
  })

  describe('URL sharing', () => {
    it('should generate share URL', () => {
      global.URL = class MockURL {
        href: string
        hash: string

        constructor(url: string) {
          this.href = url
          this.hash = ''
        }

        toString() {
          return this.href + this.hash
        }
      } as any

      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test left'
      rightText.value = 'test right'

      const url = shareState.generateShareUrl()

      expect(url).toContain('https://example.com/diff#compressed_')
    })

    it('should load state from URL', () => {
      const mockState = {
        leftText: 'url left',
        rightText: 'url right',
        options: { granularity: 'word' },
        timestamp: Date.now(),
        version: '1.0.0'
      }
      const mockCompressed = 'compressed_' + btoa(JSON.stringify(mockState))

      const shareState = useShareState(leftText, rightText, options, {
        autoLoad: false
      })

      const testUrl = `https://example.com/diff#${mockCompressed}`
      const result = shareState.loadFromUrl(testUrl)

      expect(result).toBe(true)
      expect(leftText.value).toBe('url left')
      expect(rightText.value).toBe('url right')
      expect(options.value.granularity).toBe('word')
    })

    it('should handle malformed URL hash', () => {
      const shareState = useShareState(leftText, rightText, options, {
        autoLoad: false
      })

      const testUrl = 'https://example.com/diff#invalid_hash'
      const result = shareState.loadFromUrl(testUrl)

      expect(result).toBe(false)
    })

    it('should copy share URL to clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)

      global.URL = class MockURL {
        href: string
        hash: string

        constructor(url: string) {
          this.href = url
          this.hash = ''
        }

        toString() {
          return this.href + this.hash
        }
      } as any

      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test'
      const result = await shareState.copyShareUrl()

      expect(result).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    it('should handle URL length limit', () => {
      const shareState = useShareState(leftText, rightText, options, {
        maxUrlLength: 50 // Very small limit
      })

      // Set large content that will exceed URL limit
      leftText.value = 'a'.repeat(1000)
      rightText.value = 'b'.repeat(1000)

      const url = shareState.generateShareUrl()

      expect(url).toBe('')
    })

    it('should clean up URL hash', () => {
      mockLocation.hash = '#some-hash'

      const shareState = useShareState(leftText, rightText, options)

      shareState.cleanupUrl()

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        null,
        '',
        'https://example.com/diff'
      )
    })
  })

  describe('state compression and decompression', () => {
    it('should compress and decompress state correctly', () => {
      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test left'
      rightText.value = 'test right'
      options.value = { ignoreCase: true }

      const state = shareState.createState()
      const compressed = shareState.compressState(state)
      const decompressed = shareState.decompressState(compressed)

      expect(decompressed).toEqual(expect.objectContaining({
        leftText: 'test left',
        rightText: 'test right',
        options: { ignoreCase: true }
      }))
    })

    it('should handle different compression levels', () => {
      const configs = [
        { compressionLevel: 'lz' as const },
        { compressionLevel: 'base64' as const },
        { compressionLevel: 'none' as const }
      ]

      configs.forEach((config) => {
        const shareState = useShareState(leftText, rightText, options, config)

        leftText.value = 'test'
        rightText.value = 'modified'

        const state = shareState.createState()
        const compressed = shareState.compressState(state)
        const decompressed = shareState.decompressState(compressed)

        expect(decompressed?.leftText).toBe('test')
        expect(decompressed?.rightText).toBe('modified')
      })
    })

    it('should handle state version migration', () => {
      const shareState = useShareState(leftText, rightText, options)

      // Create old version state (without version field)
      const oldState = {
        leftText: 'old left',
        rightText: 'old right',
        options: {},
        timestamp: Date.now()
        // No version field
      }

      const decompressed = shareState.decompressState(
        shareState.compressState(oldState as any)
      )

      expect(decompressed?.version).toBe('1.0.0')
      expect(decompressed?.leftText).toBe('old left')
    })
  })

  describe('utility methods', () => {
    it('should get state size information', () => {
      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test content'
      rightText.value = 'modified content'

      const sizes = shareState.getStateSize()

      expect(sizes.raw).toBeGreaterThan(0)
      expect(sizes.compressed).toBeGreaterThan(0)
      expect(typeof sizes.raw).toBe('number')
      expect(typeof sizes.compressed).toBe('number')
    })

    it('should create state snapshot', () => {
      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'left text'
      rightText.value = 'right text'
      options.value = { granularity: 'character' }

      const state = shareState.createState()

      expect(state.leftText).toBe('left text')
      expect(state.rightText).toBe('right text')
      expect(state.options.granularity).toBe('character')
      expect(state.version).toBe('1.0.0')
      expect(typeof state.timestamp).toBe('number')
    })
  })

  describe('auto-save functionality', () => {
    it('should auto-save when content changes', async () => {
      const shareState = useShareState(leftText, rightText, options, {
        autoSave: true
      })

      leftText.value = 'auto-save test'

      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should not auto-save when disabled', async () => {
      const shareState = useShareState(leftText, rightText, options, {
        autoSave: false
      })

      leftText.value = 'no auto-save'

      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle decompression errors gracefully', () => {
      const shareState = useShareState(leftText, rightText, options)

      const result = shareState.decompressState('invalid_compressed_data')

      expect(result).toBe(null)
    })

    it('should handle clipboard errors', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))

      const shareState = useShareState(leftText, rightText, options)

      leftText.value = 'test'
      const result = await shareState.copyShareUrl()

      expect(result).toBe(false)
    })
  })

  afterEach(() => {
    global.URL = originalURL
  })
})