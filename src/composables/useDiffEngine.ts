import { ref, computed, watch, type Ref } from 'vue'
import DiffMatchPatch from 'diff-match-patch'

export interface DiffStats {
  additions: number
  deletions: number
  modifications: number
  totalLines: number
  computeTime: number
}

export interface ChangeHunk {
  index: number
  startLine: number
  endLine: number
  type: 'added' | 'removed' | 'modified'
}

export function useDiffEngine(
  leftText: Ref<string>,
  rightText: Ref<string>
) {
  const stats = ref<DiffStats | null>(null)
  const changeHunks = ref<ChangeHunk[]>([])
  const isComputing = ref(false)
  const unifiedPatch = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const hasBothInputs = computed(() => {
    return leftText.value.trim().length > 0 && rightText.value.trim().length > 0
  })

  const computeDiff = () => {
    if (!hasBothInputs.value) {
      stats.value = null
      changeHunks.value = []
      unifiedPatch.value = ''
      return
    }

    isComputing.value = true
    const startTime = performance.now()

    try {
      const dmp = new DiffMatchPatch()
      dmp.Diff_Timeout = 5.0

      const left = leftText.value
      const right = rightText.value

      // Line-level diff for stats and hunks
      const leftLines = left.split('\n')
      const rightLines = right.split('\n')

      // Use diff-match-patch's line mode for line-level comparison
      const lineDiffData = dmp.diff_linesToChars_(left, right)
      const diffs = dmp.diff_main(lineDiffData.chars1, lineDiffData.chars2, false)
      dmp.diff_charsToLines_(diffs, lineDiffData.lineArray)
      dmp.diff_cleanupSemantic(diffs)

      // Calculate accurate stats
      let additions = 0
      let deletions = 0
      const hunks: ChangeHunk[] = []
      let currentLine = 0
      let hunkIndex = 0

      // Track paired removals/additions as modifications
      let pendingRemovals = 0
      let pendingRemovalStartLine = -1

      for (const [op, text] of diffs) {
        const lineCount = text.split('\n').length - (text.endsWith('\n') ? 1 : 0)

        if (op === DiffMatchPatch.DIFF_DELETE) {
          pendingRemovals = lineCount
          pendingRemovalStartLine = currentLine
          currentLine += lineCount
        } else if (op === DiffMatchPatch.DIFF_INSERT) {
          if (pendingRemovals > 0) {
            // Paired with preceding removal = modification
            const modCount = Math.min(pendingRemovals, lineCount)
            const extraRemovals = pendingRemovals - modCount
            const extraAdditions = lineCount - modCount

            hunks.push({
              index: hunkIndex++,
              startLine: pendingRemovalStartLine,
              endLine: pendingRemovalStartLine + pendingRemovals + lineCount - 1,
              type: 'modified'
            })

            deletions += extraRemovals
            additions += extraAdditions
            pendingRemovals = 0
          } else {
            additions += lineCount
            if (lineCount > 0) {
              hunks.push({
                index: hunkIndex++,
                startLine: currentLine,
                endLine: currentLine + lineCount - 1,
                type: 'added'
              })
            }
          }
        } else {
          // Equal - flush any pending removals
          if (pendingRemovals > 0) {
            deletions += pendingRemovals
            hunks.push({
              index: hunkIndex++,
              startLine: pendingRemovalStartLine,
              endLine: pendingRemovalStartLine + pendingRemovals - 1,
              type: 'removed'
            })
            pendingRemovals = 0
          }
          currentLine += lineCount
        }
      }

      // Flush remaining pending removals
      if (pendingRemovals > 0) {
        deletions += pendingRemovals
        hunks.push({
          index: hunkIndex++,
          startLine: pendingRemovalStartLine,
          endLine: pendingRemovalStartLine + pendingRemovals - 1,
          type: 'removed'
        })
      }

      const modifications = hunks.filter(h => h.type === 'modified').length

      // Generate unified diff patch
      const patches = dmp.patch_make(left, right)
      unifiedPatch.value = dmp.patch_toText(patches)

      const computeTime = Math.round(performance.now() - startTime)

      stats.value = {
        additions,
        deletions,
        modifications,
        totalLines: Math.max(leftLines.length, rightLines.length),
        computeTime
      }

      changeHunks.value = hunks
    } catch (error) {
      console.error('Error computing diff:', error)
      stats.value = null
      changeHunks.value = []
    } finally {
      isComputing.value = false
    }
  }

  const debouncedCompute = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(computeDiff, 300)
  }

  // Generate unified diff text for export
  const generateUnifiedDiff = (): string => {
    if (!hasBothInputs.value) return ''

    const dmp = new DiffMatchPatch()
    dmp.Diff_Timeout = 5.0

    const left = leftText.value
    const right = rightText.value

    // Line-level diff
    const lineDiffData = dmp.diff_linesToChars_(left, right)
    const diffs = dmp.diff_main(lineDiffData.chars1, lineDiffData.chars2, false)
    dmp.diff_charsToLines_(diffs, lineDiffData.lineArray)
    dmp.diff_cleanupSemantic(diffs)

    const lines: string[] = [
      '--- original',
      '+++ modified'
    ]

    for (const [op, text] of diffs) {
      const textLines = text.split('\n')
      // Remove trailing empty string from split
      if (textLines[textLines.length - 1] === '') textLines.pop()

      for (const line of textLines) {
        if (op === DiffMatchPatch.DIFF_DELETE) {
          lines.push(`-${line}`)
        } else if (op === DiffMatchPatch.DIFF_INSERT) {
          lines.push(`+${line}`)
        } else {
          lines.push(` ${line}`)
        }
      }
    }

    return lines.join('\n')
  }

  const copyDiffToClipboard = async (): Promise<boolean> => {
    const diff = generateUnifiedDiff()
    if (!diff) return false
    try {
      await navigator.clipboard.writeText(diff)
      return true
    } catch {
      return false
    }
  }

  const downloadPatch = () => {
    const diff = generateUnifiedDiff()
    if (!diff) return

    const blob = new Blob([diff], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'diff.patch'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  watch([leftText, rightText], debouncedCompute, { immediate: true })

  return {
    stats: computed(() => stats.value),
    changeHunks: computed(() => changeHunks.value),
    isComputing: computed(() => isComputing.value),
    hasBothInputs,
    generateUnifiedDiff,
    copyDiffToClipboard,
    downloadPatch
  }
}
