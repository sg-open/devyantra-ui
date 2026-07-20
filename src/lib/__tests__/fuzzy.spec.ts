import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzyFilter } from '../fuzzy'

const TOOL_NAMES = ['Text Compare', 'Delimiter', 'Code Formatter', 'JWT Decoder', 'Hash Generator', 'Base64 Tools', 'Timestamp', 'Character Count']
const top = (q: string) => fuzzyFilter(q, TOOL_NAMES, s => s)[0]

describe('fuzzyScore', () => {
  it('returns 0 when chars are missing or out of order', () => {
    expect(fuzzyScore('xyz', 'Text Compare')).toBe(0)
    // Resolved (was flagged honest-uncertainty in the brief): lowercased target is
    // 'text compare' — t(0) e(1) x(2) t(3) ' '(4) c(5) o(6) m(7) p(8) a(9) r(10) e(11).
    // The only 'c' is at index 5; scanning forward from index 6 ('ompare') there is no
    // 't' left. Both of the string's 't's (0 and 3) sit *before* the 'c', so no in-order
    // c-then-t subsequence exists at all — this isn't a greedy-vs-optimal alignment
    // question, there is no valid alignment. Per the stated rule ("every query char
    // must appear in order in target, else 0"), this must score 0, not > 0.
    expect(fuzzyScore('ct', 'Text Compare')).toBe(0)
  })
  it('ranks initials at word boundaries first', () => {
    expect(top('tc')).toBe('Text Compare')
    expect(top('cf')).toBe('Code Formatter')
    expect(top('cc')).toBe('Character Count')
  })
  it('finds abbreviations', () => {
    expect(top('b64')).toBe('Base64 Tools')
    expect(top('jwt')).toBe('JWT Decoder')
    expect(top('ts')).toBe('Timestamp')
  })
  it('substring queries beat scattered matches', () => {
    expect(top('hash')).toBe('Hash Generator')
    expect(top('form')).toBe('Code Formatter')
  })
  it('is case and diacritic insensitive', () => {
    expect(fuzzyScore('CAFE', 'café menu')).toBeGreaterThan(0)
  })
  it('empty query returns 0 (caller shows defaults)', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
  })
})
