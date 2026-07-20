import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolActions from '../tool/ToolActions.vue'
import { useToast } from '@/composables/useToast'

describe('ToolActions', () => {
  beforeEach(() => {
    // Reset toast messages before each test
    const { messages } = useToast()
    messages.value.splice(0, messages.value.length)
  })

  it('renders copy button disabled when copyText is empty', () => {
    const wrapper = mount(ToolActions, {
      props: {
        copyText: ''
      }
    })
    const copyBtn = wrapper.find('.p-button-outlined')
    expect(copyBtn.exists()).toBe(true)
    expect(copyBtn.attributes('disabled')).toBeDefined()
  })

  it('renders copy button disabled when copyText is only whitespace', () => {
    const wrapper = mount(ToolActions, {
      props: {
        copyText: '   '
      }
    })
    const copyBtn = wrapper.find('.p-button-outlined')
    expect(copyBtn.attributes('disabled')).toBeDefined()
  })

  it('renders copy button enabled when copyText is provided', () => {
    const wrapper = mount(ToolActions, {
      props: {
        copyText: 'some text'
      }
    })
    const copyBtn = wrapper.find('.p-button-outlined')
    expect(copyBtn.attributes('disabled')).toBeUndefined()
  })

  it('calls copyWithFeedback and shows toast on copy click', async () => {
    const wrapper = mount(ToolActions, {
      props: {
        copyText: 'test content',
        copyLabel: 'MyResult'
      }
    })

    // Stub navigator.clipboard.writeText
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })

    const copyBtn = wrapper.find('.p-button-outlined')
    await copyBtn.trigger('click')

    // Check that toast message was added
    const { messages } = useToast()
    expect(messages.value.length).toBeGreaterThan(0)
    const toastMsg = messages.value[messages.value.length - 1]
    expect(toastMsg.summary).toBe('MyResult copied')
    expect(toastMsg.severity).toBe('success')
  })

  it('uses default copyLabel when not provided', async () => {
    const wrapper = mount(ToolActions, {
      props: {
        copyText: 'test content'
      }
    })

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })

    const copyBtn = wrapper.find('.p-button-outlined')
    await copyBtn.trigger('click')

    const { messages } = useToast()
    const toastMsg = messages.value[messages.value.length - 1]
    expect(toastMsg.summary).toBe('Result copied')
  })

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mount(ToolActions, {
      props: {
        clearLabel: 'Reset'
      }
    })

    const buttons = wrapper.findAll('.p-button-outlined')
    // Clear button should be the second button (after copy)
    const clearBtn = buttons[1]
    await clearBtn.trigger('click')

    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('uses default clearLabel when not provided', async () => {
    const wrapper = mount(ToolActions)

    const buttons = wrapper.findAll('.p-button-outlined')
    const clearBtn = buttons[1]
    expect(clearBtn.text()).toBe('Clear')
  })

  it('does not render sample button when sample prop is not provided', () => {
    const wrapper = mount(ToolActions)

    const buttons = wrapper.findAll('.p-button-outlined')
    // Should only have copy and clear buttons
    expect(buttons.length).toBe(2)
  })

  it('renders sample button when sample prop is provided', () => {
    const sample = vi.fn()
    const wrapper = mount(ToolActions, {
      props: {
        sample
      }
    })

    const buttons = wrapper.findAll('.p-button-outlined')
    // Should have copy, clear, and sample buttons
    expect(buttons.length).toBe(3)
  })

  it('calls sample function when sample button is clicked', async () => {
    const sample = vi.fn()
    const wrapper = mount(ToolActions, {
      props: {
        sample
      }
    })

    const buttons = wrapper.findAll('.p-button-outlined')
    const sampleBtn = buttons[2]
    await sampleBtn.trigger('click')

    expect(sample).toHaveBeenCalledTimes(1)
  })

  it('renders extra slot', () => {
    const wrapper = mount(ToolActions, {
      slots: {
        extra: '<button class="custom-btn">Custom</button>'
      }
    })

    expect(wrapper.find('.custom-btn').exists()).toBe(true)
    expect(wrapper.find('.custom-btn').text()).toBe('Custom')
  })

  it('has tool-actions root class', () => {
    const wrapper = mount(ToolActions)

    expect(wrapper.find('.tool-actions').exists()).toBe(true)
  })
})
