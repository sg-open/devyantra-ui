import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffView from '../DiffView.vue'
import { tooltip } from '@/directives/tooltip'

// Mock the toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    messages: { value: [] },
    add: vi.fn(),
    remove: vi.fn()
  })
}))

// Mock DiffRenderer component
vi.mock('@/components/DiffRenderer.vue', () => ({
  default: {
    name: 'DiffRenderer',
    template: '<div class="diff-renderer-mock">mock diff renderer</div>',
    props: ['leftText', 'rightText', 'mode', 'ignoreWhitespace', 'ignoreCase', 'language', 'virtualScrollEnabled']
  }
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
        directives: {
          tooltip
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

    it('should render upload controls', () => {
      expect(wrapper.find('.upload-controls').exists()).toBe(true)
      expect(wrapper.text()).toContain('Upload Files')
    })

    it('should render action toolbar', () => {
      expect(wrapper.find('.p-toolbar').exists()).toBe(true)
      expect(wrapper.text()).toContain('Find Differences')
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

      expect(wrapper.vm.detectedLanguageLeft).toBe('json')
    })
  })

  describe('diff options', () => {
    it('should allow changing view mode', async () => {
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
    it('should handle file upload for left side', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const event = {
        target: {
          files: [mockFile],
          value: ''
        }
      }

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

  describe('diff display', () => {
    it('should not show diff results initially', () => {
      expect(wrapper.vm.showDiff).toBe(false)
      expect(wrapper.find('.diff-results').exists()).toBe(false)
    })

    it('should show diff renderer when showDiff is true and texts have content', async () => {
      wrapper.vm.leftText = 'original text'
      wrapper.vm.rightText = 'modified text'
      wrapper.vm.showDiff = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.diff-results').exists()).toBe(true)
    })

    it('should disable compare button when texts are empty', () => {
      const compareBtn = wrapper.find('.compare-btn')
      expect(compareBtn.attributes('disabled')).toBeDefined()
    })

    it('should enable compare button when both texts have content', async () => {
      wrapper.vm.leftText = 'some text'
      wrapper.vm.rightText = 'other text'
      await wrapper.vm.$nextTick()

      const compareBtn = wrapper.find('.compare-btn')
      expect(compareBtn.attributes('disabled')).toBeUndefined()
    })
  })

  describe('responsive behavior', () => {
    it('should handle mobile layout', () => {
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

      expect(wrapper.vm.leftText).toBe('')
    })
  })
})
