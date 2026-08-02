import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { computeRegexResult, type RegexRequest } from '@/workers/regex.worker'

// FakeWorker replicates exactly what regex.worker.ts's self.onmessage does
// (try computeRegexResult, catch → {id, error}) — a real Worker can't run
// under jsdom, so this test double stands in for the whole worker, not just
// the postMessage transport.
class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage(req: RegexRequest) {
    setTimeout(() => {
      try {
        const result = computeRegexResult(req.pattern, req.flags, req.testString, req.replacement)
        this.onmessage?.({ data: { id: req.id, result } } as MessageEvent)
      } catch (err) {
        this.onmessage?.({ data: { id: req.id, error: err instanceof Error ? err.message : String(err) } } as MessageEvent)
      }
    }, 0)
  }
  terminate() {}
}

const flush = () => new Promise(r => setTimeout(r, 5))

describe('useRegexWorker', () => {
  beforeEach(() => vi.resetModules())

  it('computes via the worker and lands in done with positional groups', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '(\\d+)-(\\d+)', flags: '', testString: '12-34', replacement: null })
    expect(w.state.value).toBe('computing')
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.result.value!.matches).toHaveLength(1)
    expect(w.result.value!.matches[0].match).toBe('12-34')
    expect(w.result.value!.matches[0].groups).toEqual([
      { name: null, value: '12' },
      { name: null, value: '34' }
    ])
  })

  it('named groups surface both the name and the value alongside the positional entry', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '(?<year>\\d{4})', flags: '', testString: 'Born in 1990 ok', replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    const groups = w.result.value!.matches[0].groups
    expect(groups).toContainEqual({ name: null, value: '1990' })
    expect(groups).toContainEqual({ name: 'year', value: '1990' })
  })

  it('a zero-length pattern (a* on "bb") terminates with a finite number of matches', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: 'a*', flags: '', testString: 'bb', replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    // One zero-length match at each position (0, 1, 2) — the lastIndex guard
    // is what keeps this loop from spinning forever on index 0.
    expect(w.result.value!.matches).toHaveLength(3)
    expect(w.result.value!.matches.every(m => m.match === '')).toBe(true)
    expect(w.result.value!.truncated).toBe(false)
  })

  it('u-flag zero-length guard: astral characters (surrogate pairs) do not cause an infinite loop (F3)', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    // '😀' is a surrogate pair (2 UTF-16 code units); naively incrementing
    // lastIndex by 1 after a zero-length match lands mid-surrogate, and the
    // /u flag then snaps exec() back to the start of the pair — an infinite
    // loop at index 0 without the codePointAt-aware guard.
    w.run({ pattern: 'x*', flags: 'gu', testString: '😀a', replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    // 3 zero-length matches: before the emoji (0), after the emoji/before
    // "a" (2 — the emoji occupies code units 0-1), and after "a" (3, end of
    // string). Empirically verified against the fixed algorithm.
    expect(w.result.value!.matches).toHaveLength(3)
    expect(w.result.value!.matches.map((m) => m.index)).toEqual([0, 2, 3])
    expect(w.result.value!.matches.every((m) => m.match === '')).toBe(true)
    expect(w.result.value!.truncated).toBe(false)
  }, 3000)

  it('caps at 10,000 matches and reports truncated', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    // 'x*' zero-length-matches every position of a 10,050-char string with no 'x' in it.
    w.run({ pattern: 'x*', flags: '', testString: 'y'.repeat(10050), replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.result.value!.matches).toHaveLength(10000)
    expect(w.result.value!.truncated).toBe(true)
  })

  it('an invalid pattern lands in the error state with the SyntaxError text', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '(', flags: '', testString: 'x', replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('error')
    expect(w.errorDetail.value).toMatch(/Invalid regular expression/)
    expect(w.errorDetail.value).toMatch(/Unterminated group/)
  })

  it('supersede: only the second run lands', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '\\d+', flags: 'g', testString: 'first-1', replacement: null })
    w.run({ pattern: '\\d+', flags: 'g', testString: 'second-22', replacement: null })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.result.value!.matches).toHaveLength(1)
    expect(w.result.value!.matches[0].match).toBe('22')
  })

  it('replacement with $<name> substitutes the named group', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '(?<word>foo)', flags: '', testString: 'foo bar', replacement: '<$<word>>' })
    await flush(); await nextTick()
    expect(w.state.value).toBe('done')
    expect(w.result.value!.replaced).toBe('<foo> bar')
  })

  it('falls back to a synchronous result when Worker construction throws', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('no workers here')
        }
      }
    )
    const { useRegexWorker } = await import('@/composables/useRegexWorker')
    const w = useRegexWorker()
    w.run({ pattern: '\\d+', flags: 'g', testString: 'a1b22', replacement: null })
    await flush(); await nextTick()
    expect(w.usingFallback).toBe(true)
    expect(w.state.value).toBe('done')
    expect(w.result.value!.matches).toHaveLength(2)
  })

  it('timeout: a worker that never responds times out at 2000ms, and the next run constructs a fresh Worker', async () => {
    vi.useFakeTimers()
    try {
      let constructCount = 0
      class NeverRespondingWorker {
        onmessage: ((e: MessageEvent) => void) | null = null
        terminated = false
        constructor() {
          constructCount++
        }
        postMessage() {
          /* never responds — simulates catastrophic backtracking */
        }
        terminate() {
          this.terminated = true
        }
      }
      vi.stubGlobal('Worker', NeverRespondingWorker)
      const { useRegexWorker } = await import('@/composables/useRegexWorker')
      const w = useRegexWorker()

      w.run({ pattern: '(a+)+$', flags: '', testString: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!', replacement: null })
      expect(constructCount).toBe(1)
      expect(w.state.value).toBe('computing')

      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(w.state.value).toBe('timeout')

      // A fresh Worker must be constructed for the next run — the timed-out
      // instance was terminated and nulled, never reused.
      w.run({ pattern: 'a', flags: '', testString: 'a', replacement: null })
      expect(constructCount).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
