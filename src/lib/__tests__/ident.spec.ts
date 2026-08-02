import { describe, it, expect } from 'vitest'
import { uuidV4, uuidV7, ulid, inspect } from '../ident'

// Standard 8-4-4-4-12 hex UUID shape, case-insensitive, pinned to a specific
// version nibble and the RFC 4122 variant nibble (8/9/a/b) that both
// crypto.randomUUID() (v4) and our hand-rolled uuidV7 must produce.
const uuidShapeRe = (version: string): RegExp =>
  new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, 'i')

// Crockford's Base32 alphabet, verbatim from the brief — notably excludes I, L, O, U.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ulidShapeRe = new RegExp(`^[${CROCKFORD}]{26}$`)

describe('uuidV4', () => {
  it('matches the standard UUID shape with version nibble 4', () => {
    expect(uuidV4()).toMatch(uuidShapeRe('4'))
  })

  it('produces a different value on every call', () => {
    expect(uuidV4()).not.toBe(uuidV4())
  })
})

describe('uuidV7', () => {
  it('matches the standard UUID shape with version nibble 7', () => {
    expect(uuidV7()).toMatch(uuidShapeRe('7'))
  })

  it("round-trips the given timestamp exactly through inspect()", () => {
    const T = Date.UTC(2026, 0, 15, 10, 30, 0, 123)
    const id = uuidV7(T)
    expect(inspect(id).timestamp?.getTime()).toBe(T)
  })

  it('defaults to Date.now() when no timestamp is given', () => {
    const before = Date.now()
    const id = uuidV7()
    const after = Date.now()
    const decoded = inspect(id).timestamp!.getTime()
    expect(decoded).toBeGreaterThanOrEqual(before)
    expect(decoded).toBeLessThanOrEqual(after)
  })

  it('is lexicographically sortable by generation time — the whole point of v7', () => {
    const earlier = uuidV7(Date.UTC(2020, 0, 1))
    const later = uuidV7(Date.UTC(2030, 0, 1))
    expect(earlier < later).toBe(true)
  })

  it('produces a different value on every call for the same timestamp (random suffix)', () => {
    const T = Date.UTC(2026, 0, 1)
    expect(uuidV7(T)).not.toBe(uuidV7(T))
  })
})

describe('ulid', () => {
  it('is 26 Crockford base32 characters', () => {
    expect(ulid()).toMatch(ulidShapeRe)
  })

  it('excludes the visually ambiguous letters I, L, O, U', () => {
    expect(ulid()).not.toMatch(/[ILOU]/)
  })

  it('round-trips the given timestamp exactly through inspect()', () => {
    const T = Date.UTC(2026, 0, 15, 10, 30, 0, 123)
    expect(inspect(ulid(T)).timestamp?.getTime()).toBe(T)
  })

  it('is lexicographically sortable by generation time', () => {
    const earlier = ulid(Date.UTC(2020, 0, 1))
    const later = ulid(Date.UTC(2030, 0, 1))
    expect(earlier < later).toBe(true)
  })

  it('produces strictly increasing values across 50 calls sharing one timestamp', () => {
    const T = Date.UTC(2026, 0, 1, 0, 0, 0, 0)
    const results = Array.from({ length: 50 }, () => ulid(T))
    for (let i = 1; i < results.length; i++) {
      expect(results[i]! > results[i - 1]!).toBe(true)
    }
    // Sanity: the shared time prefix really is identical across all 50 —
    // proving the ordering comes from the incrementing random suffix, not
    // from 50 calls happening to land at different `now` values.
    const prefixes = new Set(results.map((r) => r.slice(0, 10)))
    expect(prefixes.size).toBe(1)
  })

  it('draws fresh randomness (not an increment) once the timestamp changes', () => {
    const a = ulid(Date.UTC(2026, 0, 1, 0, 0, 0, 0))
    const b = ulid(Date.UTC(2026, 0, 1, 0, 0, 0, 1)) // 1ms later
    expect(a.slice(0, 10)).not.toBe(b.slice(0, 10)) // different time prefix
  })
})

describe('inspect', () => {
  describe('uuid', () => {
    it('reports kind/version/variant for a v4 id with no timestamp', () => {
      const info = inspect(uuidV4())
      expect(info.kind).toBe('uuid')
      expect(info.version).toBe(4)
      expect(info.variant).toBe('RFC 4122')
      expect(info.timestamp).toBeUndefined()
    })

    it("decodes a v7 id's timestamp", () => {
      const T = Date.UTC(2026, 5, 1, 12, 0, 0, 0)
      const info = inspect(uuidV7(T))
      expect(info.kind).toBe('uuid')
      expect(info.version).toBe(7)
      expect(info.timestamp?.getTime()).toBe(T)
    })

    it('reports version only for a v1 id — timestamp deliberately not decoded', () => {
      // Well-known RFC 4122 example UUID (version nibble '1', variant nibble '8').
      const info = inspect('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
      expect(info.kind).toBe('uuid')
      expect(info.version).toBe(1)
      expect(info.variant).toBe('RFC 4122')
      expect(info.timestamp).toBeUndefined()
    })

    it('accepts uppercase input (case-insensitive)', () => {
      const info = inspect(uuidV7().toUpperCase())
      expect(info.kind).toBe('uuid')
      expect(info.version).toBe(7)
    })

    it('tolerates surrounding whitespace', () => {
      const info = inspect(`  ${uuidV4()}  `)
      expect(info.kind).toBe('uuid')
    })
  })

  describe('ulid', () => {
    it('decodes kind and timestamp', () => {
      const T = Date.UTC(2026, 5, 1, 12, 0, 0, 0)
      const info = inspect(ulid(T))
      expect(info.kind).toBe('ulid')
      expect(info.timestamp?.getTime()).toBe(T)
      expect(info.version).toBeUndefined()
      expect(info.variant).toBeUndefined()
    })

    it('accepts lowercase input by uppercasing first', () => {
      const T = Date.UTC(2026, 5, 1, 12, 0, 0, 0)
      const info = inspect(ulid(T).toLowerCase())
      expect(info.kind).toBe('ulid')
      expect(info.timestamp?.getTime()).toBe(T)
    })
  })

  describe('unknown', () => {
    it('empty string', () => {
      expect(inspect('').kind).toBe('unknown')
    })

    it('garbage text', () => {
      expect(inspect('not-an-identifier').kind).toBe('unknown')
    })

    it('near-miss UUID (one hex digit short)', () => {
      expect(inspect('6ba7b810-9dad-11d1-80b4-00c04fd430c').kind).toBe('unknown')
    })

    it('near-miss ULID (25 chars, one short of 26)', () => {
      expect(inspect('01ARZ3NDEKTSV4RRFFQ69G5FA').kind).toBe('unknown')
    })

    it('a ULID-length string containing an excluded letter (I) is not mistaken for a ULID', () => {
      expect(inspect('IIIIIIIIIIIIIIIIIIIIIIIIII').kind).toBe('unknown')
    })

    it('a ULID whose first char is out of the valid time range (> \'7\') is rejected, even though it is a well-formed Crockford string (M6)', () => {
      expect(inspect('Z'.repeat(26)).kind).toBe('unknown')
    })
  })
})
