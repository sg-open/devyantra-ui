/**
 * jsonModel.ts — pure JSON-tree engine for the JSON Explorer tool (spec D3).
 *
 * `parseJsonModel` turns a raw JSON string into a navigable `JsonNode` tree:
 * every node carries a JSONPath-ish `path` (dot form `$.a.b[3]`; bracket
 * form `$["weird key"]` when a key isn't a valid identifier) that the UI
 * copies verbatim when a key is clicked, plus a short display `preview` and
 * a byte `size`.
 *
 * Two things that matter for callers:
 *   - `preview` truncates strings at 40 chars, so it is NOT enough to
 *     reconstruct the original value. A caller that needs the exact parsed
 *     data (e.g. the tool's "copy formatted JSON" action) must re-run
 *     `JSON.parse` on the same input itself — this module deliberately does
 *     not return the raw value; the normative return shape is `{ root }`.
 *   - `computeStats` and `searchJsonTree` are pure `JsonNode`-tree walks
 *     with zero Vue/DOM dependency, so they live here next to the type they
 *     walk rather than duplicated inline in the component layer.
 */

export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonNode {
  key: string | null
  path: string
  type: JsonNodeType
  children?: JsonNode[]
  preview: string
  size: number
}

export interface JsonParseError {
  message: string
  position: number | null
}

export type JsonParseResult = { root: JsonNode } | { error: JsonParseError }

/** Published limit (FAQ: "kept snappy + synchronous; larger payloads belong in an editor"). */
export const MAX_INPUT_BYTES = 2 * 1024 * 1024

const STRING_PREVIEW_LIMIT = 40

// ASCII identifier check (ES identifier grammar, minus Unicode escapes) — good
// enough to decide dot-vs-bracket notation. Anything that fails this (empty,
// starts with a digit, contains spaces/punctuation, non-ASCII, ...) simply
// falls back to the always-valid bracket form, so this never under-covers.
const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

const byteLength = (s: string): number => new TextEncoder().encode(s).length

const isValidIdentifier = (key: string): boolean => IDENTIFIER_RE.test(key)

/** Object-property child path: dot form for identifier keys, quoted-bracket form otherwise. */
const objectChildPath = (parentPath: string, key: string): string =>
  isValidIdentifier(key) ? `${parentPath}.${key}` : `${parentPath}[${JSON.stringify(key)}]`

/** Array-item child path: always an unquoted bracket index — never confused with a same-looking object key. */
const arrayChildPath = (parentPath: string, index: number): string => `${parentPath}[${index}]`

const pluralize = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

const previewString = (value: string): string => {
  const truncated = value.length > STRING_PREVIEW_LIMIT ? `${value.slice(0, STRING_PREVIEW_LIMIT)}…` : value
  return `"${truncated}"`
}

function typeOf(value: unknown): JsonNodeType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      // JSON.parse can only ever produce object/array/string/number/boolean/null.
      return 'object'
  }
}

function buildNode(value: unknown, key: string | null, path: string): JsonNode {
  const type = typeOf(value)

  if (type === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    const children = keys.map((k) => buildNode(obj[k], k, objectChildPath(path, k)))
    // Minimal-JSON.stringify byte size, built bottom-up from already-computed
    // child sizes (avoids re-stringifying whole subtrees at every level).
    const entryBytes = keys.map((k, i) => byteLength(JSON.stringify(k)) + 1 + children[i]!.size) // "key": + child
    const size = entryBytes.length === 0 ? 2 : 2 + (entryBytes.length - 1) + entryBytes.reduce((a, b) => a + b, 0)
    return { key, path, type, children, preview: `{${pluralize(keys.length, 'key')}}`, size }
  }

  if (type === 'array') {
    const arr = value as unknown[]
    const children = arr.map((v, i) => buildNode(v, String(i), arrayChildPath(path, i)))
    const sizes = children.map((c) => c.size)
    const size = sizes.length === 0 ? 2 : 2 + (sizes.length - 1) + sizes.reduce((a, b) => a + b, 0)
    return { key, path, type, children, preview: `[${pluralize(arr.length, 'item')}]`, size }
  }

  // Scalars: string | number | boolean | null (no `children` at all — optional field, omitted).
  const preview = type === 'string' ? previewString(value as string) : JSON.stringify(value)
  return { key, path, type, preview, size: byteLength(JSON.stringify(value)) }
}

/** Extracts V8's `... at position N ...` from a JSON.parse SyntaxError message, else null. */
function extractPosition(message: string): number | null {
  const match = /position (\d+)/.exec(message)
  return match ? Number(match[1]) : null
}

export function parseJsonModel(input: string): JsonParseResult {
  // Size gate runs BEFORE parsing: a huge invalid string shouldn't pay for a
  // parse attempt, and a huge *valid* one is still rejected — the limit is a
  // pure size gate, independent of validity (see the tool's FAQ copy).
  const bytes = byteLength(input)
  if (bytes > MAX_INPUT_BYTES) {
    const mb = (bytes / (1024 * 1024)).toFixed(2)
    return { error: { message: `Input is ${mb} MB; the limit is 2 MB`, position: null } }
  }

  // buildNode's recursion now runs INSIDE this try (not just JSON.parse):
  // a pathologically deep-nested-but-otherwise-valid document (e.g. 3000
  // levels of `[[[...]]]`) parses fine (V8's JSON.parse is iterative, not
  // call-stack-recursive) but then overflows the JS call stack when
  // buildNode walks it recursively — that RangeError must be caught here
  // too, or it escapes parseJsonModel's `try` entirely and reaches Vue as an
  // uncaught exception instead of the tool's normal inline error state.
  try {
    const value: unknown = JSON.parse(input)
    return { root: buildNode(value, null, '$') }
  } catch (e) {
    if (e instanceof RangeError) {
      return { error: { message: 'JSON is nested too deeply to explore', position: null } }
    }
    const message = e instanceof Error ? e.message : String(e)
    return { error: { message, position: extractPosition(message) } }
  }
}

export interface JsonStats {
  keys: number
  maxDepth: number
  bytes: number
}

/**
 * Walks the tree once: `keys` counts every non-root node (an object property
 * OR an array item — anything with a parent counts), `maxDepth` is the
 * deepest nesting level (root itself is depth 0), `bytes` is the root's own
 * minimal-serialization size (see `buildNode`).
 */
export function computeStats(root: JsonNode): JsonStats {
  let keys = 0
  let maxDepth = 0

  const walk = (node: JsonNode, depth: number): void => {
    if (depth > maxDepth) maxDepth = depth
    if (node.children) {
      for (const child of node.children) {
        keys++
        walk(child, depth + 1)
      }
    }
  }

  walk(root, 0)
  return { keys, maxDepth, bytes: root.size }
}

export interface JsonSearchResult {
  /** Exact-match node paths: key or (for strings) preview text contains the query. */
  matches: Set<string>
  /** Container node paths that must be expanded to reveal a match somewhere beneath them. */
  expand: Set<string>
}

// `preview` always wraps a string value in literal double quotes (truncated
// or not), so stripping exactly one leading/trailing quote recovers the
// (possibly-truncated) value text to search against.
const stripPreviewQuotes = (preview: string): string =>
  preview.length >= 2 && preview.startsWith('"') && preview.endsWith('"') ? preview.slice(1, -1) : preview

function nodeMatchesQuery(node: JsonNode, lowerQuery: string): boolean {
  if (node.key !== null && node.key.toLowerCase().includes(lowerQuery)) return true
  if (node.type === 'string' && stripPreviewQuotes(node.preview).toLowerCase().includes(lowerQuery)) return true
  return false
}

/**
 * Case-insensitive substring search over keys + string values (component
 * contract). Strings longer than 40 chars are matched against their
 * (truncated) `preview` only — `JsonNode`'s normative shape carries no raw
 * value to search against, so a query that occurs only after char 40 of a
 * long string will not be found. Documented, accepted limitation.
 */
export function searchJsonTree(root: JsonNode, query: string): JsonSearchResult {
  const matches = new Set<string>()
  const expand = new Set<string>()
  const lowerQuery = query.trim().toLowerCase()
  if (!lowerQuery) return { matches, expand }

  const walk = (node: JsonNode): boolean => {
    let hit = nodeMatchesQuery(node, lowerQuery)
    if (hit) matches.add(node.path)
    if (node.children) {
      for (const child of node.children) {
        if (walk(child)) hit = true
      }
      if (hit) expand.add(node.path)
    }
    return hit
  }

  walk(root)
  return { matches, expand }
}
