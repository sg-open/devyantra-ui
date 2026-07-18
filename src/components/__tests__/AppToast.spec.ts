import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppToast from '../AppToast.vue'
import { useToast } from '@/composables/useToast'

describe('AppToast actions', () => {
  beforeEach(() => {
    const { messages } = useToast()
    messages.value.splice(0, messages.value.length)
  })

  it('renders an action button and runs the handler, then dismisses', async () => {
    const wrapper = mount(AppToast)
    const handler = vi.fn()
    const { add, messages } = useToast()

    add({ severity: 'info', summary: 'Cleared', action: { label: 'Undo', handler } })
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('.toast-action')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Undo')

    await btn.trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(messages.value).toHaveLength(0) // dismissed after action
  })

  it('renders no action button for plain toasts', async () => {
    const wrapper = mount(AppToast)
    const { add } = useToast()
    add({ severity: 'success', summary: 'Copied' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast-action').exists()).toBe(false)
  })
})
