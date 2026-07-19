import { diffArrays } from 'diff'
import type { ArrayChange } from 'diff'
import type { DiffRow, Segment } from './model'

// Refinement is skipped (whole-line render) beyond these bounds: very long lines
// are expensive to token-diff, and very different lengths produce noise, not signal.
const MAX_REFINE_CHARS = 5000
const MIN_LENGTH_RATIO = 0.4

type Granularity = 'word' | 'grapheme'

// Cached segmenters: undefined locale = host default; construction is the expensive part.
const segmenters: Record<Granularity, Intl.Segmenter> = {
  word: new Intl.Segmenter(undefined, { granularity: 'word' }),
  grapheme: new Intl.Segmenter(undefined, { granularity: 'grapheme' })
}

// Both granularities partition the input exactly, so segments always concatenate
// back to the original string. Grapheme tokens never split ZWJ emoji sequences or
// base+combining-mark clusters.
const tokenize = (text: string, granularity: Granularity): string[] =>
  [...segmenters[granularity].segment(text)].map(s => s.segment)

// Merge adjacent same-flag segments (splicing sub-refined pairs back in can leave
// two unchanged segments side by side).
const coalesce = (segments: Segment[]): Segment[] => {
  const out: Segment[] = []
  for (const seg of segments) {
    const last = out[out.length - 1]
    if (last && last.changed === seg.changed) last.text += seg.text
    else out.push({ text: seg.text, changed: seg.changed })
  }
  return out
}

export function refineSegments(
  removedText: string,
  addedText: string
): { removed: Segment[]; added: Segment[] } | null {
  if (removedText.length > MAX_REFINE_CHARS || addedText.length > MAX_REFINE_CHARS) return null
  // NaN (both empty) compares false, which is fine: empty pair refines to empty segments.
  if (Math.min(removedText.length, addedText.length) / Math.max(removedText.length, addedText.length) < MIN_LENGTH_RATIO) {
    return null
  }

  let granularity: Granularity = 'word'
  let removedTokens = tokenize(removedText, granularity)
  let addedTokens = tokenize(addedText, granularity)
  // Degenerate word split (single word / single glyph per side): fall back to graphemes
  // so the diff still has units to work with.
  if (removedTokens.length <= 1 || addedTokens.length <= 1) {
    granularity = 'grapheme'
    removedTokens = tokenize(removedText, granularity)
    addedTokens = tokenize(addedText, granularity)
  }

  const removed: Segment[] = []
  const added: Segment[] = []
  const emit = (runs: ArrayChange<string>[]): void => {
    for (const run of runs) {
      const text = run.value.join('')
      if (run.removed) removed.push({ text, changed: true })
      else if (run.added) added.push({ text, changed: true })
      else {
        removed.push({ text, changed: false })
        added.push({ text, changed: false })
      }
    }
  }

  const runs = diffArrays(removedTokens, addedTokens)
  let i = 0
  while (i < runs.length) {
    const run = runs[i]!
    const next = runs[i + 1]
    // Single-word substitution: re-diff the pair at grapheme granularity (same ≤1-token
    // principle as above, applied per pair). Dictionary segmentation can make one word
    // the changed unit where only one grapheme inside it differs (e.g. 良い → 悪い);
    // this recovers the precise grapheme without ever crossing common-word anchors.
    if (
      granularity === 'word' &&
      run.removed &&
      next?.added &&
      run.value.length === 1 &&
      next.value.length === 1
    ) {
      emit(diffArrays(tokenize(run.value[0]!, 'grapheme'), tokenize(next.value[0]!, 'grapheme')))
      i += 2
      continue
    }
    emit([run])
    i++
  }

  return { removed: coalesce(removed), added: coalesce(added) }
}

// Pairs consecutive removed-run/added-run index-wise — same pairing as toSplitRows —
// and sets .segments in place on both rows of each pair where refinement succeeded.
export function refineRows(rows: DiffRow[]): DiffRow[] {
  let i = 0
  while (i < rows.length) {
    if (rows[i]!.kind !== 'removed') {
      i++
      continue
    }
    let r = 0
    while (i + r < rows.length && rows[i + r]!.kind === 'removed') r++
    let a = 0
    while (i + r + a < rows.length && rows[i + r + a]!.kind === 'added') a++
    const paired = Math.min(r, a)
    for (let k = 0; k < paired; k++) {
      const left = rows[i + k]!
      const right = rows[i + r + k]!
      if (left.kind !== 'removed' || right.kind !== 'added') continue
      const refined = refineSegments(left.text, right.text)
      if (refined) {
        left.segments = refined.removed
        right.segments = refined.added
      }
    }
    i += r + a
  }
  return rows
}
