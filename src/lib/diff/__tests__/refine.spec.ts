import { describe, it, expect } from 'vitest'
import { refineSegments, refineRows } from '../refine'
import type { DiffRow } from '../model'

const joined = (segs: { text: string }[]) => segs.map(s => s.text).join('')
const changed = (segs: { text: string; changed: boolean }[]) => segs.filter(s => s.changed).map(s => s.text)

describe('refineSegments', () => {
  it('segments word-level change', () => {
    const r = refineSegments('the quick brown fox', 'the slow brown fox')!
    expect(joined(r.removed)).toBe('the quick brown fox')
    expect(joined(r.added)).toBe('the slow brown fox')
    expect(changed(r.removed)).toEqual(['quick'])
    expect(changed(r.added)).toEqual(['slow'])
  })

  it('audit repro №18: ZWJ emoji family stays one unit', () => {
    const r = refineSegments('family 👨‍👩‍👧', 'family 👨‍👩‍👦')!
    // the whole family glyph is the changed unit — never a bare child glyph with a leftover ZWJ prefix
    expect(changed(r.removed)).toEqual(['👨‍👩‍👧'])
    expect(changed(r.added)).toEqual(['👨‍👩‍👦'])
  })

  it('combining-mark difference never isolates a dangling accent', () => {
    const decomposed = 'café'
    const r = refineSegments(decomposed, 'cafe')!
    for (const seg of [...r.removed, ...r.added]) {
      expect(seg.text.startsWith('́')).toBe(false)
    }
    expect(joined(r.removed)).toBe(decomposed)
  })

  it('CJK single-character change is precise', () => {
    const r = refineSegments('今日は良い天気です', '今日は悪い天気です')!
    expect(changed(r.removed)).toEqual(['良'])
    expect(changed(r.added)).toEqual(['悪'])
  })

  it('returns null over 5000 chars or over 60% length disparity', () => {
    expect(refineSegments('x'.repeat(5001), 'y')).toBeNull()
    expect(refineSegments('short', 'this is a very much longer line of text entirely')).toBeNull()
  })
})

describe('refineRows', () => {
  it('attaches segments only to paired rows', () => {
    const rows: DiffRow[] = [
      { kind: 'context', leftNo: 1, rightNo: 1, text: 'same' },
      { kind: 'removed', leftNo: 2, text: 'the quick fox' },
      { kind: 'added', rightNo: 2, text: 'the slow fox' },
      { kind: 'added', rightNo: 3, text: 'unpaired extra' }
    ]
    refineRows(rows)
    expect((rows[1] as { segments?: unknown }).segments).toBeDefined()
    expect((rows[2] as { segments?: unknown }).segments).toBeDefined()
    expect((rows[3] as { segments?: unknown }).segments).toBeUndefined()
  })
})
