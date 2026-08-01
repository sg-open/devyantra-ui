import { describe, it, expect } from 'vitest'
import { parseCron, describeCron, nextRuns, CronError } from '../cron'

// Narrows a thrown error to CronError, failing loudly (rather than a confusing
// assertion diff) if the wrong thing — or nothing — was thrown.
function captureCronError(fn: () => void): CronError {
  try {
    fn()
  } catch (e) {
    if (e instanceof CronError) return e
    throw e
  }
  throw new Error('expected a CronError to be thrown, but nothing was thrown')
}

const setOf = (...values: number[]): Set<number> => new Set(values)
const range = (start: number, end: number): number[] => {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

describe('CronError', () => {
  it('is an Error subclass carrying an optional field name', () => {
    const err = new CronError('boom', 'minute')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(CronError)
    expect(err.message).toBe('boom')
    expect(err.field).toBe('minute')
  })

  it('field defaults to null when the error is not specific to one field', () => {
    const err = new CronError('boom')
    expect(err.field).toBeNull()
  })
})

describe('parseCron — grammar: exactly 5 whitespace-separated fields', () => {
  it('accepts a well-formed 5-field expression', () => {
    expect(() => parseCron('0 0 1 1 0')).not.toThrow()
  })

  it('rejects 3 fields with the exact pinned message and a null field', () => {
    const err = captureCronError(() => parseCron('1 2 3'))
    expect(err.message).toBe(
      'Expected 5 fields, got 3. Six- and seven-field variants (seconds/years) aren\'t supported.'
    )
    expect(err.field).toBeNull()
  })

  it('rejects the classic 6-field (seconds) variant with the exact pinned message', () => {
    const err = captureCronError(() => parseCron('0 30 9 * * 1-5'))
    expect(err.message).toBe(
      'Expected 5 fields, got 6. Six- and seven-field variants (seconds/years) aren\'t supported.'
    )
    expect(err.field).toBeNull()
  })

  it('rejects the classic 7-field (seconds + year) variant with the exact pinned message', () => {
    const err = captureCronError(() => parseCron('0 30 9 * * 1-5 2026'))
    expect(err.message).toBe(
      'Expected 5 fields, got 7. Six- and seven-field variants (seconds/years) aren\'t supported.'
    )
    expect(err.field).toBeNull()
  })

  it('tolerates extra internal whitespace between fields', () => {
    const parsed = parseCron('0   0  1   1 0')
    expect(parsed.minute).toEqual(setOf(0))
  })
})

describe('parseCron — lists', () => {
  it('parses a comma list of numbers', () => {
    expect(parseCron('0,15,30,45 * * * *').minute).toEqual(setOf(0, 15, 30, 45))
  })

  it('parses a comma list of day-of-week names', () => {
    expect(parseCron('* * * * MON,WED,FRI').dow).toEqual(setOf(1, 3, 5))
  })
})

describe('parseCron — ranges', () => {
  it('parses a numeric range inclusive of both ends', () => {
    expect(parseCron('* 9-17 * * *').hour).toEqual(setOf(...range(9, 17)))
  })

  it('parses a name range', () => {
    expect(parseCron('* * * * MON-FRI').dow).toEqual(setOf(1, 2, 3, 4, 5))
  })

  it('rejects a descending range (start > end) with a field-named error', () => {
    const err = captureCronError(() => parseCron('* 17-9 * * *'))
    expect(err.field).toBe('hour')
  })
})

describe('parseCron — steps', () => {
  it('parses "*/step"', () => {
    expect(parseCron('*/15 * * * *').minute).toEqual(setOf(0, 15, 30, 45))
  })

  it('parses "value-value/step"', () => {
    expect(parseCron('10-20/5 * * * *').minute).toEqual(setOf(10, 15, 20))
  })

  it('rejects a zero step', () => {
    const err = captureCronError(() => parseCron('*/0 * * * *'))
    expect(err.field).toBe('minute')
  })

  it('rejects the bare "value/step" form — NOT part of the 5 allowed item shapes (*, */step, value, value-value, value-value/step)', () => {
    const err = captureCronError(() => parseCron('5/15 * * * *'))
    expect(err.field).toBe('minute')
  })
})

describe('parseCron — names (case-insensitive)', () => {
  it('accepts month names in any case', () => {
    const expected = setOf(1, 7)
    expect(parseCron('* * * jan,jul *').month).toEqual(expected)
    expect(parseCron('* * * JAN,JUL *').month).toEqual(expected)
    expect(parseCron('* * * Jan,Jul *').month).toEqual(expected)
  })

  it('accepts day-of-week names in any case, SUN-SAT covering the whole week', () => {
    const allDays = setOf(...range(0, 6))
    expect(parseCron('* * * * sun-sat').dow).toEqual(allDays)
    expect(parseCron('* * * * SUN-SAT').dow).toEqual(allDays)
  })
})

describe('parseCron — day-of-week 7 ≡ 0', () => {
  it('a bare "7" means Sunday, same as 0', () => {
    expect(parseCron('* * * * 7').dow).toEqual(setOf(0))
  })

  it('"5-7" (FRI-SUN) is exactly why 7 exists: expresses a range crossing Sunday without wraparound', () => {
    expect(parseCron('* * * * 5-7').dow).toEqual(setOf(5, 6, 0))
  })

  it('a leading-zero "07" still resolves to Sunday (0)', () => {
    expect(parseCron('* * * * 07').dow).toEqual(setOf(0))
  })
})

describe('parseCron — bounds enforced with field-named errors', () => {
  it('minute out of range (60 > 59)', () => {
    expect(captureCronError(() => parseCron('60 * * * *')).field).toBe('minute')
  })

  it('hour out of range (24 > 23)', () => {
    expect(captureCronError(() => parseCron('* 24 * * *')).field).toBe('hour')
  })

  it('day-of-month out of range, both below min (0) and above max (32)', () => {
    expect(captureCronError(() => parseCron('* * 0 * *')).field).toBe('dom')
    expect(captureCronError(() => parseCron('* * 32 * *')).field).toBe('dom')
  })

  it('month out of range, both below min (0) and above max (13)', () => {
    expect(captureCronError(() => parseCron('* * * 0 *')).field).toBe('month')
    expect(captureCronError(() => parseCron('* * * 13 *')).field).toBe('month')
  })

  it('day-of-week out of range (8 > 7)', () => {
    expect(captureCronError(() => parseCron('* * * * 8')).field).toBe('dow')
  })

  it('unknown month name', () => {
    expect(captureCronError(() => parseCron('* * * FOO *')).field).toBe('month')
  })

  it('unknown day-of-week name', () => {
    expect(captureCronError(() => parseCron('* * * * XYZ')).field).toBe('dow')
  })

  it('a name where the field has no name table (minute) is rejected', () => {
    expect(captureCronError(() => parseCron('MON * * * *')).field).toBe('minute')
  })
})

describe('parseCron — domRestricted / dowRestricted (raw field ≠ "*")', () => {
  it('both false when both fields are bare "*"', () => {
    const parsed = parseCron('* * * * *')
    expect(parsed.domRestricted).toBe(false)
    expect(parsed.dowRestricted).toBe(false)
  })

  it('"*/2" on day-of-month IS restricted, even though it is still a wildcard-derived form', () => {
    expect(parseCron('* * */2 * *').domRestricted).toBe(true)
  })

  it('"*/3" on day-of-week IS restricted', () => {
    expect(parseCron('* * * * */3').dowRestricted).toBe(true)
  })

  it('an explicit range or value on either field is restricted', () => {
    expect(parseCron('* * 1-5 * *').domRestricted).toBe(true)
    expect(parseCron('* * * * 1').dowRestricted).toBe(true)
  })
})

describe('nextRuns — weekday schedule: Friday 10:00 -> next Monday 09:30', () => {
  // Hand-verified independently via `date -j -f "%Y-%m-%d" ... "+%A"` (macOS BSD date,
  // NOT this module): 2026-01-02 = Friday, 2026-01-03 = Saturday, 2026-01-04 = Sunday,
  // 2026-01-05 = Monday. So from a Friday 10:00 (past that day's own 9:30 slot), with
  // Sat/Sun excluded by "1-5" (Mon-Fri), the next 09:30 is the following Monday.
  it('skips the rest of Friday, all of the weekend, lands on Monday 09:30', () => {
    const from = new Date(2026, 0, 2, 10, 0, 0) // Friday 2026-01-02 10:00
    const [next] = nextRuns('30 9 * * 1-5', from, 1)
    expect(next).toEqual(new Date(2026, 0, 5, 9, 30, 0)) // Monday 2026-01-05 09:30
  })
})

describe('nextRuns — "*/15" spacing across an hour boundary', () => {
  it('every result is exactly 900 seconds after the previous one', () => {
    const from = new Date(2026, 0, 2, 9, 50, 0) // Friday 2026-01-02 09:50 (past :45, before :00)
    const results = nextRuns('*/15 * * * *', from, 5)
    expect(results).toEqual([
      new Date(2026, 0, 2, 10, 0, 0),
      new Date(2026, 0, 2, 10, 15, 0),
      new Date(2026, 0, 2, 10, 30, 0),
      new Date(2026, 0, 2, 10, 45, 0),
      new Date(2026, 0, 2, 11, 0, 0)
    ])
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.getTime() - results[i - 1]!.getTime()).toBe(900_000)
    }
  })
})

describe('nextRuns — the vixie DOM/DOW OR rule: "0 0 13 * FRI"', () => {
  // Both day-of-month (13) and day-of-week (FRI) are restricted here, so the classic
  // vixie rule applies: a day matches if EITHER condition holds (OR), not both (AND).
  //
  // Hand-derivation, verified independently via macOS `date -j -f "%Y-%m-%d" ... "+%A"`
  // (not this module, not a re-run of the code under test):
  //   2026-01-01 = Thursday   (the `from` date itself; doesn't match either condition)
  //   2026-01-02 = Friday     -> dow match
  //   2026-01-03..08          -> no match (not the 13th, not a Friday)
  //   2026-01-09 = Friday     -> dow match
  //   2026-01-13 = Tuesday    -> dom match ONLY (proves the OR: a non-Friday 13th still hits)
  //   2026-01-16 = Friday     -> dow match
  //   2026-01-23 = Friday     -> dow match
  // First 5 in chronological order: Jan 2, 9, 13, 16, 23 — all at 00:00 (minute=0, hour=0).
  it('first 5 matches are Jan 2, 9, 13 (a Tuesday — the OR proof), 16, 23, all at 00:00', () => {
    const from = new Date(2026, 0, 1, 0, 0, 0) // Thursday 2026-01-01 00:00
    const results = nextRuns('0 0 13 * FRI', from, 5)
    expect(results).toEqual([
      new Date(2026, 0, 2, 0, 0, 0),
      new Date(2026, 0, 9, 0, 0, 0),
      new Date(2026, 0, 13, 0, 0, 0),
      new Date(2026, 0, 16, 0, 0, 0),
      new Date(2026, 0, 23, 0, 0, 0)
    ])
    // The 13th really is a Tuesday, not a Friday — confirming this run only matched via dom.
    expect(results[2]!.getDay()).toBe(2) // 2 = Tuesday in Date#getDay()
  })
})

describe('nextRuns — "0 0 31 2 *" (day 31 of February) never matches', () => {
  it('throws the exact 4-year-bound CronError (February never has a 31st day)', () => {
    const err = captureCronError(() => nextRuns('0 0 31 2 *', new Date(2026, 0, 1), 1))
    expect(err.message).toBe('No matching times in the next 4 years')
  })
})

describe('nextRuns — "0 0 29 2 *" (leap day) from 2026-03-01', () => {
  // 2026 and 2027 are not leap years (confirmed independently: BSD `date` rolls
  // 2026-02-29 -> 2026-03-01 and 2027-02-29 -> 2027-03-01, i.e. neither date exists).
  // 2028 IS a leap year (BSD `date` accepts 2028-02-29 as-is, a real Tuesday).
  it('the next Feb 29 after 2026-03-01 is 2028-02-29', () => {
    const from = new Date(2026, 2, 1, 0, 0, 0) // 2026-03-01
    const [next] = nextRuns('0 0 29 2 *', from, 1)
    expect(next).toEqual(new Date(2028, 1, 29, 0, 0, 0))
  })
})

describe('nextRuns — count is honored: exactly N results, ascending, unique', () => {
  it('returns exactly N results in strictly ascending order with no duplicates', () => {
    const from = new Date(2026, 0, 1, 0, 0, 0)
    const results = nextRuns('0 6 * * *', from, 6)
    expect(results).toHaveLength(6)
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.getTime()).toBeGreaterThan(results[i - 1]!.getTime())
    }
    const uniqueTimes = new Set(results.map((d) => d.getTime()))
    expect(uniqueTimes.size).toBe(results.length)
    // Sanity: daily at 06:00 starting the day of `from` (00:00 -> first whole minute
    // 00:01 -> that same day's 06:00 already qualifies).
    expect(results[0]).toEqual(new Date(2026, 0, 1, 6, 0, 0))
    expect(results[5]).toEqual(new Date(2026, 0, 6, 6, 0, 0))
  })
})

describe('describeCron — 5 pinned canonical outputs (exact)', () => {
  it('30 9 * * 1-5', () => {
    expect(describeCron('30 9 * * 1-5')).toBe('At 09:30, Monday through Friday')
  })

  it('*/15 * * * *', () => {
    expect(describeCron('*/15 * * * *')).toBe('Every 15 minutes')
  })

  it('0 0 1 * *', () => {
    expect(describeCron('0 0 1 * *')).toBe('At 00:00, on day 1 of the month')
  })

  it('0 12 * JAN,JUL *', () => {
    expect(describeCron('0 12 * JAN,JUL *')).toBe('At 12:00, in January and July')
  })

  it('45 23 * * SUN', () => {
    expect(describeCron('45 23 * * SUN')).toBe('At 23:45, on Sunday')
  })
})

describe('describeCron — additional cases (substring assertions only)', () => {
  it('every-N-hours phrasing: "0 */2 * * *"', () => {
    expect(describeCron('0 */2 * * *')).toContain('Every 2 hours')
  })

  it('a day-of-month list joins with "and": "0 9 1,15 * *"', () => {
    const text = describeCron('0 9 1,15 * *')
    expect(text).toContain('09:00')
    expect(text).toContain('1 and 15')
  })

  it('a 3+ item day-of-week list uses an Oxford-comma join: "0 8 * * 1,3,5"', () => {
    const text = describeCron('0 8 * * 1,3,5')
    expect(text).toContain('08:00')
    expect(text).toContain('Monday, Wednesday, and Friday')
  })
})
