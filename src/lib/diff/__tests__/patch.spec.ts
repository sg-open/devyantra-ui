import { describe, it, expect } from 'vitest'
import { buildPatch } from '../patch'

describe('buildPatch', () => {
  it('emits a valid unified patch at the requested context', () => {
    const p = buildPatch('a\nb\nc\nd\ne\n', 'a\nb\nX\nd\ne\n', { context: 1 })
    expect(p).toContain('--- original')
    expect(p).toContain('+++ modified')
    expect(p).toContain('@@ -2,3 +2,3 @@')
    expect(p).toContain('-c')
    expect(p).toContain('+X')
    expect(p).not.toContain(' a\n') // context 1 excludes line a
  })

  it('uses real filenames when provided', () => {
    const p = buildPatch('x\n', 'y\n', { context: 3, leftName: 'config.old.json', rightName: 'config.json' })
    expect(p).toContain('--- config.old.json')
    expect(p).toContain('+++ config.json')
  })

  it('emits the no-newline marker for missing trailing newlines', () => {
    const p = buildPatch('a\nb', 'a\nc', { context: 3 })
    expect(p).toContain('\\ No newline at end of file')
  })

  it('Infinity context includes every line', () => {
    const p = buildPatch('a\nb\nc\n', 'a\nb\nX\n', { context: Infinity })
    expect(p).toContain(' a\n')
    expect(p).toContain(' b\n')
  })
})
