import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JsonTreeNode from '../JsonTreeNode.vue'
import type { JsonNode } from '@/lib/jsonModel'

// Builds a flat array node with `n` number-leaf children — enough to drive
// JsonTreeNode's own render-cap logic without going through the full
// jsonModel parser (irrelevant here; only the tree SHAPE matters).
function makeArrayNode(n: number, path = '$'): JsonNode {
  const children: JsonNode[] = Array.from({ length: n }, (_, i) => ({
    key: String(i),
    path: `${path}[${i}]`,
    type: 'number',
    preview: String(i),
    size: String(i).length
  }))
  return { key: null, path, type: 'array', children, preview: `[${n} items]`, size: 2 }
}

const emptySets = { searchMatches: new Set<string>(), searchExpand: new Set<string>() }

describe('JsonTreeNode — F1: bounded render of large arrays', () => {
  it('a node with > 200 children starts collapsed even at depth <= 2 (default-expand rule amendment)', () => {
    const node = makeArrayNode(300)
    const wrapper = mount(JsonTreeNode, {
      props: { node, depth: 1, isArrayItem: false, ...emptySets }
    })

    expect(wrapper.find('.jx-toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.jx-children').exists()).toBe(false)
  })

  it('a node with <= 200 children still auto-expands at depth <= 2 (existing behavior preserved)', () => {
    const node = makeArrayNode(150)
    const wrapper = mount(JsonTreeNode, {
      props: { node, depth: 2, isArrayItem: false, ...emptySets }
    })

    expect(wrapper.find('.jx-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.jx-children').exists()).toBe(true)
    expect(wrapper.findAll('.jx-children > .jx-node')).toHaveLength(150)
  })

  it('an expanded node with 2,500 children renders only 1,000 rows plus a "show more" row, and clicking it reveals the next 1,000', async () => {
    const node = makeArrayNode(2500)
    const wrapper = mount(JsonTreeNode, {
      props: { node, depth: 0, isArrayItem: false, ...emptySets }
    })

    // 2500 > 200 -> starts collapsed even at depth 0; expand by hand to
    // reach the render-cap logic under test.
    expect(wrapper.find('.jx-children').exists()).toBe(false)
    await wrapper.find('.jx-toggle').trigger('click')

    const rows = () => wrapper.findAll('.jx-children > .jx-node')
    expect(rows()).toHaveLength(1000)

    const moreButton = wrapper.find('.jx-more')
    expect(moreButton.exists()).toBe(true)
    expect(moreButton.text()).toBe('Show 1,000 more (1,500 remaining)')

    await moreButton.trigger('click')
    expect(rows()).toHaveLength(2000)

    const secondMoreButton = wrapper.find('.jx-more')
    expect(secondMoreButton.exists()).toBe(true)
    expect(secondMoreButton.text()).toBe('Show 500 more (500 remaining)')

    await secondMoreButton.trigger('click')
    expect(rows()).toHaveLength(2500)
    expect(wrapper.find('.jx-more').exists()).toBe(false)
  })

  it('a node with exactly 1,000 children (or fewer) never shows a "show more" row', () => {
    const node = makeArrayNode(1000)
    const wrapper = mount(JsonTreeNode, {
      // depth 3 so the >200-children collapse rule is moot either way —
      // force-open via a click to inspect the fully-expanded render.
      props: { node, depth: 0, isArrayItem: false, ...emptySets }
    })
    // 1000 children > 200 -> starts collapsed; expand to check the render cap.
    return wrapper.find('.jx-toggle').trigger('click').then(() => {
      expect(wrapper.findAll('.jx-children > .jx-node')).toHaveLength(1000)
      expect(wrapper.find('.jx-more').exists()).toBe(false)
    })
  })

  it('a search match beyond the current page grows the page to reveal it, never a force-expanded-but-unmounted match (verifier follow-up)', async () => {
    const node = makeArrayNode(1500)
    const wrapper = mount(JsonTreeNode, {
      props: { node, depth: 0, isArrayItem: false, ...emptySets }
    })

    // 1,500 > 200 -> starts collapsed, nothing mounted yet.
    expect(wrapper.find('.jx-children').exists()).toBe(false)

    // A search lands on child [1200] — beyond the 1,000-row first page.
    // searchExpand carries this node's own path (as searchJsonTree always
    // does for a match's ancestors), so the node force-expands...
    await wrapper.setProps({
      searchMatches: new Set(['$[1200]']),
      searchExpand: new Set(['$'])
    })

    // ...and the matched row must actually be MOUNTED, not silently absent
    // beyond the page boundary: visibleCount grows to cover the highest
    // searched direct-child index.
    expect(wrapper.find('.jx-children').exists()).toBe(true)
    expect(wrapper.find('.jx-value[data-path="$[1200]"]').exists()).toBe(true)
    expect(wrapper.findAll('.jx-children > .jx-node')).toHaveLength(1201)

    // Paging still works past the grown boundary.
    expect(wrapper.find('.jx-more').text()).toBe('Show 299 more (299 remaining)')
  })
})
