<!--
  DiffRows.vue - Model-driven virtualized row renderer for the diff viewer.

  Renders a DiffModel's rows (see src/lib/diff/model.ts) directly with normal
  template interpolation — NO v-html anywhere, so there is no HTML re-parse
  and no escaping-bug class to worry about.

  Props:
  - rows: DiffRow[] - the ordered model rows (source of truth for indexing)
  - mode: 'split' | 'unified' - unified renders `rows` directly; split renders
    `toSplitRows(rows)` (paired removed/added cells, placeholders for excess)
  - activeRowIndex: number | null - index into `rows` (NOT the split view's
    expanded array) that should carry `dv-row--active`, or null for none

  Exposes:
  - scrollToRow(index) - forwarded from useVirtualRows, for Task 9's navigation
-->

<template>
  <div class="dv-rows" :class="`dv-rows--${mode}`" v-bind="containerProps">
    <div v-if="padTop" class="dv-pad" :style="{ height: `${padTop}px` }" />

    <template v-if="mode === 'unified'">
      <div
        v-for="entry in unifiedView"
        :key="entry.key"
        class="dv-row"
        :class="[`dv-row--${entry.kind}`, { 'dv-row--active': entry.active }]"
      >
        <template v-if="entry.kind === 'gap'">{{ entry.gapText }}</template>
        <template v-else>
          <span class="dv-gutter">{{ entry.leftNo ?? '' }}</span>
          <span class="dv-gutter">{{ entry.rightNo ?? '' }}</span>
          <span class="dv-text">
            <template v-if="entry.segments">
              <span
                v-for="(seg, si) in entry.segments"
                :key="si"
                class="dv-seg"
                :class="{ 'dv-seg--changed': seg.changed }"
              >{{ seg.text }}</span>
            </template>
            <template v-else>{{ entry.text }}</template>
          </span>
        </template>
      </div>
    </template>

    <template v-else>
      <div v-for="line in splitView" :key="line.key" class="dv-split-line">
        <div
          v-if="line.gapText !== null"
          class="dv-row dv-row--gap"
          :class="{ 'dv-row--active': line.gapActive }"
        >{{ line.gapText }}</div>

        <template v-else>
          <template v-for="(cell, ci) in [line.left, line.right]" :key="ci">
            <div
              v-if="cell"
              class="dv-row"
              :class="[`dv-row--${cell.kind}`, { 'dv-row--active': cell.active }]"
            >
              <span class="dv-gutter">{{ cell.no ?? '' }}</span>
              <span class="dv-text">
                <template v-if="cell.segments">
                  <span
                    v-for="(seg, si) in cell.segments"
                    :key="si"
                    class="dv-seg"
                    :class="{ 'dv-seg--changed': seg.changed }"
                  >{{ seg.text }}</span>
                </template>
                <template v-else>{{ cell.text }}</template>
              </span>
            </div>
            <div v-else class="dv-cell dv-cell--empty" />
          </template>
        </template>
      </div>
    </template>

    <div v-if="padBottom" class="dv-pad" :style="{ height: `${padBottom}px` }" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toSplitRows, type DiffRow, type Segment, type SplitRow } from '@/lib/diff/model'
import { useVirtualRows } from '@/composables/useVirtualRows'

interface Props {
  rows: DiffRow[]
  mode: 'split' | 'unified'
  activeRowIndex: number | null
}

const props = defineProps<Props>()

// Row height is a hard assumption shared with useVirtualRows; overscan matches
// the design spec (D5). Keep in sync with the `line-height: 24px` in <style>.
const ROW_HEIGHT = 24
const OVERSCAN = 20

// activeRowIndex always refers to a position in the `rows` prop, never in the
// split view's expanded (placeholder-bearing) array. Row objects are unique
// references, so a WeakMap gives O(1) "what's my original index" lookups from
// either render path without threading index math through toSplitRows.
const rowIndex = computed(() => {
  const map = new WeakMap<DiffRow, number>()
  props.rows.forEach((row, i) => map.set(row, i))
  return map
})

const isActive = (row: DiffRow): boolean =>
  props.activeRowIndex !== null && rowIndex.value.get(row) === props.activeRowIndex

const splitRows = computed<SplitRow[]>(() => toSplitRows(props.rows))

// A real Ref (not a ComputedRef) so it satisfies useVirtualRows' Ref<number> param.
const totalRows = ref(0)
watch(
  () => (props.mode === 'unified' ? props.rows.length : splitRows.value.length),
  (n) => {
    totalRows.value = n
  },
  { immediate: true }
)

const { containerProps, start, end, padTop, padBottom, scrollToRow } = useVirtualRows(totalRows, {
  rowHeight: ROW_HEIGHT,
  overscan: OVERSCAN
})

// Refinement can produce a defined-but-empty segments array for a degenerate
// empty/empty pairing; treat that the same as "no segments" (plain text).
const usableSegments = (row: DiffRow): Segment[] | undefined => {
  const segs = 'segments' in row ? row.segments : undefined
  return segs && segs.length > 0 ? segs : undefined
}

interface RowEntry {
  key: number
  kind: DiffRow['kind']
  gapText: string
  leftNo: number | null
  rightNo: number | null
  text: string
  segments: Segment[] | undefined
  active: boolean
}

const toRowEntry = (row: DiffRow, key: number): RowEntry => ({
  key,
  kind: row.kind,
  gapText: row.kind === 'gap' ? `⋯ ${row.hiddenCount} unchanged lines` : '',
  leftNo: 'leftNo' in row ? row.leftNo : null,
  rightNo: 'rightNo' in row ? row.rightNo : null,
  text: 'text' in row ? row.text : '',
  segments: usableSegments(row),
  active: isActive(row)
})

const unifiedView = computed<RowEntry[]>(() => {
  if (props.mode !== 'unified') return []
  return props.rows.slice(start.value, end.value).map((row, i) => toRowEntry(row, start.value + i))
})

interface CellEntry {
  kind: DiffRow['kind']
  no: number | null
  text: string
  segments: Segment[] | undefined
  active: boolean
}

const toCellEntry = (row: DiffRow, side: 'left' | 'right'): CellEntry => ({
  kind: row.kind,
  no: side === 'left' ? ('leftNo' in row ? row.leftNo : null) : ('rightNo' in row ? row.rightNo : null),
  text: 'text' in row ? row.text : '',
  segments: usableSegments(row),
  active: isActive(row)
})

interface SplitLineEntry {
  key: number
  gapText: string | null
  gapActive: boolean
  left: CellEntry | null
  right: CellEntry | null
}

// Gap rows pair with themselves on both sides (toSplitRows: `{ left: { row }, right: { row } }`
// for context/gap kinds) — rendered as ONE full-width divider rather than duplicated per side.
const toSplitLineEntry = (line: SplitRow, key: number): SplitLineEntry => {
  const leftRow = line.left?.row ?? null
  const rightRow = line.right?.row ?? null
  const gap = leftRow?.kind === 'gap' ? leftRow : rightRow?.kind === 'gap' ? rightRow : null
  if (gap) {
    return { key, gapText: `⋯ ${gap.hiddenCount} unchanged lines`, gapActive: isActive(gap), left: null, right: null }
  }
  return {
    key,
    gapText: null,
    gapActive: false,
    left: leftRow ? toCellEntry(leftRow, 'left') : null,
    right: rightRow ? toCellEntry(rightRow, 'right') : null
  }
}

const splitView = computed<SplitLineEntry[]>(() => {
  if (props.mode !== 'split') return []
  return splitRows.value.slice(start.value, end.value).map((line, i) => toSplitLineEntry(line, start.value + i))
})

defineExpose({ scrollToRow })
</script>

<style scoped>
.dv-rows {
  position: relative;
  overflow-x: auto;
  background: var(--diff-code-bg);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.dv-pad {
  width: 100%;
}

/* ===== ROWS (unified: full-width; split: one half of a .dv-split-line) ===== */
.dv-row {
  display: flex;
  align-items: stretch;
  height: 24px;
  line-height: 24px;
  white-space: pre;
}

.dv-row--context {
  background: var(--diff-code-bg);
}

.dv-row--removed {
  background: var(--diff-removed-bg);
}

.dv-row--added {
  background: var(--diff-added-bg);
}

.dv-row--context:hover,
.dv-row--removed:hover,
.dv-row--added:hover {
  background: var(--diff-row-hover-bg);
}

.dv-row--gap {
  flex: 1 1 100%;
  width: 100%;
  justify-content: center;
  background: var(--dt-surface-2);
  border-top: 1px solid var(--diff-fold-border);
  border-bottom: 1px solid var(--diff-fold-border);
  color: var(--dt-text-tertiary);
  font-size: var(--text-xs);
  user-select: none;
}

.dv-row--gap:hover {
  background: var(--diff-fold-hover-bg);
}

.dv-row--active {
  outline: 2px solid var(--diff-highlight-ring);
  outline-offset: -2px;
}

/* ===== GUTTER ===== */
.dv-gutter {
  flex: 0 0 auto;
  min-width: 3.5em;
  padding: 0 8px;
  text-align: right;
  background: var(--diff-gutter-bg);
  color: var(--diff-gutter-text);
  border-right: 1px solid var(--dt-border);
  font-weight: var(--font-weight-medium);
  user-select: none;
}

.dv-row--removed .dv-gutter {
  background: var(--diff-removed-gutter-bg);
  border-color: var(--diff-removed-border);
}

.dv-row--added .dv-gutter {
  background: var(--diff-added-gutter-bg);
  border-color: var(--diff-added-border);
}

/* ===== TEXT + SEGMENTS ===== */
.dv-text {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 8px;
  color: var(--dt-text-primary);
  white-space: pre;
}

.dv-row--removed .dv-seg--changed {
  background: var(--diff-removed-word-bg);
  border-radius: 3px;
}

.dv-row--added .dv-seg--changed {
  background: var(--diff-added-word-bg);
  border-radius: 3px;
}

/* ===== SPLIT VIEW: two cells per line ===== */
.dv-split-line {
  display: flex;
  height: 24px;
}

.dv-split-line > .dv-row,
.dv-split-line > .dv-cell {
  flex: 1 1 50%;
  min-width: 0;
}

.dv-split-line > *:nth-child(2) {
  border-left: 2px solid var(--dt-border);
}

.dv-cell--empty {
  height: 24px;
  background: repeating-linear-gradient(
    -45deg,
    var(--dt-surface-2),
    var(--dt-surface-2) 3px,
    var(--dt-border) 3px,
    var(--dt-border) 4px
  );
}
</style>
