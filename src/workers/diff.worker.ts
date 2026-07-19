import { computeDiffModel } from '@/lib/diff'
import type { DiffOptions, ComputeResult } from '@/lib/diff'

// diff.worker.ts — runs inside a dedicated Worker. Imports ONLY from src/lib/diff
// (no Vue): the pure compute pipeline is the one thing this file is allowed to know
// about. Protocol is request/response correlated by an incrementing `id` so the
// composable can drop stale responses (supersede semantics live on the caller side).

export interface DiffRequest {
  id: number
  left: string
  right: string
  options: DiffOptions
}

export type DiffResponse = { id: number; result: ComputeResult } | { id: number; error: string }

self.onmessage = (event: MessageEvent<DiffRequest>) => {
  const { id, left, right, options } = event.data
  try {
    const result = computeDiffModel(left, right, options)
    const response: DiffResponse = { id, result }
    postMessage(response)
  } catch (err) {
    const response: DiffResponse = { id, error: err instanceof Error ? err.message : 'Diff computation failed' }
    postMessage(response)
  }
}
