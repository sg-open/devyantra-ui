import { ref } from 'vue'

/**
 * Supported text types for processing and formatting
 */
export type TextType = 'json' | 'sql' | 'css' | 'xml' | 'text'

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

  return {
    isLoading,
    error,
    detectType,
    formatText
  }
}