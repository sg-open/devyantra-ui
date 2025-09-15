import { ref } from 'vue'
import DiffMatchPatch from 'diff-match-patch'
import hljs from 'highlight.js'

/**
 * Supported text types for processing and formatting
 */
export type TextType = 'json' | 'sql' | 'text'

/**
 * Result interface for text formatting operations
 */
export interface FormatResult {
  /** Whether the formatting operation succeeded */
  success: boolean
  /** The formatted text, null if operation failed */
  formatted: string | null
  /** Detected or specified text type */
  type: TextType
  /** Error message if operation failed */
  error: string | null
}

/**
 * Result interface for text comparison operations
 */
export interface CompareResult {
  /** Whether the comparison operation succeeded */
  success: boolean
  /** Whether the two texts are identical */
  equal: boolean
  /** Array of specific differences found */
  differences: Array<{
    path: string
    type: string
    value1?: unknown
    value2?: unknown
    lineNumber?: number
    content?: string
  }>
  /** HTML representation of differences */
  diffHtml?: string
  /** Unified diff format representation */
  unifiedDiff?: string
  /** Side-by-side HTML representation */
  sideBySideHtml?: string
  /** Error message if operation failed */
  error: string | null
}

/**
 * Result interface for text type detection
 */
export interface DetectTypeResult {
  /** Detected text type */
  type: TextType
}

/**
 * Detects the type of text content based on structure and keywords
 * @param text - The text content to analyze
 * @returns The detected text type
 */
const detectTypeClient = (text: string): TextType => {
  const trimmed = text.trim().toLowerCase()

  // Check for JSON-like structures (even if malformed)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json'
  }

  // Check for SQL keywords
  if (trimmed.includes('select ') || trimmed.includes('insert ') ||
      trimmed.includes('update ') || trimmed.includes('delete ') ||
      trimmed.includes('create ') || trimmed.includes('alter ') ||
      trimmed.includes('drop ')) {
    return 'sql'
  }

  return 'text'
}

/**
 * Formats JSON string with proper indentation and structure
 * @param jsonString - The JSON string to format
 * @returns FormatResult with formatted JSON or error details
 */
const formatJSON = (jsonString: string): FormatResult => {
  try {
    const parsed = JSON.parse(jsonString)
    return {
      success: true,
      formatted: JSON.stringify(parsed, null, 2),
      type: 'json',
      error: null
    }
  } catch (error) {
    return {
      success: false,
      formatted: null,
      type: 'text',
      error: error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
}

/**
 * Formats SQL string with basic formatting (currently minimal implementation)
 * @param sqlString - The SQL string to format
 * @returns FormatResult with formatted SQL or error details
 */
const formatSQL = (sqlString: string): FormatResult => {
  try {
    // Clean up the input - remove extra whitespace and normalize
    let sql = sqlString.trim().replace(/\s+/g, ' ')

    // Add line breaks before major keywords
    sql = sql
      .replace(/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, '\n$1')
      .replace(/\b(FROM)\b/gi, '\nFROM')
      .replace(/\b(WHERE)\b/gi, '\nWHERE')
      .replace(/\b(INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|JOIN)\b/gi, '\n$1')
      .replace(/\b(GROUP BY)\b/gi, '\nGROUP BY')
      .replace(/\b(HAVING)\b/gi, '\nHAVING')
      .replace(/\b(ORDER BY)\b/gi, '\nORDER BY')
      .replace(/\b(VALUES)\b/gi, '\nVALUES')
      .replace(/\b(SET)\b/gi, '\nSET')
      .replace(/\b(UNION|UNION ALL)\b/gi, '\n$1')

    // Capitalize SQL keywords
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
      'ALTER', 'DROP', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'JOIN', 'ON', 'GROUP', 'BY',
      'HAVING', 'ORDER', 'VALUES', 'SET', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'AS',
      'DISTINCT', 'UNION', 'ALL', 'LIMIT', 'OFFSET', 'ASC', 'DESC', 'COUNT', 'SUM',
      'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS'
    ]

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      sql = sql.replace(regex, keyword)
    })

    // Add proper indentation
    const lines = sql.split('\n')
    let indentLevel = 0
    const formatted = lines.map(line => {
      line = line.trim()
      if (!line) return ''

      // Decrease indent for certain keywords
      if (/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|UNION|UNION ALL)/.test(line)) {
        indentLevel = 1
      } else if (/^(INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|JOIN)/.test(line)) {
        indentLevel = 1
      } else if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/.test(line)) {
        indentLevel = 0
      }

      const indentedLine = '  '.repeat(indentLevel) + line

      // Increase indent for SELECT (for subsequent columns)
      if (/^SELECT/.test(line)) {
        indentLevel = 1
      }

      return indentedLine
    }).join('\n')

    // Clean up extra newlines and spaces
    const finalFormatted = formatted
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n+$/, '') // Remove trailing newlines
      .trim()

    return {
      success: true,
      formatted: finalFormatted,
      type: 'sql',
      error: null
    }
  } catch (error) {
    return {
      success: false,
      formatted: null,
      type: 'text',
      error: error instanceof Error ? error.message : 'SQL formatting failed'
    }
  }
}

// Line-by-line diff algorithm similar to git diff (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _createLineDiff = (text1: string, text2: string): Array<{
  path: string
  type: string
  value1?: unknown
  value2?: unknown
  lineNumber?: number
  content?: string
}> => {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')
  const differences: Array<{
    path: string
    type: string
    value1?: unknown
    value2?: unknown
    lineNumber?: number
    content?: string
  }> = []

  // Simple line-by-line comparison with context
  const maxLines = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLines; i++) {
    const line1 = i < lines1.length ? lines1[i] : undefined
    const line2 = i < lines2.length ? lines2[i] : undefined

    if (line1 === undefined && line2 !== undefined) {
      // Line added in second text
      differences.push({
        path: `line ${i + 1}`,
        type: 'line_added',
        value2: line2,
        lineNumber: i + 1,
        content: `+ ${line2}`
      })
    } else if (line1 !== undefined && line2 === undefined) {
      // Line removed from first text
      differences.push({
        path: `line ${i + 1}`,
        type: 'line_removed',
        value1: line1,
        lineNumber: i + 1,
        content: `- ${line1}`
      })
    } else if (line1 !== line2) {
      // Line modified
      differences.push({
        path: `line ${i + 1}`,
        type: 'line_modified',
        value1: line1,
        value2: line2,
        lineNumber: i + 1,
        content: `- ${line1}\n+ ${line2}`
      })
    }
  }

  return differences
}

const compareJSONObjects = (obj1: unknown, obj2: unknown, path: string = ''): Array<{
  path: string
  type: string
  value1?: unknown
  value2?: unknown
}> => {
  const differences: Array<{
    path: string
    type: string
    value1?: unknown
    value2?: unknown
  }> = []

  // Handle null/undefined cases
  if (obj1 === null && obj2 === null) return differences
  if (obj1 === null || obj1 === undefined) {
    differences.push({ path, type: 'missing_in_first', value2: obj2 })
    return differences
  }
  if (obj2 === null || obj2 === undefined) {
    differences.push({ path, type: 'missing_in_second', value1: obj1 })
    return differences
  }

  // Type comparison
  if (typeof obj1 !== typeof obj2) {
    differences.push({ path, type: 'type_changed', value1: obj1, value2: obj2 })
    return differences
  }

  // Array comparison
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLength = Math.max(obj1.length, obj2.length)
    for (let i = 0; i < maxLength; i++) {
      const newPath = path ? `${path}[${i}]` : `[${i}]`
      if (i >= obj1.length) {
        differences.push({ path: newPath, type: 'missing_in_first', value2: obj2[i] })
      } else if (i >= obj2.length) {
        differences.push({ path: newPath, type: 'missing_in_second', value1: obj1[i] })
      } else {
        differences.push(...compareJSONObjects(obj1[i], obj2[i], newPath))
      }
    }
    return differences
  }

  // Object comparison
  if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null) {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key
      if (!(key in obj1)) {
        differences.push({ path: newPath, type: 'missing_in_first', value2: obj2[key] })
      } else if (!(key in obj2)) {
        differences.push({ path: newPath, type: 'missing_in_second', value1: obj1[key] })
      } else {
        differences.push(...compareJSONObjects(obj1[key], obj2[key], newPath))
      }
    }
    return differences
  }

  // Primitive value comparison
  if (obj1 !== obj2) {
    differences.push({ path, type: 'value_changed', value1: obj1, value2: obj2 })
  }

  return differences
}

export const useTextProcessor = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const detectType = async (text: string): Promise<TextType> => {
    if (!text.trim()) return 'text'
    return detectTypeClient(text)
  }

  const formatText = async (text: string): Promise<FormatResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Add small delay to simulate processing (maintains UX)
      await new Promise(resolve => setTimeout(resolve, 100))

      const detectedType = detectTypeClient(text)

      let result: FormatResult

      if (detectedType === 'json') {
        result = formatJSON(text)
      } else if (detectedType === 'sql') {
        result = formatSQL(text)
      } else {
        // Plain text - return as-is
        result = {
          success: true,
          formatted: text,
          type: 'text',
          error: null
        }
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing error'
      error.value = errorMessage
      return {
        success: false,
        formatted: null,
        type: 'text',
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  const compareTexts = async (text1: string, text2: string): Promise<CompareResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Add small delay to simulate processing (maintains UX)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create diff-match-patch instance
      const dmp = new DiffMatchPatch()

      // Configure for better performance and quality
      dmp.Diff_Timeout = 5.0
      dmp.Diff_EditCost = 4

      // Detect content types for syntax highlighting
      const type1 = detectTypeClient(text1)
      const type2 = detectTypeClient(text2)
      const language = type1 === 'json' ? 'json' : type1 === 'sql' ? 'sql' : 'plaintext'

      // Create character-level diff
      const diffs = dmp.diff_main(text1, text2)
      dmp.diff_cleanupSemantic(diffs)

      // Check if texts are equal
      const equal = diffs.length === 1 && diffs[0][0] === DiffMatchPatch.DIFF_EQUAL

      // Generate HTML diff output
      const diffHtml = dmp.diff_prettyHtml(diffs)

      // Generate unified diff format using proper LCS algorithm
      let unifiedDiff = ''
      if (!equal) {
        const lines1 = text1.split('\n')
        const lines2 = text2.split('\n')
        const diffLines = computeLineDiff(lines1, lines2)

        unifiedDiff = '@@ -1,' + lines1.length + ' +1,' + lines2.length + ' @@\n'

        for (const diffLine of diffLines) {
          unifiedDiff += diffLine.marker + diffLine.content + '\n'
        }
      }

      // Generate side-by-side HTML using proper diff algorithm
      const sideBySideHtml = generateSideBySideHtml(text1, text2, language)

      // Legacy differences for structural analysis (JSON only)
      let structuralDifferences: Array<{
        path: string
        type: string
        value1?: unknown
        value2?: unknown
        lineNumber?: number
        content?: string
      }> = []

      if (type1 === 'json' && type2 === 'json' && !equal) {
        try {
          const obj1 = JSON.parse(text1)
          const obj2 = JSON.parse(text2)
          structuralDifferences = compareJSONObjects(obj1, obj2)
        } catch {
          // JSON parsing failed, no structural analysis
        }
      }

      const result: CompareResult = {
        success: true,
        equal,
        differences: structuralDifferences,
        diffHtml,
        unifiedDiff,
        sideBySideHtml,
        error: null
      }


      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Comparison error'
      error.value = errorMessage
      return {
        success: false,
        equal: false,
        differences: [],
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Compute proper line-based diff using Longest Common Subsequence (LCS) algorithm
  const computeLineDiff = (lines1: string[], lines2: string[]): Array<{marker: string, content: string}> => {
    const lcs = computeLCS(lines1, lines2)
    const result: Array<{marker: string, content: string}> = []

    let i = 0, j = 0, k = 0

    while (i < lines1.length || j < lines2.length) {
      if (k < lcs.length && i < lines1.length && lines1[i] === lcs[k]) {
        // Common line
        result.push({ marker: ' ', content: lines1[i] })
        i++
        j++
        k++
      } else if (k < lcs.length && j < lines2.length && lines2[j] === lcs[k]) {
        // Line was inserted in text2
        result.push({ marker: '+', content: lines2[j] })
        j++
      } else if (i < lines1.length && (k >= lcs.length || lines1[i] !== lcs[k])) {
        // Line was deleted from text1
        result.push({ marker: '-', content: lines1[i] })
        i++
      } else if (j < lines2.length) {
        // Line was inserted in text2
        result.push({ marker: '+', content: lines2[j] })
        j++
      }
    }

    return result
  }

  // Compute Longest Common Subsequence
  const computeLCS = (arr1: string[], arr2: string[]): string[] => {
    const m = arr1.length
    const n = arr2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    // Build LCS table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    // Reconstruct LCS
    const lcs: string[] = []
    let i = m, j = n

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1])
        i--
        j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }

    return lcs
  }

  // Helper function to generate side-by-side HTML using proper diff algorithm
  const generateSideBySideHtml = (text1: string, text2: string, language: string): string => {
    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    const diffLines = computeLineDiff(lines1, lines2)

    let html = `
      <div class="diff-container-wrapper">
        <div class="diff-side-by-side">
          <div class="diff-header">
            <div class="diff-column-header original-header">
              <i class="pi pi-file"></i>
              <span>Original</span>
            </div>
            <div class="diff-column-header changed-header">
              <i class="pi pi-file-edit"></i>
              <span>Changed</span>
            </div>
          </div>
          <div class="diff-columns">
            <div class="diff-column original-column">
              <div class="diff-content">`

    // Process diff to create side-by-side view
    let line1Number = 1
    let line2Number = 1

    for (const diffLine of diffLines) {
      const marker = diffLine.marker
      const content = diffLine.content

      if (marker === ' ') {
        // Common line - show in both columns
        let highlightedContent = escapeHtml(content)
        try {
          if (language !== 'plaintext' && content.trim() && language !== 'text') {
            const result = hljs.highlight(content, { language })
            highlightedContent = result.value
          }
        } catch {
          // Fallback
        }

        html += `
        <div class="diff-line">
          <span class="line-number">${line1Number.toString().padStart(3, ' ')}</span>
          <span class="line-marker"> </span>
          <span class="line-content">${highlightedContent}</span>
        </div>`

        line1Number++
        line2Number++
      } else if (marker === '-') {
        // Removed line - show only in original column
        let highlightedContent = escapeHtml(content)
        try {
          if (language !== 'plaintext' && content.trim() && language !== 'text') {
            const result = hljs.highlight(content, { language })
            highlightedContent = result.value
          }
        } catch {
          // Fallback
        }

        html += `
        <div class="diff-line diff-line-removed">
          <span class="line-number">${line1Number.toString().padStart(3, ' ')}</span>
          <span class="line-marker">-</span>
          <span class="line-content">${highlightedContent}</span>
        </div>`

        line1Number++
      } else if (marker === '+') {
        // We'll handle additions when we process the changed column
        continue
      }
    }

    html += `
              </div>
            </div>
            <div class="diff-column changed-column">
              <div class="diff-content">`

    // Reset counters for changed column
    line1Number = 1
    line2Number = 1

    for (const diffLine of diffLines) {
      const marker = diffLine.marker
      const content = diffLine.content

      if (marker === ' ') {
        // Common line - show in both columns
        let highlightedContent = escapeHtml(content)
        try {
          if (language !== 'plaintext' && content.trim() && language !== 'text') {
            const result = hljs.highlight(content, { language })
            highlightedContent = result.value
          }
        } catch {
          // Fallback
        }

        html += `
        <div class="diff-line">
          <span class="line-number">${line2Number.toString().padStart(3, ' ')}</span>
          <span class="line-marker"> </span>
          <span class="line-content">${highlightedContent}</span>
        </div>`

        line1Number++
        line2Number++
      } else if (marker === '+') {
        // Added line - show only in changed column
        let highlightedContent = escapeHtml(content)
        try {
          if (language !== 'plaintext' && content.trim() && language !== 'text') {
            const result = hljs.highlight(content, { language })
            highlightedContent = result.value
          }
        } catch {
          // Fallback
        }

        html += `
        <div class="diff-line diff-line-added">
          <span class="line-number">${line2Number.toString().padStart(3, ' ')}</span>
          <span class="line-marker">+</span>
          <span class="line-content">${highlightedContent}</span>
        </div>`

        line2Number++
      } else if (marker === '-') {
        // Removed line - skip for changed column but increment original line counter
        line1Number++
      }
    }

    html += `
              </div>
            </div>
          </div>
        </div>
      </div>`

    return html
  }

  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  return {
    isLoading,
    error,
    detectType,
    formatText,
    compareTexts
  }
}