import { diffLines } from 'diff'
import { normalizePair } from './normalize'
import { buildDiffModel } from './model'
import type { DiffModel } from './model'
import { refineRows } from './refine'

// index.ts — the one entry point (worker + fallback both call this)
export interface DiffOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
  context: number // Infinity allowed
}

export const LIMITS = { maxBytesPerSide: 5 * 1024 * 1024, maxRows: 200_000 } as const

export type ComputeResult =
  | { ok: true; model: DiffModel }
  | { ok: false; reason: 'too-large'; detail: string }

// Byte size, not JS string length: multi-byte UTF-8 content should hit the limit at the
// same real-world size regardless of codepoint width. Accurate and cheap enough at 5MB scale.
const byteLength = (text: string): number => new TextEncoder().encode(text).length

// Whole megabytes print without a decimal ("5 MB"); anything else keeps one decimal place
// ("6.1 MB") so the named limit in the error reads exactly like the brief's example.
const formatMb = (bytes: number): string => {
  const mb = Math.round((bytes / (1024 * 1024)) * 10) / 10
  return `${Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1)} MB`
}

const oversizedDetail = (side: 'Left' | 'Right', bytes: number): string =>
  `${side} input is ${formatMb(bytes)}; the limit is ${formatMb(LIMITS.maxBytesPerSide)} per side`

// Fold semantics MUST match the fix pack's established behavior (see foldText in
// DiffRenderer.vue) — copied verbatim, not reinvented. Applied AFTER EOL/BOM normalization,
// to both sides, for comparison/display only; buildPatch never sees folded text.
const foldForComparison = (text: string, options: DiffOptions): string => {
  let t = options.ignoreCase ? text.toLowerCase() : text
  if (options.ignoreWhitespace) {
    t = t
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .replace(/^ +| +$/gm, '')
  }
  return t
}

export function computeDiffModel(left: string, right: string, options: DiffOptions): ComputeResult {
  // Size-check first, on the raw inputs, before any allocation-heavy processing.
  const leftBytes = byteLength(left)
  if (leftBytes > LIMITS.maxBytesPerSide) {
    return { ok: false, reason: 'too-large', detail: oversizedDetail('Left', leftBytes) }
  }
  const rightBytes = byteLength(right)
  if (rightBytes > LIMITS.maxBytesPerSide) {
    return { ok: false, reason: 'too-large', detail: oversizedDetail('Right', rightBytes) }
  }

  const normalized = normalizePair(left, right)
  const foldedLeft = foldForComparison(normalized.left, options)
  const foldedRight = foldForComparison(normalized.right, options)

  const runs = diffLines(foldedLeft, foldedRight)
  const model = buildDiffModel(runs, options.context, normalized.indicators)

  if (model.rows.length > LIMITS.maxRows) {
    return {
      ok: false,
      reason: 'too-large',
      detail: `Diff has ${model.rows.length.toLocaleString()} rows; the limit is ${LIMITS.maxRows.toLocaleString()} rows`
    }
  }

  model.rows = refineRows(model.rows)
  return { ok: true, model }
}
