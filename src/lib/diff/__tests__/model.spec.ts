import { describe, it, expect } from 'vitest'
import { diffLines } from 'diff'
import { buildDiffModel, toSplitRows, type DiffRow } from '../model'

const model = (l: string, r: string, ctx: number) => buildDiffModel(diffLines(l, r), ctx)

const kinds = (rows: DiffRow[]) => rows.map(r => r.kind)

describe('buildDiffModel', () => {
  it('builds context/removed/added rows with correct 1-based line numbers', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\n', Infinity)
    expect(kinds(m.rows)).toEqual(['context', 'removed', 'added', 'context'])
    expect(m.rows[0]).toEqual({ kind: 'context', leftNo: 1, rightNo: 1, text: 'a' })
    expect(m.rows[1]).toMatchObject({ kind: 'removed', leftNo: 2, text: 'b' })
    expect(m.rows[2]).toMatchObject({ kind: 'added', rightNo: 2, text: 'X' })
    expect(m.rows[3]).toEqual({ kind: 'context', leftNo: 3, rightNo: 3, text: 'c' })
  })

  it('counts paired removed+added as modified in stats', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\nd\n', Infinity)
    expect(m.stats).toEqual({ added: 1, removed: 0, modified: 1 })
  })

  it('audit repro №9: SQL -- / ++ content lines stay ONE coherent model at context 0', () => {
    const left = 'SELECT 1;\n-- old comment\nl3\nl4\nl5\nEND;\n'
    const right = 'SELECT 1;\n++ new note\nl3\nl4\nl5\nFINISH;\n'
    const m = model(left, right, 0)
    // both changes present, nothing dropped, no phantom file split possible (no reparse)
    const removed = m.rows.filter(r => r.kind === 'removed').map(r => (r as { text: string }).text)
    const added = m.rows.filter(r => r.kind === 'added').map(r => (r as { text: string }).text)
    expect(removed).toEqual(['-- old comment', 'END;'])
    expect(added).toEqual(['++ new note', 'FINISH;'])
    expect(m.stats.modified).toBe(2)
  })

  it('audit repro №17: literal "\\ No newline at end of file" as CONTENT survives', () => {
    const marker = '\\ No newline at end of file'
    const m = model(`${marker}\nsame\n`, `CHANGED\nsame\n`, Infinity)
    expect(m.rows[0]).toMatchObject({ kind: 'removed', text: marker })
  })

  it('pure insertion and pure deletion are both represented (№8 basis)', () => {
    const ins = model('a\nb\n', 'a\nb\nc\nd\n', Infinity)
    expect(kinds(ins.rows)).toEqual(['context', 'context', 'added', 'added'])
    const del = model('a\nb\nc\n', 'a\n', Infinity)
    expect(kinds(del.rows)).toEqual(['context', 'removed', 'removed'])
  })

  it('context filtering inserts gap rows with exact hidden counts', () => {
    const left = Array.from({ length: 21 }, (_, i) => `l${i + 1}`).join('\n') + '\n'
    const right = left.replace('l11', 'CHANGED')
    const m = model(left, right, 3)
    expect(kinds(m.rows)).toEqual([
      'gap', 'context', 'context', 'context', 'removed', 'added', 'context', 'context', 'context', 'gap'
    ])
    expect(m.rows[0]).toEqual({ kind: 'gap', hiddenCount: 7 })
    expect(m.rows[9]).toEqual({ kind: 'gap', hiddenCount: 7 })
    // line numbers still correct after the gap
    expect(m.rows[1]).toMatchObject({ leftNo: 8, rightNo: 8 })
  })

  it('context 0 keeps only changed rows and gaps', () => {
    const m = model('a\nb\nc\n', 'a\nX\nc\n', 0)
    expect(kinds(m.rows)).toEqual(['gap', 'removed', 'added', 'gap'])
  })

  it('no gap rows when nothing is hidden', () => {
    const m = model('a\nb\n', 'a\nX\n', 3)
    expect(kinds(m.rows)).toEqual(['context', 'removed', 'added'])
  })

  it('I6: identical inputs produce zero-change stats and empty rows', () => {
    // Not "every row is context" — that's vacuously true for an empty array too,
    // so it would never have caught the bug this test now guards: at 250k+ lines,
    // a non-empty `all`-context `rows` array here previously masqueraded as a
    // legitimate result but exceeded computeDiffModel's row-count "too-large"
    // refusal for inputs that hadn't actually changed at all. The empty state
    // renders from `stats`, not `rows`, so there is nothing to return here.
    const m = model('a\nb\n', 'a\nb\n', 3)
    expect(m.stats).toEqual({ added: 0, removed: 0, modified: 0 })
    expect(m.rows).toEqual([])
  })

  it('I6: identical inputs produce empty rows at Infinity context too', () => {
    const m = model('a\nb\n', 'a\nb\n', Infinity)
    expect(m.stats).toEqual({ added: 0, removed: 0, modified: 0 })
    expect(m.rows).toEqual([])
  })
})

describe('toSplitRows', () => {
  it('pairs removed/added runs index-wise with placeholders for the excess', () => {
    const m = model('a\nb\nc\n', 'a\nX\nY\nc\n', Infinity)
    // removed: [b]; added: [X, Y]
    const split = toSplitRows(m.rows)
    expect(split).toHaveLength(4)
    expect(split[1]!.left!.row).toMatchObject({ kind: 'removed', text: 'b' })
    expect(split[1]!.right!.row).toMatchObject({ kind: 'added', text: 'X' })
    expect(split[2]!.left).toBeNull()
    expect(split[2]!.right!.row).toMatchObject({ kind: 'added', text: 'Y' })
  })

  it('gap rows span both sides', () => {
    const m = model('a\nb\nc\nd\ne\nf\ng\nh\ni\n', 'a\nb\nc\nd\nX\nf\ng\nh\ni\n', 1)
    const split = toSplitRows(m.rows)
    expect(split[0]!.left!.row.kind).toBe('gap')
    expect(split[0]!.right!.row.kind).toBe('gap')
  })
})
