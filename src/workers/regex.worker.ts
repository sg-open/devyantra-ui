// regex.worker.ts — runs inside a dedicated Worker. The main thread must never
// execute a user-supplied pattern directly (that's how a catastrophic-backtracking
// pattern freezes a tab) — this file, plus the 2s watchdog in useRegexWorker, is
// the entire ReDoS mitigation: worst case, this worker thread spins forever and
// the composable terminates it, never the page.
//
// Protocol is request/response correlated by an incrementing `id` so the
// composable can drop stale responses (supersede semantics live on the caller
// side, same split as diff.worker.ts).

export interface RegexRequest {
  id: number
  pattern: string
  flags: string
  testString: string
  replacement: string | null
}

export interface RegexMatch {
  index: number
  match: string
  groups: Array<{ name: string | null; value: string | null }>
}

export interface RegexResult {
  matches: RegexMatch[]
  truncated: boolean
  replaced: string | null
  elapsedMs: number
  /**
   * The exact testString this result was computed against, echoed back
   * verbatim (M7). Evaluation is debounced 250ms in RegexTester.vue, so
   * there's a window where the user has already typed further edits into
   * the live testString ref before a stale result lands — building
   * highlight segments from that live ref instead of this echo would slice
   * match.index/match.length against a DIFFERENT string than the one they
   * were computed from, transiently misaligning every highlight span.
   */
  testString: string
}

export type RegexResponse = { id: number; result: RegexResult } | { id: number; error: string }

// Hard cap on collected matches. A pattern that legitimately matches more than
// this against realistic test-string sizes is vanishingly rare; the cap exists
// so a pattern matching e.g. every character of a huge paste can't blow up
// memory building the results table — `truncated: true` tells the caller why
// the list stops short.
const MAX_MATCHES = 10_000

// Pure computation — exported so tests (and the FakeWorker test doubles that
// stand in for a real Worker) can drive it directly without spinning up an
// actual worker thread, the same role computeDiffModel plays for diff.worker.ts.
export function computeRegexResult(pattern: string, flags: string, testString: string, replacement: string | null): RegexResult {
  const startedAt = performance.now()

  // Constructed with the caller's exact flags: this is what surfaces a
  // SyntaxError precisely as the browser would report it for those flags, and
  // it's reused below for the replace step so replace behaves exactly as the
  // caller's own flags dictate (no forcing) — a non-global regex correctly
  // replaces only the first match.
  const original = new RegExp(pattern, flags)

  // A separate g-forced copy for match collection: the matches table and
  // highlight view must enumerate every match regardless of whether the
  // caller ticked the 'g' flag checkbox — that checkbox governs replace-all
  // vs replace-first, not how many matches get displayed.
  const matchFlags = flags.includes('g') ? flags : `${flags}g`
  const matchRe = new RegExp(pattern, matchFlags)

  const matches: RegexMatch[] = []
  let truncated = false
  let m: RegExpExecArray | null
  while ((m = matchRe.exec(testString)) !== null) {
    const groups: RegexMatch['groups'] = []
    for (let i = 1; i < m.length; i++) {
      groups.push({ name: null, value: m[i] ?? null })
    }
    if (m.groups) {
      for (const [name, value] of Object.entries(m.groups)) {
        groups.push({ name, value: value ?? null })
      }
    }
    matches.push({ index: m.index, match: m[0], groups })

    if (matches.length >= MAX_MATCHES) {
      truncated = true
      break
    }

    // Zero-length-match guard: a pattern like /a*/ matches '' at every
    // position it doesn't otherwise match at. Without forcing lastIndex
    // forward here, exec() never advances past a zero-length hit and this
    // loop spins on the same index forever.
    //
    // AMENDS THE PLAN'S NORMATIVE ALGORITHM (reviewer-directed, for u-flag
    // correctness): a plain `lastIndex++` can land mid-surrogate-pair when
    // testString contains an astral character (e.g. '😀', 2 UTF-16 code
    // units) — under the /u flag, the engine then snaps lastIndex back to
    // the start of that pair, so `m.index === matchRe.lastIndex` is true
    // again next iteration and the loop never advances (verified: /x*/gu
    // against '😀a' spins at index 0 until MAX_MATCHES). Advancing by the
    // full code point width (2 when the code point at lastIndex is astral,
    // 1 otherwise) keeps lastIndex always on a code-point boundary.
    //
    // The code-point advance is gated on the u flag (verifier follow-up):
    // spec AdvanceStringIndex(S, index, unicode) is index + 1 when unicode
    // is FALSE — a non-u regex genuinely zero-length-matches at every code
    // UNIT boundary, including mid-surrogate (native: /x*/g on '😀a' yields
    // indices [0, 1, 2, 3]; /x*/gu yields [0, 2, 3]). An unconditional
    // 2-step would silently skip the mid-surrogate match the caller's own
    // flags say exists. (The tool's flag checkboxes never emit 'v', so
    // unicodeSets mode needs no parallel gate here.)
    if (m.index === matchRe.lastIndex) {
      const cp = testString.codePointAt(matchRe.lastIndex)
      matchRe.lastIndex += flags.includes('u') && cp !== undefined && cp > 0xffff ? 2 : 1
    }
  }

  const replaced = replacement !== null ? testString.replace(original, replacement) : null

  return { matches, truncated, replaced, elapsedMs: performance.now() - startedAt, testString }
}

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, testString, replacement } = event.data
  try {
    const result = computeRegexResult(pattern, flags, testString, replacement)
    const response: RegexResponse = { id, result }
    postMessage(response)
  } catch (err) {
    const response: RegexResponse = { id, error: err instanceof Error ? err.message : 'Invalid regular expression' }
    postMessage(response)
  }
}
