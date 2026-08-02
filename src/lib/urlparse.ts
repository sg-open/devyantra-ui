/**
 * urlparse.ts — pure engine for the URL Parser tool (spec D6).
 *
 * Two functions: `parseUrl` (decomposes any URL string into its parts, using
 * the platform's own `URL`/`URLSearchParams` for every hard part — scheme
 * normalization, IDNA/punycode host encoding, default-port elision, and
 * percent/form-urlencoded decoding) and `buildUrl` (the inverse: reassembles
 * a `ParsedUrl` back into a URL string, so the live query-param editor in the
 * UI can rebuild the URL after every edit).
 *
 * Design decisions that matter for callers/maintainers:
 *
 *   - **`parseUrl` is a thin wrapper around `new URL(input, base)`, on
 *     purpose**: the platform's URL parser already implements the WHATWG URL
 *     Standard exactly (host lowercasing, IDNA/punycode encoding, default-port
 *     elision, percent-decoding) — reimplementing any of that by hand would
 *     only add a place for a subtle bug to hide. It throws the same
 *     `TypeError` the platform throws for anything structurally invalid
 *     (including a relative input given with no `base`), which is exactly
 *     the pinned "invalid -> throws" contract.
 *   - **`params` comes from a single linear `[...url.searchParams]` pass**:
 *     `URLSearchParams` iterates in exact query-string order and yields every
 *     repeated key separately (never de-duplicated or grouped), so repeated
 *     keys stay in order EVEN WHEN interleaved with other keys
 *     (`?tag=a&other=z&tag=b` stays `tag, other, tag` — a Map/grouping-based
 *     implementation would have silently reordered this).
 *   - **`hostUnicode` reads the RAW INPUT, not the resolved URL**: once
 *     parsed, `url.hostname` is always the ASCII/punycode form (per the
 *     WHATWG host serializer) — the unicode spelling the user actually typed
 *     is gone from the `URL` object entirely. So: a small regex pulls the
 *     authority substring (the text between `://` — or a bare `//` for a
 *     protocol-relative input — and the next `/`, `?`, `#`, or end of
 *     string) directly off the ORIGINAL `input` argument. If that substring
 *     contains any non-ASCII character, it IS the unicode host form, stored
 *     verbatim as `hostUnicode`; otherwise `hostUnicode` is `null`. This
 *     deliberately only inspects `input`, never `base` — a relative input
 *     resolved against a unicode-host `base` reports `hostUnicode: null`,
 *     since the unicode spelling was never actually typed into this call.
 *     Pinned: `parseUrl('https://bücher.example/x')` -> host
 *     `xn--bcher-kva.example`, hostUnicode `bücher.example`.
 *   - **Port is exactly what `URL.port` gives**: the empty string whenever
 *     the URL used its scheme's default port (443 for https, 80 for http,
 *     21 for ftp, ...) OR no port was given at all — the platform elides
 *     both cases identically, and this module does not try to tell them
 *     apart.
 *   - **Scope limitation, not a bug: userinfo (`user:pass@`) is not part of
 *     `ParsedUrl` and is silently dropped** — there is no field to hold it.
 *     `parseUrl('https://user:pass@example.com/x').host` is `'example.com'`;
 *     round-tripping such a URL through `buildUrl` loses the credentials
 *     permanently. Out of scope per the brief's interface, which has no
 *     userinfo field at all.
 *   - **`buildUrl`'s query string goes through `URLSearchParams`, then a
 *     deliberate `+` -> `%20` normalization pass — this is a documented,
 *     PINNED policy, not an accident**: `URLSearchParams#toString()` always
 *     serializes a literal space as `+` (the application/x-www-form-urlencoded
 *     convention) while independently percent-encoding any literal `+`
 *     character in a key/value to `%2B` — so after that call, every `+`
 *     remaining in the string can ONLY be standing in for a space, never a
 *     real plus sign. That makes a blanket `.replace(/\+/g, '%20')` exactly
 *     safe, and it normalizes every rebuilt query to the unambiguous `%20`
 *     form instead of the ambiguous-outside-queries `+` form (both mean
 *     space; `%20` means it everywhere, `+` only inside a query string).
 *     Consequence: `buildUrl(parseUrl(u))` is idempotent (`=== u`) for a
 *     "normalized" fixture — one that never spelled a query-string space as
 *     `+` in the first place (using `%20` or no spaces at all) — but a `+`
 *     in the INPUT deliberately comes back out as `%20` on rebuild.
 *   - **Everything else (scheme/host/port/path/hash) is plain string
 *     concatenation, not another trip through `new URL()`**: `path` and
 *     `hash` are already in their canonical percent-encoded form as read off
 *     the original `URL` object, so passing them through unmodified is both
 *     simpler and exactly stable. This also means `buildUrl` never
 *     re-validates or re-normalizes a caller-constructed `ParsedUrl` — it
 *     trusts the shape it's given, which is exactly what the UI needs: only
 *     `params` is ever user-edited; scheme/host/port/path/hash are read-only
 *     display fields copied straight through.
 */

export interface UrlParam {
  key: string
  value: string
}

export interface ParsedUrl {
  scheme: string
  host: string
  port: string
  path: string
  hash: string
  params: UrlParam[]
  hostUnicode: string | null
}

// Matches an authority right off the RAW input string: an optional
// "scheme:" followed by "//", then everything up to the next /, ?, #, or
// end of string. Deliberately permissive about the scheme (any
// letter-then-alphanumeric/+/-/. run, per the URL Standard's scheme
// grammar) since parseUrl's own validity check is `new URL()` itself — this
// regex only ever runs on an input that already parsed successfully.
const AUTHORITY_RE = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:)?\/\/([^/?#]*)/

const hasNonAscii = (s: string): boolean => /[^\x00-\x7f]/.test(s)

/** Recovers the unicode host form from the raw input — see this file's header. */
function extractHostUnicode(input: string): string | null {
  const authority = input.match(AUTHORITY_RE)?.[1] ?? null
  return authority && hasNonAscii(authority) ? authority : null
}

/**
 * Decomposes a URL string into scheme/host/port/path/hash/params, resolving
 * against `base` when `input` is relative. Throws the platform's own
 * `TypeError` for anything `new URL()` itself rejects as invalid — including
 * a relative `input` given with no `base` at all.
 */
export function parseUrl(input: string, base?: string): ParsedUrl {
  const url = new URL(input, base)

  return {
    scheme: url.protocol.slice(0, -1), // drop the trailing ':' ('https:' -> 'https')
    host: url.hostname,
    port: url.port,
    path: url.pathname,
    hash: url.hash.slice(1), // drop the leading '#'
    params: [...url.searchParams].map(([key, value]) => ({ key, value })),
    hostUnicode: extractHostUnicode(input)
  }
}

/**
 * Reassembles a `ParsedUrl` back into a URL string. `params` is the only
 * field this ever needs to re-encode (via `URLSearchParams`, with the
 * `+` -> `%20` normalization documented in this file's header) — every other
 * field is trusted verbatim and concatenated as plain strings.
 */
export function buildUrl(p: ParsedUrl): string {
  const usp = new URLSearchParams()
  for (const { key, value } of p.params) usp.append(key, value)
  const query = usp.toString().replace(/\+/g, '%20')

  const authority = p.port ? `${p.host}:${p.port}` : p.host
  const search = query ? `?${query}` : ''
  const hash = p.hash ? `#${p.hash}` : ''

  return `${p.scheme}://${authority}${p.path}${search}${hash}`
}
