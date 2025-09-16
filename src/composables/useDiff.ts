import { ref, computed, watch, type Ref } from 'vue'
import * as Diff from 'jsdiff'
import { html } from 'diff2html'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export interface DiffOptions {
  granularity: 'character' | 'word' | 'line'
  ignoreCase: boolean
  ignoreWhitespace: boolean
  showContext: boolean
  contextSize: number
}

export interface DiffStats {
  totalLines: number
  addedLines: number
  removedLines: number
  unchangedLines: number
  computationTime: number
}

export interface DiffResult {
  html: string
  unified: string
  stats: DiffStats
  isEmpty: boolean
}

const DEFAULT_OPTIONS: DiffOptions = {
  granularity: 'line',
  ignoreCase: false,
  ignoreWhitespace: false,
  showContext: true,
  contextSize: 3
}

export function useDiff(
  leftText: Ref<string>,
  rightText: Ref<string>,
  options: Ref<Partial<DiffOptions>> = ref({})
) {
  const isComputing = ref(false)
  const result = ref<DiffResult>({
    html: '',
    unified: '',
    stats: {
      totalLines: 0,
      addedLines: 0,
      removedLines: 0,
      unchangedLines: 0,
      computationTime: 0
    },
    isEmpty: true
  })

  const mergedOptions = computed((): DiffOptions => ({
    ...DEFAULT_OPTIONS,
    ...options.value
  }))

  // Debounced computation
  let computeTimeout: ReturnType<typeof setTimeout> | null = null

  const computeDiff = () => {
    if (computeTimeout) {
      clearTimeout(computeTimeout)
    }

    computeTimeout = setTimeout(() => {
      performDiffComputation()
    }, 300) // 300ms debounce
  }

  const performDiffComputation = () => {
    const startTime = performance.now()
    isComputing.value = true

    try {
      const left = leftText.value
      const right = rightText.value
      const opts = mergedOptions.value

      if (!left && !right) {
        result.value = {
          html: '',
          unified: '',
          stats: {
            totalLines: 0,
            addedLines: 0,
            removedLines: 0,
            unchangedLines: 0,
            computationTime: 0
          },
          isEmpty: true
        }
        return
      }

      // Preprocess text based on options
      let processedLeft = left
      let processedRight = right

      if (opts.ignoreCase) {
        processedLeft = processedLeft.toLowerCase()
        processedRight = processedRight.toLowerCase()
      }

      if (opts.ignoreWhitespace) {
        processedLeft = processedLeft.replace(/\s+/g, ' ').trim()
        processedRight = processedRight.replace(/\s+/g, ' ').trim()
      }

      // Generate diff based on granularity
      let diff: Diff.Change[]

      switch (opts.granularity) {
        case 'character':
          diff = Diff.diffChars(processedLeft, processedRight)
          break
        case 'word':
          diff = Diff.diffWords(processedLeft, processedRight, {
            ignoreCase: opts.ignoreCase,
            ignoreWhitespace: opts.ignoreWhitespace
          })
          break
        case 'line':
        default:
          diff = Diff.diffLines(processedLeft, processedRight, {
            ignoreCase: opts.ignoreCase,
            ignoreWhitespace: opts.ignoreWhitespace,
            newlineIsToken: true
          })
          break
      }

      // Generate unified diff format
      const patch = Diff.createTwoFilesPatch(
        'original',
        'modified',
        left,
        right,
        'Original',
        'Modified',
        { context: opts.showContext ? opts.contextSize : undefined }
      )

      // Generate HTML diff
      const diffHtml = html(patch, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: 'side-by-side'
      })

      // Calculate statistics
      const stats = calculateStats(diff)
      const finalStats = {
        ...stats,
        computationTime: performance.now() - startTime
      }

      result.value = {
        html: diffHtml,
        unified: patch,
        stats: finalStats,
        isEmpty: diff.length === 0 || (diff.length === 1 && !diff[0].added && !diff[0].removed)
      }
    } catch (error) {
      console.error('Error computing diff:', error)
      result.value = {
        html: '<div class="error">Error computing diff</div>',
        unified: '',
        stats: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          unchangedLines: 0,
          computationTime: performance.now() - startTime
        },
        isEmpty: true
      }
    } finally {
      isComputing.value = false
    }
  }

  const calculateStats = (diff: Diff.Change[]): DiffStats => {
    let addedLines = 0
    let removedLines = 0
    let unchangedLines = 0

    diff.forEach(change => {
      const lines = change.value.split('\n').length - 1 || 1

      if (change.added) {
        addedLines += lines
      } else if (change.removed) {
        removedLines += lines
      } else {
        unchangedLines += lines
      }
    })

    return {
      totalLines: addedLines + removedLines + unchangedLines,
      addedLines,
      removedLines,
      unchangedLines,
      computationTime: 0 // Will be set by caller
    }
  }

  // Auto-detect file language for syntax highlighting
  const detectLanguage = (text: string): string => {
    const trimmed = text.trim()

    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed)
        return 'json'
      } catch {
        // Not valid JSON, continue with other detections
      }
    }

    // SQL detection
    const sqlKeywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i
    if (sqlKeywords.test(trimmed)) {
      return 'sql'
    }

    // XML/HTML detection
    if (trimmed.startsWith('<') && trimmed.includes('>')) {
      return trimmed.includes('<!DOCTYPE html') || trimmed.includes('<html') ? 'html' : 'xml'
    }

    // JavaScript/TypeScript detection
    if (trimmed.includes('function') || trimmed.includes('=>') ||
        trimmed.includes('const ') || trimmed.includes('let ') ||
        trimmed.includes('interface ') || trimmed.includes('type ')) {
      return trimmed.includes('interface ') || trimmed.includes('type ') ? 'typescript' : 'javascript'
    }

    // CSS detection
    if (trimmed.includes('{') && trimmed.includes('}') &&
        (trimmed.includes(':') && trimmed.includes(';'))) {
      return 'css'
    }

    // Python detection
    if (trimmed.includes('def ') || trimmed.includes('import ') ||
        trimmed.includes('from ') || /^\s*#.*python/i.test(trimmed)) {
      return 'python'
    }

    return 'plaintext'
  }

  const highlightText = (text: string, language?: string) => {
    const detectedLang = language || detectLanguage(text)

    try {
      if (hljs.getLanguage(detectedLang)) {
        return hljs.highlight(text, { language: detectedLang }).value
      }
    } catch (error) {
      console.warn('Syntax highlighting failed:', error)
    }

    return hljs.highlightAuto(text).value
  }

  // Export functions
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Watch for changes and trigger computation
  watch([leftText, rightText, options], computeDiff, { immediate: true })

  return {
    result: computed(() => result.value),
    isComputing: computed(() => isComputing.value),
    options: mergedOptions,
    computeDiff,
    detectLanguage,
    highlightText,
    copyToClipboard,
    downloadFile
  }
}