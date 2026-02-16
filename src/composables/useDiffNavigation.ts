import { ref, computed, onUnmounted, type Ref } from 'vue'

export interface NavigationHunk {
  index: number
  element: Element
}

export function useDiffNavigation(containerRef: Ref<HTMLElement | undefined>) {
  const hunks = ref<NavigationHunk[]>([])
  const currentIndex = ref(-1)
  let observer: MutationObserver | null = null

  const totalChanges = computed(() => hunks.value.length)

  const hasChanges = computed(() => totalChanges.value > 0)

  const scanForChanges = () => {
    if (!containerRef.value) {
      hunks.value = []
      currentIndex.value = -1
      return
    }

    // In split mode, diff2html creates two .d2h-file-side-diff tables.
    // We scan only the FIRST side (left/original) to avoid double-counting.
    // In unified mode, there's a single table — scan all rows.
    const sidePanel = containerRef.value.querySelector('.d2h-file-side-diff')
    const scanRoot = sidePanel || containerRef.value

    // Target <tr> rows that contain change cells, not individual <td>s
    const rows = scanRoot.querySelectorAll('tr')
    const changedRows: Element[] = []

    rows.forEach((tr) => {
      // A row is a "change" if it has a td with d2h-del or d2h-ins (but not d2h-info)
      const hasChange = tr.querySelector('td.d2h-del, td.d2h-ins')
      const isInfo = tr.querySelector('td.d2h-info')
      if (hasChange && !isInfo) {
        changedRows.push(tr)
      }
    })

    // Group consecutive changed rows into hunks
    const newHunks: NavigationHunk[] = []
    let hunkIndex = 0

    for (let i = 0; i < changedRows.length; i++) {
      const row = changedRows[i]!
      const prevRow = i > 0 ? changedRows[i - 1] : null

      // Check if this row immediately follows the previous one in the DOM
      const isConsecutive = prevRow && prevRow.nextElementSibling === row

      if (!isConsecutive) {
        // Start of a new hunk — use this row as the navigation target
        newHunks.push({
          index: hunkIndex++,
          element: row
        })
      }
    }

    hunks.value = newHunks

    if (currentIndex.value < 0 || currentIndex.value >= newHunks.length) {
      currentIndex.value = newHunks.length > 0 ? 0 : -1
    }
  }

  const scrollToHunk = (index: number) => {
    if (index < 0 || index >= hunks.value.length) return

    const hunk = hunks.value[index]
    currentIndex.value = index

    // Remove highlight from all hunks
    hunks.value.forEach(h => {
      h.element.classList.remove('diff-nav-highlight')
    })

    // Add highlight to current hunk
    hunk?.element.classList.add('diff-nav-highlight')

    // Scroll into view
    hunk?.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  const nextChange = () => {
    if (!hasChanges.value) return

    const next = currentIndex.value + 1 >= totalChanges.value ? 0 : currentIndex.value + 1
    scrollToHunk(next)
  }

  const prevChange = () => {
    if (!hasChanges.value) return

    const prev = currentIndex.value - 1 < 0 ? totalChanges.value - 1 : currentIndex.value - 1
    scrollToHunk(prev)
  }

  const goToChange = (index: number) => {
    scrollToHunk(index)
  }

  const startObserving = () => {
    if (!containerRef.value) return

    // Initial scan
    scanForChanges()

    // Observe DOM changes to re-scan when diff2html re-renders
    observer = new MutationObserver(() => {
      scanForChanges()
    })

    observer.observe(containerRef.value, {
      childList: true,
      subtree: true
    })
  }

  const stopObserving = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onUnmounted(() => {
    stopObserving()
  })

  return {
    currentIndex: computed(() => currentIndex.value),
    totalChanges,
    hasChanges,
    nextChange,
    prevChange,
    goToChange,
    startObserving,
    stopObserving,
    scanForChanges
  }
}
