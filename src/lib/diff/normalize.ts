export type IndicatorKind =
  | 'eol-differs'
  | 'no-trailing-newline-left'
  | 'no-trailing-newline-right'
  | 'bom-left'
  | 'bom-right'
export interface Indicator { kind: IndicatorKind; detail: string }
export type EolStyle = 'lf' | 'crlf' | 'cr' | 'mixed' | 'none'
export interface NormalizeResult { left: string; right: string; indicators: Indicator[] }

const EOL_NAMES: Record<EolStyle, string> = {
  lf: 'LF', crlf: 'CRLF', cr: 'CR', mixed: 'mixed', none: 'none'
}

export function detectEol(text: string): EolStyle {
  const crlf = (text.match(/\r\n/g) || []).length
  const loneCr = (text.match(/\r(?!\n)/g) || []).length
  const loneLf = (text.match(/(?<!\r)\n/g) || []).length
  const kinds = [crlf > 0, loneCr > 0, loneLf > 0].filter(Boolean).length
  if (kinds === 0) return 'none'
  if (kinds > 1) return 'mixed'
  if (crlf > 0) return 'crlf'
  if (loneCr > 0) return 'cr'
  return 'lf'
}

const stripBom = (text: string): { text: string; hadBom: boolean } =>
  text.startsWith('﻿') ? { text: text.slice(1), hadBom: true } : { text, hadBom: false }

const toLf = (text: string): string => text.replace(/\r\n?/g, '\n')

export function normalizePair(left: string, right: string): NormalizeResult {
  const indicators: Indicator[] = []
  const l = stripBom(left)
  const r = stripBom(right)
  if (l.hadBom) indicators.push({ kind: 'bom-left', detail: 'Byte-order mark present in left input' })
  if (r.hadBom) indicators.push({ kind: 'bom-right', detail: 'Byte-order mark present in right input' })

  const leftEol = detectEol(l.text)
  const rightEol = detectEol(r.text)
  if (leftEol !== rightEol && leftEol !== 'none' && rightEol !== 'none') {
    indicators.push({
      kind: 'eol-differs',
      detail: `Line endings differ: left ${EOL_NAMES[leftEol]}, right ${EOL_NAMES[rightEol]}`
    })
  }

  const leftNorm = toLf(l.text)
  const rightNorm = toLf(r.text)
  const leftTrail = leftNorm.endsWith('\n')
  const rightTrail = rightNorm.endsWith('\n')
  if (leftTrail !== rightTrail) {
    if (!leftTrail) indicators.push({ kind: 'no-trailing-newline-left', detail: 'No newline at end of left input' })
    if (!rightTrail) indicators.push({ kind: 'no-trailing-newline-right', detail: 'No newline at end of right input' })
  }

  return { left: leftNorm, right: rightNorm, indicators }
}
