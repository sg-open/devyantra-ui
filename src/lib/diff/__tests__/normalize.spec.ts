import { describe, it, expect } from 'vitest'
import { detectEol, normalizePair } from '../normalize'

describe('detectEol', () => {
  it.each([
    ['a\nb\n', 'lf'],
    ['a\r\nb\r\n', 'crlf'],
    ['a\rb\r', 'cr'],
    ['a\r\nb\n', 'mixed'],
    ['single line', 'none'],
    ['', 'none']
  ])('detects %j as %s', (text, expected) => {
    expect(detectEol(text)).toBe(expected)
  })
})

describe('normalizePair', () => {
  it('normalizes CRLF and lone CR to LF', () => {
    const r = normalizePair('a\r\nb\r\nc', 'a\nb\nc')
    expect(r.left).toBe('a\nb\nc')
    expect(r.right).toBe('a\nb\nc')
  })

  it('emits eol-differs with named styles when sides disagree', () => {
    const r = normalizePair('a\r\nb', 'a\nb')
    const eol = r.indicators.find(i => i.kind === 'eol-differs')
    expect(eol).toBeDefined()
    expect(eol!.detail).toBe('Line endings differ: left CRLF, right LF')
  })

  it('emits no eol indicator when styles match or either side has none', () => {
    expect(normalizePair('a\r\nb', 'c\r\nd').indicators).toEqual([])
    expect(normalizePair('one line', 'a\nb').indicators).toEqual([])
  })

  it('audit repro: CR-only file no longer corrupts — normalizes to 3 clean lines', () => {
    const r = normalizePair('one\rtwo\rthree', 'one\ntwo\nthree')
    expect(r.left).toBe('one\ntwo\nthree')
    expect(r.left.split('\n')).toHaveLength(3)
  })

  it('strips UTF-8 BOM and reports the side', () => {
    const r = normalizePair('﻿hello', 'hello')
    expect(r.left).toBe('hello')
    expect(r.indicators).toContainEqual({ kind: 'bom-left', detail: 'Byte-order mark present in left input' })
    expect(r.indicators.find(i => i.kind === 'bom-right')).toBeUndefined()
  })

  it('reports missing trailing newline per side only when the other side has one', () => {
    const r = normalizePair('a\nb', 'a\nb\n')
    expect(r.indicators).toContainEqual({
      kind: 'no-trailing-newline-left',
      detail: 'No newline at end of left input'
    })
    // identical trailing state → no indicator
    expect(normalizePair('a\nb', 'c\nb').indicators).toEqual([])
  })

  it('mixed endings are named in the indicator', () => {
    const r = normalizePair('a\r\nb\nc', 'a\nb\nc\n')
    const eol = r.indicators.find(i => i.kind === 'eol-differs')
    expect(eol!.detail).toBe('Line endings differ: left mixed, right LF')
  })
})
