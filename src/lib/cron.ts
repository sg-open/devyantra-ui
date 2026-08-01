/**
 * cron.ts — pure 5-field cron engine for the Cron Parser tool (spec D4 core).
 *
 * `parseCron` turns a standard 5-field cron expression (minute hour dom month
 * dow) into resolved `Set<number>`s per field. `describeCron` composes a
 * deterministic plain-English sentence from those sets. `nextRuns` walks
 * forward from a given instant to find the next N matching local wall-clock
 * minutes.
 *
 * Design decisions that matter for callers/maintainers:
 *
 *   - **Grammar is intentionally narrow**: exactly 5 whitespace-separated
 *     fields (6/7-field seconds/year variants are rejected with a named
 *     message, never silently misparsed); each field is a comma list of
 *     items, and an item is exactly one of the 5 shapes the brief enumerates:
 *     `*`, `*` then `/step`, `value`, `value-value`, `value-value` then `/step`. Notably,
 *     a bare `value/step` (e.g. `5/15`, no range) is NOT one of those 5
 *     shapes and is rejected, even though some real-world cron parsers
 *     accept it as a Vixie extension — honesty over silently accepting a
 *     form the brief doesn't list.
 *   - **No wraparound ranges**: `value-value` requires start <= end (e.g.
 *     `22-2` for hour is rejected, not interpreted as "10pm through 2am").
 *     Day-of-week's 7 ≡ 0 aliasing exists *precisely* so a range crossing
 *     Sunday can still be written ascending (`5-7` = Fri-Sat-Sun) without
 *     needing wraparound at all — see the dow section below.
 *   - **Day-of-week 7 ≡ 0**: bounds-checked against 0..7 (not 0..6) so a
 *     bare `7` or a range ending in `7` is valid input, then folded to 0
 *     only at insertion time (`normalize`). This ordering matters: folding
 *     BEFORE range expansion would turn `5-7` into an invalid `5-0`
 *     descending range; folding AFTER expansion keeps it a valid ascending
 *     `5,6,7` that becomes `{5,6,0}` once normalized.
 *   - **`domRestricted`/`dowRestricted`** are purely syntactic: raw field
 *     text ≠ `"*"`. A `*` then `/2` (or even a `0-6` spelling out every day) still
 *     counts as restricted — this is the letter of the interface, not a
 *     "does this actually narrow anything" semantic check.
 *   - **The vixie DOM/DOW OR rule**: when BOTH day-of-month and day-of-week
 *     are restricted, a day matches if EITHER resolves true (not both).
 *     When only one (or neither) is restricted, that field alone (or
 *     nothing) gates the day. Implemented once, in `dayMatches`, and reused
 *     by both the day-level skip-ahead scan and (implicitly) by every
 *     matching day's minute enumeration in `nextRuns`.
 *   - **`nextRuns` performance**: rather than a naive minute-by-minute walk
 *     across up to 4 years (~2.1M iterations), the outer loop advances by
 *     whole CALENDAR DAYS (~1,461 iterations worst case) and only expands
 *     the (already-resolved, typically small) hour x minute cartesian
 *     product for days that pass `dayMatches`. This is the "skip-ahead
 *     optimization" the brief explicitly allows.
 *   - **Local wall-clock via the Date API**: every date read/construction
 *     uses local getters/multi-arg constructors (`getHours`, `new Date(y, m,
 *     d, h, min)`, never the UTC variants), so DST transitions are handled
 *     however the JS engine's local-time normalization handles them (a
 *     spring-forward gap or fall-back overlap is resolved by `Date` itself,
 *     not fought here) — this is the documented DST behavior the brief asks
 *     for, not a bug.
 *   - **`describeCron`'s non-pinned phrasing is syntax-driven, not semantic
 *     normalization**: e.g. `*` then `/15` gets the special "Every 15 minutes"
 *     narrative because it is literally *written* as a step, whereas the
 *     value-equal list `0,15,30,45` does not — the brief calls this
 *     "deterministic template composition", and only 5 exact outputs are
 *     normative; everything else is asserted by substring in tests.
 */

export class CronError extends Error {
  field: string | null

  constructor(message: string, field: string | null = null) {
    super(message)
    this.name = 'CronError'
    this.field = field
  }
}

export interface ParsedCron {
  minute: Set<number>
  hour: Set<number>
  dom: Set<number>
  month: Set<number>
  dow: Set<number>
  domRestricted: boolean
  dowRestricted: boolean
}

interface FieldSpec {
  key: string
  label: string
  min: number
  max: number
  names?: Record<string, number>
  normalize?: (n: number) => number
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12
}

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6
}

const MINUTE_SPEC: FieldSpec = { key: 'minute', label: 'minute', min: 0, max: 59 }
const HOUR_SPEC: FieldSpec = { key: 'hour', label: 'hour', min: 0, max: 23 }
const DOM_SPEC: FieldSpec = { key: 'dom', label: 'day of month', min: 1, max: 31 }
const MONTH_SPEC: FieldSpec = { key: 'month', label: 'month', min: 1, max: 12, names: MONTH_NAMES }
// max is 7 (not 6) so a bare "7" or a range ending in "7" passes bounds; folded to 0 at insertion.
const DOW_SPEC: FieldSpec = { key: 'dow', label: 'day of week', min: 0, max: 7, names: DOW_NAMES, normalize: (n) => (n === 7 ? 0 : n) }

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const monthLabel = (n: number): string => MONTH_LABELS[n - 1]!
const dowLabel = (n: number): string => DOW_LABELS[n % 7]! // %7 also handles the pre-normalization value 7 (Sunday)
const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Item grammar: `*`, `*` then `/step`, `value`, `value-value`, `value-value` then `/step` (base + optional step suffix). */
const ITEM_RE = /^(\*|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)(?:\/(\d+))?$/

function splitFields(expr: string): string[] {
  return expr.trim().split(/\s+/)
}

function resolveValue(raw: string, spec: FieldSpec): number {
  if (/^\d+$/.test(raw)) {
    const n = Number(raw)
    if (n < spec.min || n > spec.max) {
      throw new CronError(`${n} is out of range for the ${spec.label} field (expected ${spec.min}-${spec.max})`, spec.key)
    }
    return n
  }
  const named = spec.names?.[raw.toUpperCase()]
  if (named !== undefined) return named
  throw new CronError(`Invalid value "${raw}" for the ${spec.label} field`, spec.key)
}

function parsePositiveStep(stepRaw: string, spec: FieldSpec, itemRaw: string): number {
  const step = Number(stepRaw)
  if (step < 1) {
    throw new CronError(`Invalid step in "${itemRaw}" for the ${spec.label} field: step must be at least 1`, spec.key)
  }
  return step
}

function parseItem(raw: string, spec: FieldSpec, out: Set<number>): void {
  const m = ITEM_RE.exec(raw)
  if (!m) {
    throw new CronError(`Invalid syntax "${raw}" in the ${spec.label} field`, spec.key)
  }
  const base = m[1]!
  const stepRaw = m[2]
  const insert = (n: number): void => {
    out.add(spec.normalize ? spec.normalize(n) : n)
  }

  if (base === '*') {
    const step = stepRaw === undefined ? 1 : parsePositiveStep(stepRaw, spec, raw)
    for (let v = spec.min; v <= spec.max; v += step) insert(v)
    return
  }

  const dash = base.indexOf('-')
  if (dash === -1) {
    // A bare "value/step" (no range) is syntactically matched by ITEM_RE above but is
    // NOT one of the 5 grammar shapes the brief lists — reject it explicitly here.
    if (stepRaw !== undefined) {
      throw new CronError(`Invalid syntax "${raw}" in the ${spec.label} field: a step requires "*" or a range`, spec.key)
    }
    insert(resolveValue(base, spec))
    return
  }

  const start = resolveValue(base.slice(0, dash), spec)
  const end = resolveValue(base.slice(dash + 1), spec)
  if (start > end) {
    throw new CronError(`Invalid range "${raw}" in the ${spec.label} field: start must not exceed end`, spec.key)
  }
  const step = stepRaw === undefined ? 1 : parsePositiveStep(stepRaw, spec, raw)
  for (let v = start; v <= end; v += step) insert(v)
}

function parseField(raw: string, spec: FieldSpec): Set<number> {
  const out = new Set<number>()
  for (const item of raw.split(',')) parseItem(item, spec, out)
  return out
}

export function parseCron(expr: string): ParsedCron {
  const fields = splitFields(expr)
  if (fields.length !== 5) {
    throw new CronError(
      `Expected 5 fields, got ${fields.length}. Six- and seven-field variants (seconds/years) aren't supported.`,
      null
    )
  }
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = fields as [string, string, string, string, string]

  return {
    minute: parseField(minuteRaw, MINUTE_SPEC),
    hour: parseField(hourRaw, HOUR_SPEC),
    dom: parseField(domRaw, DOM_SPEC),
    month: parseField(monthRaw, MONTH_SPEC),
    dow: parseField(dowRaw, DOW_SPEC),
    domRestricted: domRaw !== '*',
    dowRestricted: dowRaw !== '*'
  }
}

// ---------------------------------------------------------------------------
// describeCron
// ---------------------------------------------------------------------------

function joinWithAnd(labels: string[]): string {
  if (labels.length === 1) return labels[0]!
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

const BARE_RANGE_RE = /^([A-Za-z0-9]+)-([A-Za-z0-9]+)$/

function describePart(set: Set<number>, label: string, fullSize: number): string {
  if (set.size === fullSize) return `every ${label}`
  const sorted = [...set].sort((a, b) => a - b)
  if (sorted.length === 1) return `${label} ${sorted[0]}`
  return `${label}s ${joinWithAnd(sorted.map(String))}`
}

function describeTime(parsed: ParsedCron, minuteRaw: string, hourRaw: string): string {
  const minuteStepN = /^\*\/(\d+)$/.exec(minuteRaw)?.[1]
  const hourStepN = /^\*\/(\d+)$/.exec(hourRaw)?.[1]

  if (parsed.minute.size === 60 && parsed.hour.size === 24) return 'Every minute'
  if (minuteStepN && parsed.hour.size === 24) return `Every ${minuteStepN} minutes`
  if (hourStepN && parsed.minute.size === 1) {
    const [minuteVal] = parsed.minute
    return minuteVal === 0 ? `Every ${hourStepN} hours` : `At minute ${minuteVal} past every ${hourStepN} hours`
  }
  if (parsed.minute.size === 1 && parsed.hour.size === 1) {
    const [minuteVal] = parsed.minute
    const [hourVal] = parsed.hour
    return `At ${pad2(hourVal!)}:${pad2(minuteVal!)}`
  }
  return `At ${describePart(parsed.minute, 'minute', 60)}, ${describePart(parsed.hour, 'hour', 24)}`
}

function describeDom(dom: Set<number>, domRaw: string): string {
  const bareRange = BARE_RANGE_RE.exec(domRaw)
  if (bareRange) {
    const start = resolveValue(bareRange[1]!, DOM_SPEC)
    const end = resolveValue(bareRange[2]!, DOM_SPEC)
    return `on days ${start} through ${end} of the month`
  }
  if (dom.size === 1) {
    const [d] = dom
    return `on day ${d} of the month`
  }
  const sorted = [...dom].sort((a, b) => a - b)
  return `on days ${joinWithAnd(sorted.map(String))} of the month`
}

function describeMonth(month: Set<number>, monthRaw: string): string {
  const bareRange = BARE_RANGE_RE.exec(monthRaw)
  if (bareRange) {
    const start = resolveValue(bareRange[1]!, MONTH_SPEC)
    const end = resolveValue(bareRange[2]!, MONTH_SPEC)
    return `in ${monthLabel(start)} through ${monthLabel(end)}`
  }
  if (month.size === 1) {
    const [m] = month
    return `in ${monthLabel(m!)}`
  }
  const sorted = [...month].sort((a, b) => a - b)
  return `in ${joinWithAnd(sorted.map(monthLabel))}`
}

function describeDow(dow: Set<number>, dowRaw: string): string {
  const bareRange = BARE_RANGE_RE.exec(dowRaw)
  if (bareRange) {
    const start = resolveValue(bareRange[1]!, DOW_SPEC)
    const end = resolveValue(bareRange[2]!, DOW_SPEC)
    return `${dowLabel(start)} through ${dowLabel(end)}`
  }
  if (dow.size === 1) {
    const [d] = dow
    return `on ${dowLabel(d!)}`
  }
  const sorted = [...dow].sort((a, b) => a - b)
  return `on ${joinWithAnd(sorted.map(dowLabel))}`
}

export function describeCron(expr: string): string {
  const parsed = parseCron(expr)
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = splitFields(expr) as [string, string, string, string, string]

  const parts = [describeTime(parsed, minuteRaw, hourRaw)]
  if (parsed.domRestricted) parts.push(describeDom(parsed.dom, domRaw))
  if (parsed.month.size < 12) parts.push(describeMonth(parsed.month, monthRaw))
  if (parsed.dowRestricted) parts.push(describeDow(parsed.dow, dowRaw))

  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// nextRuns
// ---------------------------------------------------------------------------

const FOUR_YEARS_BOUND_MESSAGE = 'No matching times in the next 4 years'

/** The next whole local-time minute strictly after `from` (floor-to-minute, then +1). */
function startOfNextMinute(from: Date): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate(), from.getHours(), from.getMinutes() + 1, 0, 0)
}

function nextDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
}

/** The classic vixie DOM/DOW rule, evaluated at day granularity (ignores hour/minute). */
function dayMatches(parsed: ParsedCron, day: Date): boolean {
  if (!parsed.month.has(day.getMonth() + 1)) return false

  const domMatch = parsed.dom.has(day.getDate())
  const dowMatch = parsed.dow.has(day.getDay())

  if (parsed.domRestricted && parsed.dowRestricted) return domMatch || dowMatch
  if (parsed.domRestricted) return domMatch
  if (parsed.dowRestricted) return dowMatch
  return true
}

export function nextRuns(expr: string, from: Date, count: number): Date[] {
  if (count <= 0) return []

  const parsed = parseCron(expr)
  const firstCandidate = startOfNextMinute(from)
  const results: Date[] = []

  const hours = [...parsed.hour].sort((a, b) => a - b)
  const minutes = [...parsed.minute].sort((a, b) => a - b)

  let day = new Date(firstCandidate.getFullYear(), firstCandidate.getMonth(), firstCandidate.getDate())
  const limit = new Date(firstCandidate.getFullYear() + 4, firstCandidate.getMonth(), firstCandidate.getDate())

  while (day.getTime() < limit.getTime()) {
    if (dayMatches(parsed, day)) {
      for (const h of hours) {
        for (const min of minutes) {
          const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min, 0, 0)
          if (candidate.getTime() >= firstCandidate.getTime()) {
            results.push(candidate)
            if (results.length === count) return results
          }
        }
      }
    }
    day = nextDay(day)
  }

  throw new CronError(FOUR_YEARS_BOUND_MESSAGE, null)
}
