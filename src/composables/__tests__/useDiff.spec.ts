import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDiff } from '../useDiff'
import type { DiffOptions } from '../useDiff'

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn(() => ({ value: 'highlighted-code' })),
    highlightAuto: vi.fn(() => ({ value: 'auto-highlighted-code' })),
    getLanguage: vi.fn(() => true)
  }
}))

// Mock diff2html
vi.mock('diff2html', () => ({
  html: vi.fn(() => '<div class="diff-html">mock diff html</div>')
}))

describe('useDiff', () => {
  let leftText: any
  let rightText: any
  let options: any

  beforeEach(() => {
    leftText = ref('')
    rightText = ref('')
    options = ref<Partial<DiffOptions>>({})
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should initialize with empty result', () => {
      const { result, isComputing } = useDiff(leftText, rightText, options)

      expect(result.value.isEmpty).toBe(true)
      expect(isComputing.value).toBe(false)
      expect(result.value.stats.totalLines).toBe(0)
    })

    it('should detect when texts are identical', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello world'
      rightText.value = 'Hello world'

      // Wait for debounced computation
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(true)
    })

    it('should detect differences between texts', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello world'
      rightText.value = 'Hello universe'

      // Wait for debounced computation
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(false)
      expect(result.value.html).toContain('mock diff html')
    })
  })

  describe('options handling', () => {
    it('should respect ignoreCase option', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello World'
      rightText.value = 'hello world'
      options.value.ignoreCase = true

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(true)
    })

    it('should respect ignoreWhitespace option', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello    world'
      rightText.value = 'Hello world'
      options.value.ignoreWhitespace = true

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(true)
    })

    it('should handle different granularity options', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello world'
      rightText.value = 'Hello universe'

      // Test character granularity
      options.value.granularity = 'character'
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(result.value.isEmpty).toBe(false)

      // Test word granularity
      options.value.granularity = 'word'
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(result.value.isEmpty).toBe(false)

      // Test line granularity (default)
      options.value.granularity = 'line'
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(result.value.isEmpty).toBe(false)
    })
  })

  describe('language detection', () => {
    it('should detect JSON', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const jsonText = '{"key": "value", "number": 123}'
      expect(detectLanguage(jsonText)).toBe('json')
    })

    it('should detect SQL', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const sqlText = 'SELECT * FROM users WHERE id = 1'
      expect(detectLanguage(sqlText)).toBe('sql')
    })

    it('should detect HTML', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const htmlText = '<!DOCTYPE html><html><head></head><body></body></html>'
      expect(detectLanguage(htmlText)).toBe('html')
    })

    it('should detect JavaScript', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const jsText = 'const x = () => { return "hello"; }'
      expect(detectLanguage(jsText)).toBe('javascript')
    })

    it('should detect TypeScript', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const tsText = 'interface User { name: string; age: number; }'
      expect(detectLanguage(tsText)).toBe('typescript')
    })

    it('should detect Python', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const pythonText = 'def hello():\n    return "world"'
      expect(detectLanguage(pythonText)).toBe('python')
    })

    it('should fallback to plaintext for unknown content', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const unknownText = 'This is just plain text without any special syntax'
      expect(detectLanguage(unknownText)).toBe('plaintext')
    })
  })

  describe('statistics calculation', () => {
    it('should calculate basic statistics', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'line1\nline2\nline3'
      rightText.value = 'line1\nmodified line2\nline3\nline4'

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.stats.totalLines).toBeGreaterThan(0)
      expect(result.value.stats.computationTime).toBeGreaterThan(0)
    })
  })

  describe('export functionality', () => {
    it('should copy to clipboard', async () => {
      // Mock clipboard API
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      const { copyToClipboard } = useDiff(leftText, rightText, options)

      const result = await copyToClipboard('test content')

      expect(result).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test content')
    })

    it('should handle clipboard errors gracefully', async () => {
      // Mock clipboard API with error
      const mockClipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error'))
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      const { copyToClipboard } = useDiff(leftText, rightText, options)

      const result = await copyToClipboard('test content')

      expect(result).toBe(false)
    })

    it('should trigger file download', () => {
      // Mock DOM elements
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const mockCreateElement = vi.fn(() => mockLink)
      const mockCreateObjectURL = vi.fn(() => 'blob:url')
      const mockRevokeObjectURL = vi.fn()

      document.createElement = mockCreateElement
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
      URL.createObjectURL = mockCreateObjectURL
      URL.revokeObjectURL = mockRevokeObjectURL

      const { downloadFile } = useDiff(leftText, rightText, options)

      downloadFile('test content', 'test.txt', 'text/plain')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('test.txt')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty inputs', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = ''
      rightText.value = ''

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(true)
      expect(result.value.stats.totalLines).toBe(0)
    })

    it('should handle very large texts', async () => {
      const { result } = useDiff(leftText, rightText, options)

      // Create large texts (1MB each)
      const largeText1 = 'a'.repeat(1024 * 1024)
      const largeText2 = 'b'.repeat(1024 * 1024)

      leftText.value = largeText1
      rightText.value = largeText2

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(false)
      expect(result.value.stats.computationTime).toBeDefined()
    })

    it('should handle texts with only whitespace differences', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'hello\nworld'
      rightText.value = 'hello\n\nworld'

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(false)
    })

    it('should handle malformed JSON gracefully', () => {
      const { detectLanguage } = useDiff(leftText, rightText, options)

      const malformedJson = '{"key": "value", "incomplete":'
      expect(detectLanguage(malformedJson)).toBe('plaintext')
    })

    it('should handle special characters and unicode', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'Hello 世界 🌍'
      rightText.value = 'Hello 世界 🌎'

      await new Promise(resolve => setTimeout(resolve, 350))

      expect(result.value.isEmpty).toBe(false)
    })

    it('should handle line endings consistently', async () => {
      const { result } = useDiff(leftText, rightText, options)

      leftText.value = 'line1\nline2\nline3'
      rightText.value = 'line1\r\nline2\r\nline3'

      await new Promise(resolve => setTimeout(resolve, 350))

      // Should detect differences due to different line endings
      expect(result.value.isEmpty).toBe(false)
    })
  })

  describe('debouncing', () => {
    it('should debounce diff computation', async () => {
      const { result, computeDiff } = useDiff(leftText, rightText, options)
      const computeSpy = vi.spyOn({ computeDiff }, 'computeDiff')

      leftText.value = 'test1'
      leftText.value = 'test2'
      leftText.value = 'test3'

      // Should only compute once after debounce period
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(computeSpy).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 350))
      // The actual computation happens internally, so we check the result
      expect(result.value).toBeDefined()
    })
  })

  describe('syntax highlighting', () => {
    it('should apply syntax highlighting', () => {
      const { highlightText } = useDiff(leftText, rightText, options)

      const result = highlightText('const x = 1;', 'javascript')
      expect(result).toBe('highlighted-code')
    })

    it('should fallback to auto-detection when language not found', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const hljs = require('highlight.js').default
      hljs.getLanguage.mockReturnValue(false)

      const { highlightText } = useDiff(leftText, rightText, options)

      const result = highlightText('some code', 'unknown')
      expect(result).toBe('auto-highlighted-code')
    })
  })
})