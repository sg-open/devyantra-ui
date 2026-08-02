import { describe, it, expect } from 'vitest'
import { parseJsonModel, computeStats, searchJsonTree, MAX_INPUT_BYTES, type JsonNode } from '../jsonModel'

// Narrows a JsonParseResult to its success branch, failing the test loudly
// (rather than a confusing "undefined.root" error) if parsing unexpectedly errored.
function expectRoot(input: string): JsonNode {
  const result = parseJsonModel(input)
  if ('error' in result) throw new Error(`expected success, got error: ${result.error.message}`)
  return result.root
}

function expectError(input: string): { message: string; position: number | null } {
  const result = parseJsonModel(input)
  if ('root' in result) throw new Error('expected an error, got a root')
  return result.error
}

const pathsOf = (node: JsonNode): string[] => {
  const out: string[] = [node.path]
  for (const child of node.children ?? []) out.push(...pathsOf(child))
  return out
}

describe('parseJsonModel — paths', () => {
  it('root path is always "$"', () => {
    expect(expectRoot('{}').path).toBe('$')
    expect(expectRoot('[]').path).toBe('$')
    expect(expectRoot('42').path).toBe('$')
  })

  it('builds dot-form nested object paths', () => {
    const root = expectRoot('{"a":{"b":1}}')
    expect(pathsOf(root)).toEqual(['$', '$.a', '$.a.b'])
  })

  it('builds bracket-form array-index paths', () => {
    const root = expectRoot('{"a":[10,20,30]}')
    expect(pathsOf(root)).toEqual(['$', '$.a', '$.a[0]', '$.a[1]', '$.a[2]'])
  })

  it('mixes object and array nesting (the users fixture from the e2e brief)', () => {
    const root = expectRoot('{"users":[{"name":"Ada"},{"name":"Lin"}]}')
    expect(pathsOf(root)).toEqual([
      '$',
      '$.users',
      '$.users[0]',
      '$.users[0].name',
      '$.users[1]',
      '$.users[1].name'
    ])
  })

  it('uses bracket-escaped form for a key that is not a valid identifier', () => {
    const root = expectRoot('{"weird key":1}')
    expect(root.children![0]!.path).toBe('$["weird key"]')
  })

  it('bracket-escapes keys starting with a digit, empty keys, and keys with special chars', () => {
    const root = expectRoot('{"0":"a","":"b","a-b":"c","a b":"d"}')
    const paths = root.children!.map((c) => c.path)
    expect(paths).toEqual(['$["0"]', '$[""]', '$["a-b"]', '$["a b"]'])
  })

  it('distinguishes an object key that LOOKS numeric (quoted bracket) from a real array index (unquoted bracket)', () => {
    const objRoot = expectRoot('{"0":"x"}')
    expect(objRoot.children![0]!.path).toBe('$["0"]')

    const arrRoot = expectRoot('["x"]')
    expect(arrRoot.children![0]!.path).toBe('$[0]')
  })

  it('accepts plain identifier keys (letters, digits after the first char, underscore, dollar) via dot form', () => {
    const root = expectRoot('{"_a":1,"$b":2,"c1":3}')
    expect(root.children!.map((c) => c.path)).toEqual(['$._a', '$.$b', '$.c1'])
  })
})

describe('parseJsonModel — key + type', () => {
  it('root has a null key; every other node has its own key string', () => {
    const root = expectRoot('{"a":1}')
    expect(root.key).toBeNull()
    expect(root.children![0]!.key).toBe('a')
  })

  it('array item nodes carry their index (as a string) as key', () => {
    const root = expectRoot('[7,8]')
    expect(root.children![0]!.key).toBe('0')
    expect(root.children![1]!.key).toBe('1')
  })

  it('types cover object/array/string/number/boolean/null', () => {
    const root = expectRoot('{"o":{},"a":[],"s":"x","n":1,"b":true,"z":null}')
    const typeByKey = Object.fromEntries(root.children!.map((c) => [c.key, c.type]))
    expect(typeByKey).toEqual({ o: 'object', a: 'array', s: 'string', n: 'number', b: 'boolean', z: 'null' })
  })

  it('leaf nodes (scalars) have no children property at all; containers always do, even when empty', () => {
    const root = expectRoot('{"o":{},"s":"x"}')
    const obj = root.children!.find((c) => c.key === 'o')!
    const str = root.children!.find((c) => c.key === 's')!
    expect(obj.children).toEqual([])
    expect(str.children).toBeUndefined()
  })
})

describe('parseJsonModel — previews', () => {
  it('object preview is "{N keys}" with correct singular/plural', () => {
    expect(expectRoot('{"a":1,"b":2,"c":3}').preview).toBe('{3 keys}')
    expect(expectRoot('{"a":1}').preview).toBe('{1 key}')
    expect(expectRoot('{}').preview).toBe('{0 keys}')
  })

  it('array preview is "[N items]" with correct singular/plural', () => {
    expect(expectRoot('[1,2,3,4,5]').preview).toBe('[5 items]')
    expect(expectRoot('[1]').preview).toBe('[1 item]')
    expect(expectRoot('[]').preview).toBe('[0 items]')
  })

  it('short strings preview quoted and untruncated', () => {
    expect(expectRoot('"hello"').preview).toBe('"hello"')
    expect(expectRoot('""').preview).toBe('""')
  })

  it('a string of exactly 40 chars previews in full with no ellipsis', () => {
    const s = 'a'.repeat(40)
    expect(expectRoot(JSON.stringify(s)).preview).toBe(`"${s}"`)
  })

  it('a string over 40 chars truncates to the first 40 chars plus an ellipsis', () => {
    const s = 'a'.repeat(41)
    const preview = expectRoot(JSON.stringify(s)).preview
    expect(preview).toBe(`"${'a'.repeat(40)}…"`)
    expect(preview.length).toBe(43) // 40 chars + ellipsis + 2 quotes
  })

  it('numbers, booleans, and null preview as their literal JSON text', () => {
    expect(expectRoot('123.5').preview).toBe('123.5')
    expect(expectRoot('true').preview).toBe('true')
    expect(expectRoot('false').preview).toBe('false')
    expect(expectRoot('null').preview).toBe('null')
  })
})

describe('parseJsonModel — size (bytes)', () => {
  it('matches an independently computed TextEncoder byte length for a nested, unicode-bearing value', () => {
    const value = { a: 'héllo', b: [1, 2, 'wörld'], café: true }
    const input = JSON.stringify(value)
    const root = expectRoot(input)
    expect(root.size).toBe(new TextEncoder().encode(JSON.stringify(value)).length)
  })

  it('empty object/array size is exactly 2 bytes', () => {
    expect(expectRoot('{}').size).toBe(2)
    expect(expectRoot('[]').size).toBe(2)
  })

  it('a scalar size is the byte length of its own JSON.stringify form', () => {
    expect(expectRoot('"ab"').size).toBe(4) // "ab" -> 4 bytes
    expect(expectRoot('42').size).toBe(2)
  })
})

describe('parseJsonModel — the 2 MB published limit', () => {
  it('accepts input at/under the limit', () => {
    const input = JSON.stringify('x'.repeat(MAX_INPUT_BYTES - 10))
    expect('root' in parseJsonModel(input)).toBe(true)
  })

  it('rejects input over the limit with an "Input is X MB; the limit is 2 MB" message and a null position', () => {
    const input = 'x'.repeat(3 * 1024 * 1024) // exactly 3 MiB of ASCII -> 3.00 MB, invalid JSON (irrelevant: size gate runs first)
    const error = expectError(input)
    expect(error.message).toBe('Input is 3.00 MB; the limit is 2 MB')
    expect(error.position).toBeNull()
  })

  it('measures bytes via TextEncoder, not JS string length (multi-byte chars count for more than 1)', () => {
    // Each '€' is 1 UTF-16 code unit but 3 UTF-8 bytes -> this string is under
    // the 2 MB *character* count but over the 2 MB *byte* count.
    const charsUnderByteLimitOver = Math.floor(MAX_INPUT_BYTES / 3) + 1000
    const input = JSON.stringify('€'.repeat(charsUnderByteLimitOver))
    const error = expectError(input)
    expect(error.message).toContain('the limit is 2 MB')
  })
})

describe('parseJsonModel — malformed JSON: position extraction from the native error', () => {
  it('extracts a numeric position when the engine message names one', () => {
    // V8: `Expected \',\' or \'}\' after property value in JSON at position 6 (line 1 column 7)`
    const error = expectError('{"a":1')
    expect(error.position).toBe(6)
    expect(error.message).toContain('position 6')
  })

  it('extracts position for a trailing-comma object', () => {
    // V8: `Expected double-quoted property name in JSON at position 7 ...`
    const error = expectError('{"a":1,}')
    expect(error.position).toBe(7)
  })

  it('falls back to null when the engine message has no extractable position', () => {
    // V8: `Unexpected token \'o\', "not json" is not valid JSON` — no "position" substring.
    const error = expectError('not json')
    expect(error.position).toBeNull()
    expect(error.message.length).toBeGreaterThan(0)
  })

  it('falls back to null for empty input ("Unexpected end of JSON input")', () => {
    const error = expectError('')
    expect(error.position).toBeNull()
  })
})

describe('parseJsonModel — pathologically deep nesting (F2)', () => {
  it('maps the buildNode RangeError (stack overflow) to a clean error-as-value instead of letting it escape the module', () => {
    const input = '['.repeat(3000) + '1' + ']'.repeat(3000)
    const error = expectError(input)
    expect(error.message).toBe('JSON is nested too deeply to explore')
    expect(error.position).toBeNull()
  })
})

describe('computeStats', () => {
  it('counts every non-root node as a "key" and finds the max nesting depth', () => {
    // $ (depth0) -> a (depth1, object) -> b (depth2, array) -> [0] (depth3, number)
    const root = expectRoot('{"a":{"b":[1]}}')
    expect(computeStats(root)).toEqual({ keys: 3, maxDepth: 3, bytes: root.size })
  })

  it('a bare scalar root has zero keys and zero depth', () => {
    const root = expectRoot('42')
    expect(computeStats(root)).toEqual({ keys: 0, maxDepth: 0, bytes: root.size })
  })

  it('array items count toward "keys" the same as object properties', () => {
    const root = expectRoot('{"users":[{"name":"Ada"},{"name":"Lin"}]}')
    // users, [0], [0].name, [1], [1].name = 5
    expect(computeStats(root).keys).toBe(5)
    expect(computeStats(root).maxDepth).toBe(3)
  })
})

describe('searchJsonTree', () => {
  const usersRoot = () => expectRoot('{"users":[{"name":"Ada"},{"name":"Lin"}]}')

  it('matches a string VALUE case-insensitively and marks its ancestors for expansion', () => {
    const { matches, expand } = searchJsonTree(usersRoot(), 'lin')
    expect(matches.has('$.users[1].name')).toBe(true)
    expect(matches.has('$.users[0].name')).toBe(false)
    // every ancestor of the match must be present so the UI can force them open
    expect(expand.has('$')).toBe(true)
    expect(expand.has('$.users')).toBe(true)
    expect(expand.has('$.users[1]')).toBe(true)
    // a sibling subtree with no match must not be force-expanded
    expect(expand.has('$.users[0]')).toBe(false)
  })

  it('matches a KEY name too', () => {
    const { matches } = searchJsonTree(usersRoot(), 'name')
    expect(matches.has('$.users[0].name')).toBe(true)
    expect(matches.has('$.users[1].name')).toBe(true)
  })

  it('empty/whitespace query matches nothing', () => {
    expect(searchJsonTree(usersRoot(), '').matches.size).toBe(0)
    expect(searchJsonTree(usersRoot(), '   ').expand.size).toBe(0)
  })

  it('no match anywhere yields empty sets', () => {
    const { matches, expand } = searchJsonTree(usersRoot(), 'zzz-nope')
    expect(matches.size).toBe(0)
    expect(expand.size).toBe(0)
  })
})
