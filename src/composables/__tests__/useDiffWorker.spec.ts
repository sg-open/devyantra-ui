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

  it('I4: cancel terminates the worker so a fresh instance is built for the next compute, which resolves promptly', async () => {
    let constructCount = 0
    class CountingFakeWorker {
      onmessage: ((e: MessageEvent) => void) | null = null
      terminated = false
      constructor() {
        constructCount++
      }
      postMessage(req: DiffRequest) {
        // "first" is deliberately slow; if cancel() didn't terminate this
        // instance and hand the next request to a fresh one, a naive
        // same-instance implementation would still resolve promptly here too
        // (independent timers) — the real proof is the constructor count
        // below, and that a terminated instance never delivers a result.
        const delay = req.left === 'first' ? 1000 : 0
        setTimeout(() => {
          if (this.terminated) return // a terminated worker must never land a result
          const result = computeDiffModel(req.left, req.right, req.options)
          this.onmessage?.({ data: { id: req.id, result } } as MessageEvent)
        }, delay)
      }
      terminate() {
        this.terminated = true
      }
    }
    vi.stubGlobal('Worker', CountingFakeWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()

    w.compute('first', 'first-b', opts)
    expect(constructCount).toBe(1)

    w.cancel()
    w.compute('second', 'second-b', opts)
    expect(constructCount).toBe(2) // cancel() nulled the terminated worker; getWorker() built a fresh one

    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    const removed = w.model.value!.rows.find(r => r.kind === 'removed') as { text: string }
    expect(removed.text).toBe('second')
  })

  it('I5: a runtime worker error (onerror) falls back to a synchronous compute so the request still completes', async () => {
    // This test chains two real setTimeout(fn, 0) hops: the worker's onerror
    // firing, then the synchronous-fallback timer that handler schedules in
    // turn. Both used to have to land inside a single fixed-duration
    // wall-clock flush() — under full-suite parallel load the second hop
    // occasionally missed that window, flaking the assertions below. Fake
    // timers plus runAllTimersAsync() drain both chained hops deterministically,
    // independent of real wall-clock scheduling pressure.
    vi.useFakeTimers()
    try {
      class ErroringWorker {
        onmessage: ((e: MessageEvent) => void) | null = null
        onerror: ((e: unknown) => void) | null = null
        constructor() {
          // Never responds via onmessage — only the runtime failure fires.
          setTimeout(() => this.onerror?.(new Event('error')), 0)
        }
        postMessage() {
          /* never responds */
        }
        terminate() {}
      }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.stubGlobal('Worker', ErroringWorker)
      const { useDiffWorker } = await import('@/composables/useDiffWorker')
      const w = useDiffWorker()
      w.compute('a\nb\n', 'a\nX\n', opts)
      await vi.runAllTimersAsync(); await nextTick()
      expect(w.state.value).toBe('done')
      expect(w.usingFallback).toBe(true)
      expect(w.model.value!.stats.modified).toBe(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      warnSpy.mockRestore()
    } finally {
      // Scoped to this test only — every other test in this file still runs
      // on real timers via flush(), so fake timers must not leak past here.
      vi.useRealTimers()
    }
  })

  it('I5: a well-formed {id, error} response lands in the error state with its detail', async () => {
    class ErrorMessageWorker {
      onmessage: ((e: MessageEvent) => void) | null = null
      postMessage(req: DiffRequest) {
        setTimeout(() => {
          this.onmessage?.({ data: { id: req.id, error: 'boom' } } as MessageEvent)
        }, 0)
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', ErrorMessageWorker)
    const { useDiffWorker } = await import('@/composables/useDiffWorker')
    const w = useDiffWorker()
    w.compute('a\n', 'b\n', opts)
    await flush(); await nextTick()
    expect(w.state.value).toBe('error')
    expect(w.errorDetail.value).toBe('boom')
  })
})
