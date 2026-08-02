/**
 * ident.ts — pure engine for the UUID / ULID Generator & Inspector tool (spec D5).
 *
 * Four functions: `uuidV4` (delegates straight to the Web Crypto API), `uuidV7`
 * (RFC 9562 timestamp-ordered UUID, hand-rolled to an exact byte layout),
 * `ulid` (Crockford Base32, monotonic within the same millisecond), and
 * `inspect` (a best-effort decoder: given ANY string, say what kind of
 * identifier it looks like and pull out whatever metadata that shape exposes).
 *
 * Design decisions that matter for callers/maintainers:
 *
 *   - **uuidV4 is a thin wrapper, on purpose**: `crypto.randomUUID()` already
 *     produces a fully spec-compliant v4 UUID (lowercase, version nibble 4,
 *     RFC 4122 variant) straight from the platform's CSPRNG — reimplementing
 *     it by hand would only add a place for a bug to hide.
 *   - **uuidV7's byte layout is exactly RFC 9562's**: a 16-byte buffer is
 *     filled ENTIRELY with `crypto.getRandomValues` first, then bytes 0-5 are
 *     overwritten with the 48-bit unix-ms timestamp (big-endian, via BigInt
 *     shifts — plain `number` bitwise ops in JS truncate to 32 bits, which
 *     would silently corrupt anything above ~4.29e9ms, i.e. 1970-02-19), and
 *     finally byte 6's top nibble is forced to `0111` (version 7) and byte
 *     8's top 2 bits are forced to `10` (the RFC 4122 variant) by OR-ing over
 *     the already-random byte — so the bits those two bytes contribute as
 *     pure randomness (byte 6's low nibble, byte 8's low 6 bits) survive
 *     untouched. Bytes 7 and 9-15 are left exactly as randomly filled.
 *   - **Sortability is the entire point of v7 (and ULID)**: because the
 *     timestamp occupies the most-significant bytes/characters, plain
 *     string comparison of two IDs orders them by creation time — this is
 *     exercised directly in the test suite (two IDs generated at different
 *     `now` values compare in timestamp order), not just asserted by
 *     construction.
 *   - **ULID uses BigInt throughout, not float/32-bit bit-twiddling**: both
 *     the 48-bit time and the 80-bit random component are encoded via BigInt
 *     shifts, sidestepping the 32-bit truncation plain bitwise `number` ops
 *     have in JS. 10 Crockford characters (5 bits each = 50 bits) hold the
 *     48-bit time (the top 2 bits are always 0 for any realistic date); 16
 *     characters (80 bits exactly) hold the random component.
 *   - **ULID monotonicity via module-level `lastUlidMs`/`lastUlidRandom`**: a
 *     call whose resolved timestamp (`now ?? Date.now()`) equals the
 *     previous call's increments the previous 80-bit random value by 1
 *     instead of drawing fresh randomness, guaranteeing strictly increasing
 *     output for same-millisecond bursts. The all-ones carry-OVERFLOW edge
 *     case is deliberately not specially handled or pinned by a test hook —
 *     masking back to 80 bits keeps the function total, and a same-ms burst
 *     large enough to hit it is astronomically unlikely. A `now` that
 *     differs from the previous call (even backwards) draws fresh
 *     randomness rather than incrementing, matching the reference ULID
 *     monotonic algorithm — only same-ms bursts are special-cased.
 *   - **`inspect` is a decoder, not a validator**: any 8-4-4-4-12 hex string
 *     is treated as a UUID and its version/variant nibbles are read off
 *     verbatim (hex digit 13 = version, hex digit 17 = variant), regardless
 *     of whether that exact combination is one a real generator would ever
 *     produce. Variant text uses RFC 4122 §4.1.1's own 4-way split (NCS /
 *     RFC 4122 / Microsoft / future) — only the RFC 4122 string ('8'/'9'/
 *     'a'/'b') is brief-mandated; the other 3 labels are this
 *     implementation's own reasonable naming, since v4/v7 (the only kinds
 *     this tool generates) always land in the RFC 4122 bucket.
 *   - **Only v7 decodes a timestamp — v1 deliberately does not**: a v1 UUID
 *     does embed a timestamp, but in incompatible units (100ns ticks since
 *     1582-10-15) and a different byte order (time_low/time_mid/time_hi is
 *     NOT a simple big-endian split) — decoding it correctly would need a
 *     second, unrelated code path for a version this tool never generates.
 *     Per the brief, `inspect` reports v1's version number only.
 *   - **Case-insensitivity**: UUIDs are matched case-insensitively (covers
 *     both `crypto.randomUUID()`'s lowercase and a user pasting uppercase).
 *     ULIDs are matched case-insensitively too, but decoded after
 *     uppercasing — Crockford's alphabet, and this module's own encoder,
 *     are uppercase.
 */

// ---------------------------------------------------------------------------
// uuidV4 / uuidV7
// ---------------------------------------------------------------------------

export function uuidV4(): string {
  return crypto.randomUUID()
}

function formatUuidBytes(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function uuidV7(now?: number): string {
  const ms = now ?? Date.now()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Bytes 0-5: unix-ms, big-endian (48 bits). BigInt shifts avoid the 32-bit
  // truncation plain `number` bitwise ops would silently apply above ~4.29e9ms.
  let msBits = BigInt(ms)
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(msBits & 0xffn)
    msBits >>= 8n
  }

  bytes[6] = 0x70 | (bytes[6]! & 0x0f) // version 7, low nibble stays random
  bytes[8] = 0x80 | (bytes[8]! & 0x3f) // RFC 4122 variant, low 6 bits stay random

  return formatUuidBytes(bytes)
}

// ---------------------------------------------------------------------------
// ulid
// ---------------------------------------------------------------------------

/** Crockford's Base32 — excludes the visually ambiguous I, L, O, U. */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ULID_TIME_CHARS = 10 // 48-bit time -> 10 x 5-bit chars (top 2 bits always 0)
const ULID_RANDOM_CHARS = 16 // 80-bit random -> 16 x 5-bit chars, exactly
const ULID_RANDOM_BITS = 80n
const ULID_RANDOM_MASK = (1n << ULID_RANDOM_BITS) - 1n

function encodeCrockford(value: bigint, chars: number): string {
  let out = ''
  for (let i = chars - 1; i >= 0; i--) {
    const index = Number((value >> BigInt(i * 5)) & 0x1fn)
    out += CROCKFORD_ALPHABET[index]!
  }
  return out
}

function decodeCrockford(str: string): bigint {
  let value = 0n
  for (const ch of str) {
    value = (value << 5n) | BigInt(CROCKFORD_ALPHABET.indexOf(ch))
  }
  return value
}

function randomUlidBits(): bigint {
  const bytes = new Uint8Array(10) // 80 bits
  crypto.getRandomValues(bytes)
  let value = 0n
  for (const b of bytes) value = (value << 8n) | BigInt(b)
  return value
}

// Module-level monotonic state — see the file header's ULID monotonicity note.
let lastUlidMs = -1
let lastUlidRandom = 0n

export function ulid(now?: number): string {
  const ms = now ?? Date.now()

  const randomBits = ms === lastUlidMs ? (lastUlidRandom + 1n) & ULID_RANDOM_MASK : randomUlidBits()

  lastUlidMs = ms
  lastUlidRandom = randomBits

  return encodeCrockford(BigInt(ms), ULID_TIME_CHARS) + encodeCrockford(randomBits, ULID_RANDOM_CHARS)
}

// ---------------------------------------------------------------------------
// inspect
// ---------------------------------------------------------------------------

export interface IdentInfo {
  kind: 'uuid' | 'ulid' | 'unknown'
  version?: number
  variant?: string
  timestamp?: Date
}

const UUID_SHAPE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ULID_SHAPE_RE = new RegExp(`^[${CROCKFORD_ALPHABET}]{${ULID_TIME_CHARS + ULID_RANDOM_CHARS}}$`, 'i')

/** RFC 4122 §4.1.1's 4-way variant-nibble split. Only 'RFC 4122' is brief-mandated text. */
function variantFromNibble(nibble: number): string {
  if (nibble >= 0x8 && nibble <= 0xb) return 'RFC 4122'
  if (nibble === 0xc || nibble === 0xd) return 'Reserved (Microsoft)'
  if (nibble >= 0xe) return 'Reserved (future)'
  return 'Reserved (NCS)'
}

export function inspect(id: string): IdentInfo {
  const trimmed = id.trim()

  if (UUID_SHAPE_RE.test(trimmed)) {
    const hex = trimmed.replace(/-/g, '').toLowerCase()
    const version = parseInt(hex[12]!, 16)
    const variant = variantFromNibble(parseInt(hex[16]!, 16))
    const info: IdentInfo = { kind: 'uuid', version, variant }
    if (version === 7) {
      info.timestamp = new Date(Number(BigInt(`0x${hex.slice(0, 12)}`)))
    }
    return info
  }

  if (ULID_SHAPE_RE.test(trimmed)) {
    const upper = trimmed.toUpperCase()
    // The 48-bit time only fills 3 of the first char's 5 bits (10 chars x 5
    // bits = 50 > 48) — so a spec-valid ULID's first char can only ever be
    // '0'-'7' (CROCKFORD_ALPHABET's own index order places the digits
    // before the letters, so plain string comparison here exactly matches
    // "decoded value <= 7"). Anything else is a well-formed Crockford
    // string but an out-of-range ULID, not a real one (M6).
    if (upper[0]! > '7') return { kind: 'unknown' }
    const ms = Number(decodeCrockford(upper.slice(0, ULID_TIME_CHARS)))
    return { kind: 'ulid', timestamp: new Date(ms) }
  }

  return { kind: 'unknown' }
}
