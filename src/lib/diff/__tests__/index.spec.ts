import { describe, it, expect } from 'vitest'
import { computeDiffModel, LIMITS } from '../index'

const opts = { ignoreWhitespace: false, ignoreCase: false, context: 3 }

describe('computeDiffModel', () => {
  it('produces a refined model end-to-end', () => {
    const r = computeDiffModel('the quick fox\n', 'the slow fox\n', opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats.modified).toBe(1)
      const removed = r.model.rows.find(row => row.kind === 'removed')
      expect((removed as { segments?: unknown[] }).segments).toBeDefined()
    }
  })

  it('audit headline: CRLF vs LF inputs → zero changed rows + eol indicator', () => {
    const r = computeDiffModel('a\r\nb\r\nc', 'a\nb\nc', opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
      expect(r.model.indicators.some(i => i.kind === 'eol-differs')).toBe(true)
    }
  })

  it('fold semantics carry over: case + whitespace fold for comparison', () => {
    const r = computeDiffModel('Hello   World\n', 'hello world\n', { ...opts, ignoreCase: true, ignoreWhitespace: true })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
  })

  it('rejects oversized input with a named limit, never truncating silently', () => {
    const big = 'x'.repeat(LIMITS.maxBytesPerSide + 1)
    const r = computeDiffModel(big, 'small', opts)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.detail).toMatch(/limit is 5 MB/)
  })

  it('C2: a trailing-newline-only difference is pure context, not a phantom modified last line', () => {
    const r = computeDiffModel('a\nb', 'a\nb\n', opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
      expect(r.model.indicators.some(i => i.kind === 'no-trailing-newline-left')).toBe(true)
      expect(r.model.rows.some(row => row.kind === 'removed' || row.kind === 'added')).toBe(false)
    }
  })

  it('I6: two identical 250,000-line strings compute as ok with empty rows, never a too-large refusal', () => {
    const big = Array.from({ length: 250_000 }, (_, i) => `line ${i}`).join('\n')
    const r = computeDiffModel(big, big, opts)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.model.stats).toEqual({ added: 0, removed: 0, modified: 0 })
      expect(r.model.rows).toEqual([])
    }
  })
})
