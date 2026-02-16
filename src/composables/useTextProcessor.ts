import { ref } from 'vue'
import { js as jsBeautify, css as cssBeautify, html as htmlBeautify } from 'js-beautify'
import { format as sqlFormat } from 'sql-formatter'

/**
 * Supported text types for processing and formatting
 */
export type TextType = 'json' | 'sql' | 'css' | 'xml' | 'js' | 'text'

/**
 * Result interface for text formatting operations
 */
export interface FormatResult {
  success: boolean
  formatted: string | null
  type: TextType
  error: string | null
}

/**
 * Detects the type of text content based on structure and keywords
 */
const detectTypeClient = (text: string): TextType => {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()

  // JSON detection — must be valid JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Fall through
    }
  }

  // XML/HTML detection
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return 'xml'
  }

  // SQL detection
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(trimmed)) {
    return 'sql'
  }

  // CSS detection — selector { property: value } pattern
  if (/[.#@a-z][\w-]*\s*\{[^}]*:[^}]*\}/i.test(trimmed)) {
    return 'css'
  }

  // JS detection
  if (/\b(function|const|let|var|import|export|class)\b/.test(lower) ||
      trimmed.includes('=>')) {
    return 'js'
  }

  return 'text'
}

const formatJSON = (text: string): FormatResult => {
  try {
    const parsed = JSON.parse(text)
    return { success: true, formatted: JSON.stringify(parsed, null, 2), type: 'json', error: null }
  } catch (error) {
    return { success: false, formatted: null, type: 'json', error: error instanceof Error ? error.message : 'Invalid JSON' }
  }
}

const formatSQL = (text: string): FormatResult => {
  try {
    const formatted = sqlFormat(text, {
      tabWidth: 2,
      useTabs: false,
      keywordCase: 'upper',
      dataTypeCase: 'upper',
      functionCase: 'upper'
    })
    return { success: true, formatted, type: 'sql', error: null }
  } catch (error) {
    return { success: false, formatted: null, type: 'sql', error: error instanceof Error ? error.message : 'SQL formatting failed' }
  }
}

const formatCSS = (text: string): FormatResult => {
  try {
    const formatted = cssBeautify(text, {
      indent_size: 2,
      indent_char: ' ',
      end_with_newline: true,
      newline_between_rules: true
    })
    return { success: true, formatted, type: 'css', error: null }
  } catch (error) {
    return { success: false, formatted: null, type: 'css', error: error instanceof Error ? error.message : 'CSS formatting failed' }
  }
}

const formatXML = (text: string): FormatResult => {
  try {
    const formatted = htmlBeautify(text, {
      indent_size: 2,
      indent_char: ' ',
      wrap_line_length: 0,
      preserve_newlines: false,
      end_with_newline: true,
      indent_inner_html: true,
      unformatted: []
    })
    return { success: true, formatted, type: 'xml', error: null }
  } catch (error) {
    return { success: false, formatted: null, type: 'xml', error: error instanceof Error ? error.message : 'XML formatting failed' }
  }
}

const formatJS = (text: string): FormatResult => {
  // Try JSON first — valid JSON should be pretty-printed as JSON
  try {
    const parsed = JSON.parse(text)
    return { success: true, formatted: JSON.stringify(parsed, null, 2), type: 'js', error: null }
  } catch {
    // Not JSON, format as JS
  }

  try {
    const formatted = jsBeautify(text, {
      indent_size: 2,
      indent_char: ' ',
      preserve_newlines: true,
      max_preserve_newlines: 2,
      end_with_newline: true,
      wrap_line_length: 0
    })
    return { success: true, formatted, type: 'js', error: null }
  } catch (error) {
    return { success: false, formatted: null, type: 'js', error: error instanceof Error ? error.message : 'JavaScript formatting failed' }
  }
}

export const useTextProcessor = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const detectType = async (text: string): Promise<TextType> => {
    if (!text.trim()) return 'text'
    return detectTypeClient(text)
  }

  /**
   * Format text. If typeHint is provided, use that type instead of auto-detecting.
   */
  const formatText = async (text: string, typeHint?: TextType): Promise<FormatResult> => {
    isLoading.value = true
    error.value = null

    try {
      const type = typeHint || detectTypeClient(text)

      let result: FormatResult

      switch (type) {
        case 'json':
          result = formatJSON(text)
          break
        case 'sql':
          result = formatSQL(text)
          break
        case 'css':
          result = formatCSS(text)
          break
        case 'xml':
          result = formatXML(text)
          break
        case 'js':
          result = formatJS(text)
          break
        default:
          result = { success: true, formatted: text, type: 'text', error: null }
      }

      if (!result.success && result.error) {
        error.value = result.error
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing error'
      error.value = errorMessage
      return { success: false, formatted: null, type: 'text', error: errorMessage }
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
