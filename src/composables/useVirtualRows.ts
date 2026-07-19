import { ref, computed, type ComputedRef, type Ref } from 'vue'

/**
 * Below this many total rows, every row stays in the DOM: the list is cheap
 * enough to render in full, and consumers (search, native find-in-page,
 * row navigation) can rely on all rows being present.
 */
export const VIRTUALIZE_THRESHOLD = 500

export interface UseVirtualRowsOptions {
  rowHeight: number
  overscan: number
}

export interface UseVirtualRowsReturn {
  containerProps: {
    onScroll: (e: Event) => void
    readonly style: Record<string, string>
  }
  /**
   * Bind with `ref="containerRef"` on the scrolling container in the template.
   * Captured on mount (before any scroll ever happens), not lazily from the
   * first scroll event's `event.target` — a purely programmatic `scrollToRow`
   * (e.g. diff navigation jumping to a change) used to be a no-op until the
   * user had manually scrolled at least once, because there was nothing yet
   * to write `scrollTop` to (C3).
   */
  containerRef: Ref<HTMLElement | null>
  active: ComputedRef<boolean>
  start: ComputedRef<number>
  end: ComputedRef<number>
  padTop: ComputedRef<number>
  padBottom: ComputedRef<number>
  scrollToRow: (index: number) => void
  viewportHeight: Ref<number>
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

/**
 * Minimal fixed-height row virtualizer for the diff viewer. Once `totalRows`
 * exceeds `VIRTUALIZE_THRESHOLD`, only the rows inside the scrolled viewport
 * (plus `overscan` rows of padding on each side) are meant to be rendered;
 * `padTop`/`padBottom` are spacer heights (px) that stand in for the rows
 * skipped above/below the window. Below the threshold this is a passthrough.
 */
export function useVirtualRows(totalRows: Ref<number>, opts: UseVirtualRowsOptions): UseVirtualRowsReturn {
  const scrollTop = ref(0)
  const viewportHeight = ref(600)
  const containerRef = ref<HTMLElement | null>(null)

  const active = computed(() => totalRows.value > VIRTUALIZE_THRESHOLD)

  const start = computed(() => {
    if (!active.value) return 0
    return clamp(Math.floor(scrollTop.value / opts.rowHeight) - opts.overscan, 0, totalRows.value)
  })

  const end = computed(() => {
    if (!active.value) return totalRows.value
    return clamp(Math.ceil((scrollTop.value + viewportHeight.value) / opts.rowHeight) + opts.overscan, 0, totalRows.value)
  })

  const padTop = computed(() => (active.value ? start.value * opts.rowHeight : 0))
  const padBottom = computed(() => (active.value ? (totalRows.value - end.value) * opts.rowHeight : 0))

  // Still the source of truth for the sliding render window on every real
  // scroll — only the "where do I write a programmatic scroll" job moved to
  // containerRef.
  const onScroll = (e: Event): void => {
    const target = e.target as HTMLElement
    scrollTop.value = target.scrollTop
    viewportHeight.value = target.clientHeight
  }

  const scrollToRow = (index: number): void => {
    const next = Math.max(index * opts.rowHeight - viewportHeight.value / 3, 0)
    scrollTop.value = next
    if (containerRef.value) containerRef.value.scrollTop = next
  }

  const containerProps = {
    onScroll,
    get style(): Record<string, string> {
      return active.value ? { 'max-height': '70vh', 'overflow-y': 'auto' } : {}
    }
  }

  return { containerProps, containerRef, active, start, end, padTop, padBottom, scrollToRow, viewportHeight }
}
