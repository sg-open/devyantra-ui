import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DiffRenderer from '../DiffRenderer.vue'

// jsdom has no Worker implementation, so every compute here takes the
// synchronous setTimeout(0) fallback path — still async by one tick.
const flush = () => new Promise((r) => setTimeout(r, 5))

describe('DiffRenderer', () => {
  it('M12: patch action title names both files once known, and stays generic otherwise', async () => {
    const wrapper = mount(DiffRenderer, {
      props: { leftText: 'a\n', rightText: 'b\n' }
    })
    await flush()
    await nextTick()

    const copyBtn = wrapper.find('.diff-action-btn')
    expect(copyBtn.attributes('title')).toBe('Unified diff of the compared texts')

    await wrapper.setProps({ leftFilename: 'alpha.txt', rightFilename: 'beta.txt' })
    await nextTick()

    expect(wrapper.find('.diff-action-btn').attributes('title')).toBe(
      'Unified diff of the compared texts — exporting alpha.txt vs beta.txt'
    )
  })

  it('M12: one filename alone is not enough to name the export (matches buildDownloadFilename\'s both-or-neither gate)', async () => {
    const wrapper = mount(DiffRenderer, {
      props: { leftText: 'a\n', rightText: 'b\n', leftFilename: 'alpha.txt' }
    })
    await flush()
    await nextTick()

    expect(wrapper.find('.diff-action-btn').attributes('title')).toBe('Unified diff of the compared texts')
  })
})
