import type { Indicator } from './normalize'

export type Segment = { text: string; changed: boolean }
export type DiffRow =
  | { kind: 'context'; leftNo: number; rightNo: number; text: string }
  | { kind: 'removed'; leftNo: number; text: string; segments?: Segment[] }
  | { kind: 'added'; rightNo: number; text: string; segments?: Segment[] }
  | { kind: 'gap'; hiddenCount: number }
export interface DiffStats { added: number; removed: number; modified: number }
export interface DiffModel { rows: DiffRow[]; stats: DiffStats; indicators: Indicator[]; truncated: boolean }
// runs come from jsdiff diffLines(left, right): { value, count?, added?, removed? }
export interface ChangeRun { value: string; count?: number; added?: boolean; removed?: boolean }
// split-view pairing for the renderer: context pairs with itself; removed/added runs pair index-wise
export type SplitCell = { row: DiffRow } | null
export type SplitRow = { left: SplitCell; right: SplitCell }

const runLines = (value: string): string[] => {
  const lines = value.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

export function buildDiffModel(runs: ChangeRun[], context: number, indicators: Indicator[] = []): DiffModel {
  const all: DiffRow[] = []
  let leftNo = 1
  let rightNo = 1
  for (const run of runs) {
    const lines = runLines(run.value)
    if (run.removed) {
      for (const text of lines) all.push({ kind: 'removed', leftNo: leftNo++, text })
    } else if (run.added) {
      for (const text of lines) all.push({ kind: 'added', rightNo: rightNo++, text })
    } else {
      for (const text of lines) all.push({ kind: 'context', leftNo: leftNo++, rightNo: rightNo++, text })
    }
  }

  const stats: DiffStats = { added: 0, removed: 0, modified: 0 }
  let i = 0
  while (i < all.length) {
    const row = all[i]!
    if (row.kind === 'removed') {
      let r = 0
      while (i + r < all.length && all[i + r]!.kind === 'removed') r++
      let a = 0
      while (i + r + a < all.length && all[i + r + a]!.kind === 'added') a++
      const paired = Math.min(r, a)
      stats.modified += paired
      stats.removed += r - paired
      stats.added += a - paired
      i += r + a
    } else if (row.kind === 'added') {
      stats.added += 1
      i++
    } else {
      i++
    }
  }

  let rows: DiffRow[]
  const hasChange = all.some(row => row.kind === 'removed' || row.kind === 'added')
  if (context === Infinity || !hasChange) {
    rows = all
  } else {
    const keep = new Array<boolean>(all.length).fill(false)
    for (let j = 0; j < all.length; j++) {
      if (all[j]!.kind === 'removed' || all[j]!.kind === 'added') {
        for (let k = Math.max(0, j - context); k <= Math.min(all.length - 1, j + context); k++) keep[k] = true
      }
    }
    rows = []
    let hidden = 0
    for (let j = 0; j < all.length; j++) {
      if (keep[j]) {
        if (hidden > 0) { rows.push({ kind: 'gap', hiddenCount: hidden }); hidden = 0 }
        rows.push(all[j]!)
      } else {
        hidden++
      }
    }
    if (hidden > 0) rows.push({ kind: 'gap', hiddenCount: hidden })
  }

  return { rows, stats, indicators, truncated: false }
}

export function toSplitRows(rows: DiffRow[]): SplitRow[] {
  const out: SplitRow[] = []
  let i = 0
  while (i < rows.length) {
    const row = rows[i]!
    if (row.kind === 'context' || row.kind === 'gap') {
      out.push({ left: { row }, right: { row } })
      i++
      continue
    }
    let r = 0
    while (i + r < rows.length && rows[i + r]!.kind === 'removed') r++
    let a = 0
    while (i + r + a < rows.length && rows[i + r + a]!.kind === 'added') a++
    const span = Math.max(r, a)
    for (let k = 0; k < span; k++) {
      out.push({
        left: k < r ? { row: rows[i + k]! } : null,
        right: k < a ? { row: rows[i + r + k]! } : null
      })
    }
    i += r + a
  }
  return out
}
