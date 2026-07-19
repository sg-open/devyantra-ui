import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { computeDiffModel } from '@/lib/diff'
import type { DiffRequest } from '@/workers/diff.worker'

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage(req: DiffRequest) {
    setTimeout(() => {
      const result = computeDiffModel(req.left, req.right, req.options)
      this.onmessage?.({ data: { id: req.id, result } } as MessageEvent)
    }, 0)
  }
  terminate() {}
}

const flush = () => new Promise(r => setTimeout(r, 5))
const opts = { ignoreWhitespace: false, ignoreCase: false, context: 3 }

describe('useDiffWorker', () => {
  beforeEach(() => vi.resetModules())

  it('computes via the worker and lands in done with a model', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\nb\n', 'a\nX\n', opts)
    expect(w.state.value).toBe('computing')
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.model.value!.stats.modified).toBe(1)
  })

  it('supersede: only the latest request lands', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('1\n', 'one\n', opts)
    w.compute('2\n', 'two\n', opts)
    await flush(); await nextTick()
    const removed = w.model.value!.rows.find(r => r.kind === 'removed') as { text: string }
    expect(removed.text).toBe('2')
  })

  it('too-large results land in the too-large state with detail', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const { LIMITS } = await import('@/lib/diff')
    const w = useDiffWorker()
    w.compute('x'.repeat(LIMITS.maxBytesPerSide + 1), 'y', opts)
    await flush(); await nextTick()
    expect(w.state.value).toBe('too-large')
    expect(w.errorDetail.value).toMatch(/limit/)
  })

  it('falls back to synchronous compute when Worker construction throws', async () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('no workers here') } })
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\n', 'b\n', opts)
    await flush(); await nextTick()
    expect(w.usingFallback).toBe(true)
    expect(w.state.value).toBe('done')
    expect(w.model.value).not.toBeNull()
  })

  it('cancel returns to idle and drops the in-flight result', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\n', 'b\n', opts)
    w.cancel()
    await flush(); await nextTick()
    expect(w.state.value).toBe('idle')
    expect(w.model.value).toBeNull()
  })
})
