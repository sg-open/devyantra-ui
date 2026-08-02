import { describe, it, expect } from 'vitest'
import { parseUrl, buildUrl, type ParsedUrl } from '../urlparse'

describe('parseUrl', () => {
  it('decomposes a plain https URL into scheme/host/port/path/hash/params', () => {
    const p = parseUrl('https://example.com/only-query?a=1')
    expect(p.scheme).toBe('https')
    expect(p.host).toBe('example.com')
    expect(p.port).toBe('')
    expect(p.path).toBe('/only-query')
    expect(p.hash).toBe('')
    expect(p.params).toEqual([{ key: 'a', value: '1' }])
    expect(p.hostUnicode).toBeNull()
  })

  it('PINNED: unicode host decodes to punycode with hostUnicode carrying the input authority', () => {
    const p = parseUrl('https://bücher.example/x')
    expect(p.host).toBe('xn--bcher-kva.example')
    expect(p.hostUnicode).toBe('bücher.example')
  })

  it('hostUnicode is null for a plain-ASCII host, even one that happens to contain hyphens/digits', () => {
    const p = parseUrl('https://sub-1.example.com/x')
    expect(p.host).toBe('sub-1.example.com')
    expect(p.hostUnicode).toBeNull()
  })

  it('preserves repeated keys, in order, even when interleaved with other keys', () => {
    const p = parseUrl('https://example.com/x?tag=a&other=z&tag=b&tag=c')
    expect(p.params).toEqual([
      { key: 'tag', value: 'a' },
      { key: 'other', value: 'z' },
      { key: 'tag', value: 'b' },
      { key: 'tag', value: 'c' }
    ])
  })

  it('preserves empty values, including a bare key with no "=" at all', () => {
    const p = parseUrl('https://example.com/x?a=&b=2&flag')
    expect(p.params).toEqual([
      { key: 'a', value: '' },
      { key: 'b', value: '2' },
      { key: 'flag', value: '' }
    ])
  })

  it('decodes "+" in a query value as a literal space (application/x-www-form-urlencoded policy)', () => {
    const p = parseUrl('https://example.com/search?q=hello+world&tag=a&tag=b#top')
    expect(p.params).toEqual([
      { key: 'q', value: 'hello world' },
      { key: 'tag', value: 'a' },
      { key: 'tag', value: 'b' }
    ])
    expect(p.hash).toBe('top')
  })

  it('reads hash and query together without either one disturbing the other', () => {
    const p = parseUrl('https://example.com/x?a=1&b=2#section-2')
    expect(p.hash).toBe('section-2')
    expect(p.params).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' }
    ])
  })

  it('resolves a relative input against a base URL', () => {
    const p = parseUrl('/a?b=1', 'https://x.dev')
    expect(p.scheme).toBe('https')
    expect(p.host).toBe('x.dev')
    expect(p.path).toBe('/a')
    expect(p.params).toEqual([{ key: 'b', value: '1' }])
  })

  it('throws (the platform TypeError) for a relative input with no base', () => {
    expect(() => parseUrl('/a?b=1')).toThrow(TypeError)
  })

  it('throws (the platform TypeError) for a structurally invalid URL', () => {
    expect(() => parseUrl('ht!tp:/x')).toThrow(TypeError)
  })

  describe('default-port elision', () => {
    it('elides the default port for https (443)', () => {
      expect(parseUrl('https://example.com:443/x').port).toBe('')
    })

    it('elides the default port for http (80)', () => {
      expect(parseUrl('http://example.com:80/x').port).toBe('')
    })

    it('keeps a non-default port', () => {
      expect(parseUrl('https://example.com:8443/x').port).toBe('8443')
    })

    it('is empty when no port was given at all', () => {
      expect(parseUrl('https://example.com/x').port).toBe('')
    })
  })

  it('scope limitation: userinfo (user:pass@) is not part of the interface and is silently dropped from host', () => {
    const p = parseUrl('https://user:pass@example.com/x')
    expect(p.host).toBe('example.com')
  })
})

describe('buildUrl', () => {
  it('reassembles a scheme/host/port/path/hash/params ParsedUrl back into a URL string', () => {
    const p: ParsedUrl = {
      scheme: 'https',
      host: 'example.com',
      port: '8443',
      path: '/a/b',
      hash: 'frag',
      params: [{ key: 'x', value: '1' }],
      hostUnicode: null
    }
    expect(buildUrl(p)).toBe('https://example.com:8443/a/b?x=1#frag')
  })

  it('omits the port entirely when empty', () => {
    const p: ParsedUrl = {
      scheme: 'https', host: 'example.com', port: '', path: '/x', hash: '', params: [], hostUnicode: null
    }
    expect(buildUrl(p)).toBe('https://example.com/x')
  })

  it('omits "?" and "#" entirely when there are no params and no hash', () => {
    const p: ParsedUrl = {
      scheme: 'https', host: 'example.com', port: '', path: '/no-query-or-hash', hash: '', params: [], hostUnicode: null
    }
    expect(buildUrl(p)).toBe('https://example.com/no-query-or-hash')
  })

  it('re-serializes repeated keys in their given order', () => {
    const p: ParsedUrl = {
      scheme: 'https',
      host: 'example.com',
      port: '',
      path: '/x',
      hash: '',
      params: [
        { key: 'tag', value: 'a' },
        { key: 'other', value: 'z' },
        { key: 'tag', value: 'b' }
      ],
      hostUnicode: null
    }
    expect(buildUrl(p)).toBe('https://example.com/x?tag=a&other=z&tag=b')
  })

  it('PINNED: "+"->%20 documented round-trip — a "+"-encoded space comes back out as "%20"', () => {
    const rebuilt = buildUrl(parseUrl('https://example.com/search?q=hello+world&tag=a&tag=b#top'))
    expect(rebuilt).toBe('https://example.com/search?q=hello%20world&tag=a&tag=b#top')
  })

  it('does not mistake a literal "+" character in a value for an encoded space', () => {
    const p: ParsedUrl = {
      scheme: 'https', host: 'example.com', port: '', path: '/x', hash: '',
      params: [{ key: 'sum', value: '1+1=2' }], hostUnicode: null
    }
    // The literal '+' is independently percent-encoded (to %2B) by URLSearchParams,
    // so the blanket +->%20 normalization can never touch it.
    expect(buildUrl(p)).toBe('https://example.com/x?sum=1%2B1%3D2')
  })

  it('reflects edits made to the params array (the live query-editor use case)', () => {
    const parsed = parseUrl('https://example.com/search?q=hello+world&tag=a&tag=b#top')
    parsed.params[0]!.value = 'bye'
    parsed.params.splice(1, 1) // delete the first "tag" row
    const rebuilt = buildUrl(parsed)
    expect(rebuilt).toBe('https://example.com/search?q=bye&tag=b#top')
  })

  describe('idempotency: build(parse(u)) === u for a normalized fixture set', () => {
    const fixtures = [
      'https://example.com/path/to/thing?a=1&b=2&b=3#section',
      'https://example.com/',
      'http://sub.example.co.uk:8080/a/b?x=y#z',
      'https://example.com/search?q=cats&tag=x&tag=y',
      'https://example.com/no-query-or-hash',
      'https://example.com/only-hash#top',
      'https://example.com/only-query?a=1',
      'https://example.com/x?q=hello%20world' // already-normalized space form round-trips exactly
    ]

    for (const u of fixtures) {
      it(u, () => {
        expect(buildUrl(parseUrl(u))).toBe(u)
      })
    }
  })
})
