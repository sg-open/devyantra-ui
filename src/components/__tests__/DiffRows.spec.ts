import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffRows from '../diff/DiffRows.vue'
import DiffIndicators from '../diff/DiffIndicators.vue'
import type { DiffRow } from '@/lib/diff/model'
import type { Indicator } from '@/lib/diff/normalize'

describe('DiffRows — unified mode', () => {
  const rows: DiffRow[] = [
    { kind: 'context', leftNo: 1, rightNo: 1, text: 'unchanged line' },
    {
      kind: 'removed',
      leftNo: 2,
      text: 'foo bar',
      segments: [
        { text: 'foo ', changed: false },
        { text: 'bar', changed: true }
      ]
    },
    {
      kind: 'added',
      rightNo: 2,
      text: 'foo baz',
      segments: [
        { text: 'foo ', changed: false },
        { text: 'baz', changed: true }
      ]
    },
    { kind: 'context', leftNo: 3, rightNo: 3, text: 'trailing line' }
  ]

  it('renders row order, kind classes, gutter numbers, and changed-segment spans', () => {
    const wrapper = mount(DiffRows, {
      props: { rows, mode: 'unified', activeRowIndex: null }
    })

    const rowEls = wrapper.findAll('.dv-row')
    expect(rowEls).toHaveLength(4)
    expect(rowEls[0]!.classes()).toContain('dv-row--context')
    expect(rowEls[1]!.classes()).toContain('dv-row--removed')
    expect(rowEls[2]!.classes()).toContain('dv-row--added')
    expect(rowEls[3]!.classes()).toContain('dv-row--context')

    // unified always shows both gutters (leftNo, rightNo), blank where not applicable
    const contextGutters = rowEls[0]!.findAll('.dv-gutter')
    expect(contextGutters[0]!.text()).toBe('1')
    expect(contextGutters[1]!.text()).toBe('1')

    const removedGutters = rowEls[1]!.findAll('.dv-gutter')
    expect(removedGutters[0]!.text()).toBe('2')
    expect(removedGutters[1]!.text()).toBe('')

    const addedGutters = rowEls[2]!.findAll('.dv-gutter')
    expect(addedGutters[0]!.text()).toBe('')
    expect(addedGutters[1]!.text()).toBe('2')

    const removedChanged = rowEls[1]!.findAll('.dv-seg--changed')
    expect(removedChanged).toHaveLength(1)
    expect(removedChanged[0]!.text()).toBe('bar')

    const addedChanged = rowEls[2]!.findAll('.dv-seg--changed')
    expect(addedChanged).toHaveLength(1)
    expect(addedChanged[0]!.text()).toBe('baz')
  })

  it('renders row text as textContent, never as parsed markup (XSS-shape safety)', () => {
    const xssRows: DiffRow[] = [{ kind: 'context', leftNo: 1, rightNo: 1, text: '<script>alert(1)</script>' }]
    const wrapper = mount(DiffRows, {
      props: { rows: xssRows, mode: 'unified', activeRowIndex: null }
    })

    expect(wrapper.text()).toContain('<script>alert(1)</script>')
    expect(wrapper.find('script').exists()).toBe(false)
  })

  it('marks only the row at activeRowIndex with dv-row--active', () => {
    const wrapper = mount(DiffRows, {
      props: { rows, mode: 'unified', activeRowIndex: 1 }
    })
    const rowEls = wrapper.findAll('.dv-row')
    expect(rowEls[0]!.classes()).not.toContain('dv-row--active')
    expect(rowEls[1]!.classes()).toContain('dv-row--active')
    expect(rowEls[2]!.classes()).not.toContain('dv-row--active')
    expect(rowEls[3]!.classes()).not.toContain('dv-row--active')
  })

  it('renders a gap row as "⋯ N unchanged lines"', () => {
    const gapRows: DiffRow[] = [
      { kind: 'context', leftNo: 1, rightNo: 1, text: 'a' },
      { kind: 'gap', hiddenCount: 7 },
      { kind: 'context', leftNo: 9, rightNo: 9, text: 'b' }
    ]
    const wrapper = mount(DiffRows, {
      props: { rows: gapRows, mode: 'unified', activeRowIndex: null }
    })
    const gap = wrapper.find('.dv-row--gap')
    expect(gap.exists()).toBe(true)
    expect(gap.text()).toBe('⋯ 7 unchanged lines')
  })
})

describe('DiffRows — split mode', () => {
  it('pairs a removed+added row and renders a placeholder cell for the unmatched addition', () => {
    const rows: DiffRow[] = [
      { kind: 'removed', leftNo: 5, text: 'old line' },
      { kind: 'added', rightNo: 5, text: 'new line one' },
      { kind: 'added', rightNo: 6, text: 'new line two' }
    ]
    const wrapper = mount(DiffRows, {
      props: { rows, mode: 'split', activeRowIndex: null }
    })

    expect(wrapper.findAll('.dv-cell--empty')).toHaveLength(1)

    const removedEls = wrapper.findAll('.dv-row--removed')
    const addedEls = wrapper.findAll('.dv-row--added')
    expect(removedEls).toHaveLength(1)
    expect(addedEls).toHaveLength(2)

    expect(removedEls[0]!.text()).toContain('old line')
    expect(addedEls[0]!.text()).toContain('new line one')
    expect(addedEls[1]!.text()).toContain('new line two')
  })
})

describe('DiffIndicators', () => {
  it('renders one pill per indicator with detail text and a kind modifier class', () => {
    const indicators: Indicator[] = [
      { kind: 'eol-differs', detail: 'Line endings differ: left CRLF, right LF' },
      { kind: 'bom-left', detail: 'Byte-order mark present in left input' }
    ]
    const wrapper = mount(DiffIndicators, { props: { indicators } })

    const pills = wrapper.findAll('.dv-indicator')
    expect(pills).toHaveLength(2)
    expect(pills[0]!.text()).toBe(indicators[0]!.detail)
    expect(pills[0]!.classes()).toContain('dv-indicator--eol-differs')
    expect(pills[1]!.text()).toBe(indicators[1]!.detail)
    expect(pills[1]!.classes()).toContain('dv-indicator--bom-left')
  })
})
