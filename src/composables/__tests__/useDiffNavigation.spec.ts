import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDiffNavigation } from '@/composables/useDiffNavigation'
import type { DiffRow } from '@/lib/diff/model'

// Minimal row builders — line numbers are irrelevant to block counting, so
// they're defaulted and only overridden where a test cares.
const context = (leftNo = 1, rightNo = 1): DiffRow => ({ kind: 'context', leftNo, rightNo, text: 'ctx' })
const removed = (leftNo = 1): DiffRow => ({ kind: 'removed', leftNo, text: 'del' })
const added = (rightNo = 1): DiffRow => ({ kind: 'added', rightNo, text: 'ins' })
const gap = (hiddenCount = 1): DiffRow => ({ kind: 'gap', hiddenCount })

describe('useDiffNavigation', () => {
  it('null rows produce zero blocks, no selection, and a null activeRowIndex', () => {
    const rows = ref<DiffRow[] | null>(null)
    const { totalBlocks, currentBlock, activeRowIndex } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(0)
    expect(currentBlock.value).toBe(-1)
    expect(activeRowIndex.value).toBeNull()
  })

  it('modify: adjacent removed+added rows count as ONE block', () => {
    const rows = ref<DiffRow[] | null>([context(), removed(), added(), context()])
    const { totalBlocks } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(1)
  })

  it('insert-only (№8): context, context, added, added counts as ONE block', () => {
    const rows = ref<DiffRow[] | null>([context(1, 1), context(2, 2), added(3), added(4)])
    const { totalBlocks, activeRowIndex, nextChange } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(1)
    nextChange()
    // first row of the block, not just any row inside it
    expect(activeRowIndex.value).toBe(2)
  })

  it('delete-only: context, removed, removed counts as ONE block', () => {
    const rows = ref<DiffRow[] | null>([context(), removed(2), removed(3)])
    const { totalBlocks } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(1)
  })

  it('multi-block: removed | context | added counts as TWO blocks', () => {
    const rows = ref<DiffRow[] | null>([removed(), context(), added()])
    const { totalBlocks } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(2)
  })

  it('multi-block: removed | gap | removed counts as TWO blocks', () => {
    const rows = ref<DiffRow[] | null>([removed(1), gap(1), removed(2)])
    const { totalBlocks } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(2)
  })

  it('activeRowIndex tracks the first row index of a multi-row block, not an arbitrary one', () => {
    const rows = ref<DiffRow[] | null>([context(), removed(2), removed(3), added(2), context()])
    const { activeRowIndex, nextChange } = useDiffNavigation(rows)

    nextChange()
    expect(activeRowIndex.value).toBe(1) // the removed/removed/added run starts at index 1
  })

  it('no wraparound: nextChange stops at the last block, prevChange stops at the first', () => {
    // three single-row blocks at indices 0, 2, 4
    const rows = ref<DiffRow[] | null>([removed(1), context(), removed(2), context(), removed(3)])
    const { currentBlock, totalBlocks, nextChange, prevChange } = useDiffNavigation(rows)

    expect(totalBlocks.value).toBe(3)
    expect(currentBlock.value).toBe(-1)

    nextChange()
    expect(currentBlock.value).toBe(0) // from -1, next lands on the first block
    nextChange()
    expect(currentBlock.value).toBe(1)
    nextChange()
    expect(currentBlock.value).toBe(2)
    nextChange()
    expect(currentBlock.value).toBe(2) // stays at last — no wrap to 0

    prevChange()
    expect(currentBlock.value).toBe(1)
    prevChange()
    expect(currentBlock.value).toBe(0)
    prevChange()
    expect(currentBlock.value).toBe(0) // stays at first — no wrap to last
  })

  it('nextChange/prevChange are no-ops when there are no blocks', () => {
    const rows = ref<DiffRow[] | null>([context(), context()])
    const { currentBlock, nextChange, prevChange } = useDiffNavigation(rows)

    nextChange()
    expect(currentBlock.value).toBe(-1)
    prevChange()
    expect(currentBlock.value).toBe(-1)
  })

  it('resets currentBlock to -1 the moment the rows ref changes', () => {
    const rows = ref<DiffRow[] | null>([removed(1), context(), added(1)])
    const { currentBlock, nextChange } = useDiffNavigation(rows)

    nextChange()
    expect(currentBlock.value).toBe(0)

    // A new array reference — as a fresh compute result would produce — resets selection.
    rows.value = [context(), removed(2), added(2)]
    expect(currentBlock.value).toBe(-1)
  })

  it('resets currentBlock to -1 even when rows becomes null', () => {
    const rows = ref<DiffRow[] | null>([removed(1), added(1)])
    const { currentBlock, nextChange } = useDiffNavigation(rows)

    nextChange()
    expect(currentBlock.value).toBe(0)

    rows.value = null
    expect(currentBlock.value).toBe(-1)
  })
})
