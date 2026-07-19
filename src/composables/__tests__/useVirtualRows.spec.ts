import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useVirtualRows, VIRTUALIZE_THRESHOLD } from '@/composables/useVirtualRows'

const ROW_HEIGHT = 24
const OVERSCAN = 20
const VIEWPORT = 600
const opts = { rowHeight: ROW_HEIGHT, overscan: OVERSCAN }

// Builds a fake scroll-container target plus the Event wrapper containerProps.onScroll expects.
// Returned separately so tests can assert against the same object scrollToRow writes back to.
const fakeScroll = (scrollTop: number, clientHeight = VIEWPORT) => {
  const target = { scrollTop, clientHeight }
  return { event: { target } as unknown as Event, target }
}

describe('useVirtualRows', () => {
  it('inactive passthrough: totalRows at or under the threshold renders everything', () => {
    const totalRows = ref(400)
    const v = useVirtualRows(totalRows, opts)

    expect(v.active.value).toBe(false)
    expect(v.start.value).toBe(0)
    expect(v.end.value).toBe(400)
    expect(v.padTop.value).toBe(0)
    expect(v.padBottom.value).toBe(0)
    expect(v.containerProps.style).toEqual({})
  })

  it('active at scrollTop 0: window starts at row 0 with trailing overscan', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event } = fakeScroll(0)
    v.containerProps.onScroll(event)

    expect(v.active.value).toBe(true)
    expect(v.start.value).toBe(0) // floor(0/24) - 20 = -20, clamped to 0
    expect(v.end.value).toBe(45) // ceil(600/24) + 20 = 25 + 20
    expect(v.padTop.value).toBe(0)
    expect(v.padBottom.value).toBe(238920) // (10000 - 45) * 24
    expect(v.containerProps.style).toEqual({ 'max-height': '70vh', 'overflow-y': 'auto' })
  })

  it('active mid-scroll at scrollTop 4800: window follows scroll position with overscan both sides', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event } = fakeScroll(4800)
    v.containerProps.onScroll(event)

    expect(v.start.value).toBe(180) // floor(4800/24) - 20 = 200 - 20
    expect(v.end.value).toBe(245) // ceil(5400/24) + 20 = 225 + 20
    expect(v.padTop.value).toBe(4320) // 180 * 24
    expect(v.padBottom.value).toBe(234120) // (10000 - 245) * 24
  })

  it('bottom clamp: max scrollTop clamps end to totalRows and zeroes padBottom', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event } = fakeScroll(239400) // 10000 * 24 - 600, the max scrollTop
    v.containerProps.onScroll(event)

    expect(v.start.value).toBe(9955) // floor(239400/24) - 20 = 9975 - 20
    expect(v.end.value).toBe(10000) // ceil(240000/24) + 20 = 10020, clamped to totalRows
    expect(v.padTop.value).toBe(238920) // 9955 * 24
    expect(v.padBottom.value).toBe(0)
  })

  it('scrollToRow(600) sets the container scrollTop ~1/3 of the viewport from the top', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event, target } = fakeScroll(0)
    // containerRef simulates the template's `ref="containerRef"` binding — set
    // once on mount, independent of whether a scroll event has ever fired.
    v.containerRef.value = target as unknown as HTMLElement
    v.containerProps.onScroll(event) // establishes scrollTop/viewportHeight window state

    v.scrollToRow(600)

    expect(target.scrollTop).toBe(14200) // 600 * 24 - 600 / 3
  })

  it('scrollToRow clamps to 0 instead of going negative near the top of the list', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event, target } = fakeScroll(500)
    v.containerRef.value = target as unknown as HTMLElement
    v.containerProps.onScroll(event)

    v.scrollToRow(2)

    expect(target.scrollTop).toBe(0) // 2 * 24 - 200 = -152, clamped to 0
  })

  it('C3: scrollToRow writes scrollTop even before any scroll event has ever fired (blank-viewport-pre-scroll fix)', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const target = { scrollTop: 0, clientHeight: VIEWPORT }
    v.containerRef.value = target as unknown as HTMLElement // bound on mount, never scrolled

    v.scrollToRow(600)

    // viewportHeight still at its default (600) since onScroll never ran — the
    // point is that the write itself must land regardless.
    expect(target.scrollTop).toBe(14200) // 600 * 24 - 600 / 3
  })

  it('shrinking totalRows below the threshold flips active to false and resets pads', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    const { event } = fakeScroll(4800)
    v.containerProps.onScroll(event)
    expect(v.active.value).toBe(true)
    expect(v.padTop.value).toBe(4320)

    totalRows.value = 400

    expect(v.active.value).toBe(false)
    expect(v.start.value).toBe(0)
    expect(v.end.value).toBe(400)
    expect(v.padTop.value).toBe(0)
    expect(v.padBottom.value).toBe(0)
    expect(v.containerProps.style).toEqual({})
  })

  it('active flips exactly at VIRTUALIZE_THRESHOLD: threshold itself is inactive, one more is active', () => {
    const totalRows = ref(VIRTUALIZE_THRESHOLD)
    const v = useVirtualRows(totalRows, opts)
    expect(v.active.value).toBe(false)

    totalRows.value = VIRTUALIZE_THRESHOLD + 1
    expect(v.active.value).toBe(true)
  })

  it('viewportHeight defaults to 600 and updates from the scrolled target clientHeight', () => {
    const totalRows = ref(10000)
    const v = useVirtualRows(totalRows, opts)
    expect(v.viewportHeight.value).toBe(600)

    const { event } = fakeScroll(0, 300)
    v.containerProps.onScroll(event)
    expect(v.viewportHeight.value).toBe(300)
  })
})
