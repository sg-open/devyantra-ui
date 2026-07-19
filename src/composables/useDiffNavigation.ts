import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { DiffRow } from '@/lib/diff/model'

export interface UseDiffNavigationReturn {
  totalBlocks: ComputedRef<number>
  currentBlock: Ref<number>
  activeRowIndex: ComputedRef<number | null>
  nextChange: () => void
  prevChange: () => void
}

/**
 * Model-driven change navigation for the diff viewer (audit №8 fix).
 *
 * A "block" is a maximal run of `removed`/`added` rows in `rows` — `context`
 * and `gap` rows always break a run, even ones that look adjacent once
 * rendered (e.g. in split view). This makes a pure trailing insertion
 * (`context, context, added, added`) count as ONE block, and two changes
 * separated by folded context (`removed, gap, removed`) count as TWO —
 * unlike the old DOM-scanning nav, which only ever saw the left/original
 * side's rows and missed insert-only diffs entirely.
 *
 * `currentBlock` is 0-based; -1 means "no block selected", which is both the
 * initial state and the state right after `rows` changes to a new array
 * reference (a fresh compute result never carries over a stale selection).
 *
 * Navigation does not wrap: `nextChange()` at the last block stays there,
 * `prevChange()` at the first block (block 0) stays there. From -1,
 * `nextChange()` lands on block 0 and `prevChange()` also settles on block 0
 * (there is nothing "before" the first block to wrap past).
 */
export function useDiffNavigation(rows: Ref<DiffRow[] | null>): UseDiffNavigationReturn {
  const currentBlock = ref(-1)

  // Start index (into `rows`) of every maximal removed/added run.
  const blockStarts = computed<number[]>(() => {
    const list = rows.value
    if (!list) return []
    const starts: number[] = []
    let inBlock = false
    for (let i = 0; i < list.length; i++) {
      const isChange = list[i]!.kind === 'removed' || list[i]!.kind === 'added'
      if (isChange && !inBlock) {
        starts.push(i)
        inBlock = true
      } else if (!isChange) {
        inBlock = false
      }
    }
    return starts
  })

  const totalBlocks = computed(() => blockStarts.value.length)

  const activeRowIndex = computed<number | null>(() => {
    const i = currentBlock.value
    const starts = blockStarts.value
    return i >= 0 && i < starts.length ? starts[i]! : null
  })

  // Sync flush: a new `rows` array is a new model — drop any selection from
  // the previous one immediately, before anything else can read a stale
  // currentBlock/activeRowIndex against content it no longer describes.
  watch(
    rows,
    () => {
      currentBlock.value = -1
    },
    { flush: 'sync' }
  )

  const nextChange = (): void => {
    const total = totalBlocks.value
    if (total === 0) return
    currentBlock.value = Math.min(currentBlock.value + 1, total - 1)
  }

  const prevChange = (): void => {
    const total = totalBlocks.value
    if (total === 0) return
    currentBlock.value = Math.max(currentBlock.value - 1, 0)
  }

  return { totalBlocks, currentBlock, activeRowIndex, nextChange, prevChange }
}
