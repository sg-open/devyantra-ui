import { createTwoFilesPatch } from 'diff'

// patch.ts — ALWAYS original texts, never normalized/folded. The invariant tests in
// later tasks depend on this: whatever the user typed is what a saved/copied patch shows.
export interface PatchOptions { context: number; leftName?: string; rightName?: string }

export function buildPatch(originalLeft: string, originalRight: string, opts: PatchOptions): string {
  // Infinity means "show the whole file as context"; jsdiff wants a concrete line count.
  const leftLines = originalLeft.split('\n').length
  const rightLines = originalRight.split('\n').length
  const context = opts.context === Infinity ? Math.max(leftLines, rightLines) : opts.context

  return createTwoFilesPatch(
    opts.leftName ?? 'original',
    opts.rightName ?? 'modified',
    originalLeft,
    originalRight,
    '',
    '',
    { context }
  )
}
