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

    const elements = containerRef.value.querySelectorAll(
      '.vue-diff-cell-removed, .vue-diff-cell-added'
    )

    // Group consecutive change elements into hunks (take the first element of each group)
    const newHunks: NavigationHunk[] = []
    let lastElement: Element | null = null
    let hunkIndex = 0

    elements.forEach((el) => {
      // Check if this element is adjacent to the previous one
      const isAdjacent = lastElement &&
        (lastElement.nextElementSibling === el ||
         lastElement.parentElement?.nextElementSibling?.firstElementChild === el)

      if (!isAdjacent) {
        newHunks.push({
          index: hunkIndex++,
          element: el
        })
      }

      lastElement = el
    })

    hunks.value = newHunks

    // Reset index if it's out of bounds
    if (currentIndex.value >= newHunks.length) {
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
    hunk.element.classList.add('diff-nav-highlight')

    // Scroll into view
    hunk.element.scrollIntoView({
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

    // Observe DOM changes to re-scan when vue-diff re-renders
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
