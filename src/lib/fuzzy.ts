const COMBINING_MARKS = /\p{M}/gu
const WORD_BOUNDARY = /[\s\-_]/

const normalize = (value: string): string => value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()

/**
 * Case- and diacritic-insensitive subsequence fuzzy score.
 *
 * 0 means no match (query is empty, or some query char never occurs, in order,
 * in target). Otherwise, scans target left-to-right once, greedily taking the
 * next occurrence of each query char in turn, scoring each matched char:
 *   - +3 if matched at a word boundary (index 0, or previous char is space/-/_)
 *   - +2 if matched immediately after the previous match (contiguous run)
 *   - +1 otherwise
 * The summed score is divided by target.length and scaled to a 0..100-ish
 * range, so shorter targets win ties against longer ones with the same
 * matched chars.
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0

  const q = normalize(query)
  const t = normalize(target)
  if (!q || !t) return 0

  let score = 0
  let searchFrom = 0
  let lastMatchIndex = -1

  for (const ch of q) {
    const matchIndex = t.indexOf(ch, searchFrom)
    if (matchIndex === -1) return 0

    const atBoundary = matchIndex === 0 || WORD_BOUNDARY.test(t[matchIndex - 1])
    const consecutive = matchIndex === lastMatchIndex + 1

    if (atBoundary) score += 3
    else if (consecutive) score += 2
    else score += 1

    lastMatchIndex = matchIndex
    searchFrom = matchIndex + 1
  }

  return (score / t.length) * 100
}

/**
 * Scores `items` by `fuzzyScore(query, key(item))`, drops non-matches (score
 * 0), and sorts descending by score. Ties preserve the input's relative
 * order (stable sort).
 */
export function fuzzyFilter<T>(query: string, items: T[], key: (t: T) => string): T[] {
  return items
    .map((item, index) => ({ item, index, score: fuzzyScore(query, key(item)) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(entry => entry.item)
}
