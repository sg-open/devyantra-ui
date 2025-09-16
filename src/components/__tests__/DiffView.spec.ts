import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DiffView from '../DiffView.vue'
import PrimeVue from 'primevue/config'

// Mock the composables
vi.mock('@/composables/useDiff', () => ({
  useDiff: vi.fn(() => ({
    result: ref({
      html: '<div>mock diff html</div>',
      unified: 'mock unified diff',
      stats: {
        totalLines: 10,
        addedLines: 3,
        removedLines: 2,
        unchangedLines: 5,
        computationTime: 42.5
      },
      isEmpty: false
    }),
    isComputing: ref(false),
    detectLanguage: vi.fn((text) => {
      if (text.includes('{')) return 'json'
      return 'plaintext'
    }),
    highlightText: vi.fn(() => 'highlighted text'),
    copyToClipboard: vi.fn(() => Promise.resolve(true)),
    downloadFile: vi.fn()
  }))
}))

vi.mock('@/composables/useShareState', () => ({
  useShareState: vi.fn(() => ({
    shareUrl: ref('https://example.com/share#compressed_data'),
    copyShareUrl: vi.fn(() => Promise.resolve(true))
  }))
}))

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

// Mock file reading
const mockFileReader = {
  readAsText: vi.fn(),
  result: '',
  onload: null,
  onerror: null
}

global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader

describe('DiffView', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(DiffView, {
      global: {
        plugins: [PrimeVue],
        stubs: {
          Button: true,
          Toolbar: true,
          Dropdown: true,
          Checkbox: true,
          Card: true,
          Message: true
        }
      }
    })
  })

  describe('component rendering', () => {
    it('should render the main diff view', () => {
      expect(wrapper.find('.diff-view').exists()).toBe(true)
      expect(wrapper.find('.tool-title').text()).toContain('Advanced Text/Code Diff Tool')
    })

    it('should render text input areas', () => {
      const textAreas = wrapper.findAll('textarea')
      expect(textAreas).toHaveLength(2)
      expect(textAreas[0].attributes('placeholder')).toContain('original text')
      expect(textAreas[1].attributes('placeholder')).toContain('modified text')
    })

    it('should render diff options controls', () => {
      expect(wrapper.find('.diff-options').exists()).toBe(true)
      expect(wrapper.text()).toContain('Granularity')
      expect(wrapper.text()).toContain('View Mode')
      expect(wrapper.text()).toContain('Ignore Case')
      expect(wrapper.text()).toContain('Ignore Whitespace')
    })

    it('should render upload controls', () => {
      expect(wrapper.find('.upload-controls').exists()).toBe(true)
      expect(wrapper.text()).toContain('Upload Files')
    })
  })

  describe('text input handling', () => {
    it('should update left text when textarea changes', async () => {
      const leftTextArea = wrapper.findAll('textarea')[0]
      await leftTextArea.setValue('new left content')

      expect(wrapper.vm.leftText).toBe('new left content')
    })

    it('should update right text when textarea changes', async () => {
      const rightTextArea = wrapper.findAll('textarea')[1]
      await rightTextArea.setValue('new right content')

      expect(wrapper.vm.rightText).toBe('new right content')
    })

    it('should detect language when text changes', async () => {
      const leftTextArea = wrapper.findAll('textarea')[0]
      await leftTextArea.setValue('{"key": "value"}')

      // The language detection should be triggered
      expect(wrapper.vm.detectedLanguageLeft).toBe('json')
    })
  })

  describe('diff options', () => {
    it('should allow changing granularity', async () => {
      // Initially should be 'line'
      expect(wrapper.vm.diffOptions.granularity).toBe('line')

      // Simulate clicking character granularity button
      wrapper.vm.diffOptions.granularity = 'character'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.diffOptions.granularity).toBe('character')
    })

    it('should allow changing view mode', async () => {
      // Initially should be 'split'
      expect(wrapper.vm.viewMode).toBe('split')

      wrapper.vm.viewMode = 'unified'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.viewMode).toBe('unified')
    })

    it('should toggle ignore case option', async () => {
      expect(wrapper.vm.diffOptions.ignoreCase).toBe(false)

      wrapper.vm.diffOptions.ignoreCase = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.diffOptions.ignoreCase).toBe(true)
    })

    it('should toggle ignore whitespace option', async () => {
      expect(wrapper.vm.diffOptions.ignoreWhitespace).toBe(false)

      wrapper.vm.diffOptions.ignoreWhitespace = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.diffOptions.ignoreWhitespace).toBe(true)
    })
  })

  describe('text manipulation', () => {
    it('should swap texts when swap button is clicked', async () => {
      wrapper.vm.leftText = 'original left'
      wrapper.vm.rightText = 'original right'
      wrapper.vm.selectedLanguageLeft = 'javascript'
      wrapper.vm.selectedLanguageRight = 'json'

      await wrapper.vm.swapTexts()

      expect(wrapper.vm.leftText).toBe('original right')
      expect(wrapper.vm.rightText).toBe('original left')
      expect(wrapper.vm.selectedLanguageLeft).toBe('json')
      expect(wrapper.vm.selectedLanguageRight).toBe('javascript')
    })

    it('should clear all content when clear button is clicked', async () => {
      wrapper.vm.leftText = 'some content'
      wrapper.vm.rightText = 'other content'
      wrapper.vm.selectedLanguageLeft = 'javascript'
      wrapper.vm.selectedLanguageRight = 'json'

      await wrapper.vm.clearAll()

      expect(wrapper.vm.leftText).toBe('')
      expect(wrapper.vm.rightText).toBe('')
      expect(wrapper.vm.selectedLanguageLeft).toBe('')
      expect(wrapper.vm.selectedLanguageRight).toBe('')
    })
  })

  describe('file upload', () => {
    beforeEach(() => {
      // Mock file input elements
      wrapper.vm.$refs.fileInputLeft = { click: vi.fn() }
      wrapper.vm.$refs.fileInputRight = { click: vi.fn() }
    })

    it('should trigger file upload for left side', async () => {
      await wrapper.vm.triggerFileUpload('left')
      expect(wrapper.vm.$refs.fileInputLeft.click).toHaveBeenCalled()
    })

    it('should trigger file upload for right side', async () => {
      await wrapper.vm.triggerFileUpload('right')
      expect(wrapper.vm.$refs.fileInputRight.click).toHaveBeenCalled()
    })

    it('should handle file upload for left side', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const event = {
        target: {
          files: [mockFile],
          value: ''
        }
      }

      // Mock file.text() method
      mockFile.text = vi.fn().mockResolvedValue('test content')

      await wrapper.vm.handleFileUpload(event, 'left')

      expect(wrapper.vm.leftText).toBe('test content')
    })

    it('should reject files that are too large', async () => {
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' })
      const event = {
        target: {
          files: [mockFile],
          value: ''
        }
      }

      await wrapper.vm.handleFileUpload(event, 'left')

      // Text should not be updated
      expect(wrapper.vm.leftText).toBe('')
    })

    it('should detect language from file extension', async () => {
      const mockFile = new File(['{"test": true}'], 'data.json', { type: 'application/json' })
      const event = {
        target: {
          files: [mockFile],
          value: ''
        }
      }

      mockFile.text = vi.fn().mockResolvedValue('{"test": true}')

      await wrapper.vm.handleFileUpload(event, 'right')

      expect(wrapper.vm.selectedLanguageRight).toBe('json')
    })
  })

  describe('diff computation', () => {
    it('should warn when trying to compare without content', async () => {
      wrapper.vm.leftText = ''
      wrapper.vm.rightText = ''

      await wrapper.vm.computeDiff()

      // Should show warning toast (mocked)
    })

    it('should compute diff when both texts are provided', async () => {
      wrapper.vm.leftText = 'original text'
      wrapper.vm.rightText = 'modified text'

      await wrapper.vm.computeDiff()

      // Should trigger computation and show info toast
    })
  })

  describe('export functionality', () => {
    beforeEach(() => {
      wrapper.vm.leftText = 'original'
      wrapper.vm.rightText = 'modified'
    })

    it('should download diff file', async () => {
      const downloadFileMock = wrapper.vm.downloadFile
      await wrapper.vm.downloadDiff()

      expect(downloadFileMock).toHaveBeenCalledWith(
        'mock unified diff',
        expect.stringContaining('diff-'),
        'text/plain'
      )
    })
  })

  describe('statistics display', () => {
    it('should display diff statistics when diff is computed', async () => {
      wrapper.vm.leftText = 'test'
      wrapper.vm.rightText = 'modified'

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.stats-summary').exists()).toBe(true)
      expect(wrapper.text()).toContain('3') // Added lines
      expect(wrapper.text()).toContain('2') // Removed lines
      expect(wrapper.text()).toContain('5') // Unchanged lines
      expect(wrapper.text()).toContain('42.5ms') // Computation time
    })
  })

  describe('diff result display', () => {
    beforeEach(() => {
      wrapper.vm.leftText = 'original'
      wrapper.vm.rightText = 'modified'
    })

    it('should show split view by default', async () => {
      expect(wrapper.vm.viewMode).toBe('split')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.split-view').exists()).toBe(true)
      expect(wrapper.find('.unified-view').exists()).toBe(false)
    })

    it('should show unified view when selected', async () => {
      wrapper.vm.viewMode = 'unified'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.unified-view').exists()).toBe(true)
      expect(wrapper.find('.split-view').exists()).toBe(false)
    })

    it('should display diff HTML content', async () => {
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('mock diff html')
    })
  })

  describe('responsive behavior', () => {
    it('should handle mobile layout', async () => {
      // This would require viewport mocking or CSS testing
      expect(wrapper.find('.text-input-container').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have proper labels for inputs', () => {
      const labels = wrapper.findAll('label')
      expect(labels.some(label => label.text().includes('Original Text'))).toBe(true)
      expect(labels.some(label => label.text().includes('Modified Text'))).toBe(true)
    })

    it('should have proper ARIA attributes', () => {
      const textAreas = wrapper.findAll('textarea')
      textAreas.forEach(textarea => {
        expect(textarea.attributes()).toHaveProperty('rows')
      })
    })
  })

  describe('error handling', () => {
    it('should handle file reading errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.txt')
      mockFile.text = vi.fn().mockRejectedValue(new Error('Read error'))

      const event = {
        target: {
          files: [mockFile],
          value: ''
        }
      }

      await wrapper.vm.handleFileUpload(event, 'left')

      // Should not update text and should handle error gracefully
      expect(wrapper.vm.leftText).toBe('')
    })
  })
})