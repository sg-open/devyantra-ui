import { ref } from 'vue'
import type { Ref } from 'vue'
import { computeDiffModel } from '@/lib/diff'
import type { DiffOptions, ComputeResult } from '@/lib/diff'
import type { DiffModel } from '@/lib/diff/model'
import type { DiffRequest, DiffResponse } from '@/workers/diff.worker'

export type DiffWorkerState = 'idle' | 'computing' | 'done' | 'error' | 'too-large'

export interface UseDiffWorkerReturn {
  state: Ref<DiffWorkerState>
  model: Ref<DiffModel | null>
  errorDetail: Ref<string>
  elapsedMs: Ref<number>
  compute(left: string, right: string, options: DiffOptions): void
  cancel(): void
  readonly usingFallback: boolean
}

// useDiffWorker — request/supersede/fallback/progress state for diff computation.
// Not used inside component setup only (also driven directly in tests), so no
// lifecycle hooks (onUnmounted etc.): the elapsedMs interval is cleared any time
// state leaves 'computing', from whichever call site causes that transition.
export function useDiffWorker(): UseDiffWorkerReturn {
  const state = ref<DiffWorkerState>('idle')
  const model = ref<DiffModel | null>(null)
  const errorDetail = ref('')
  const elapsedMs = ref(0)

  let worker: Worker | null = null
  let workerFailed = false
  let latestId = 0
  let intervalHandle: ReturnType<typeof setInterval> | null = null

  const stopTimer = (): void => {
    if (intervalHandle !== null) {
      clearInterval(intervalHandle)
      intervalHandle = null
    }
  }

  const startTimer = (): void => {
    stopTimer()
    const startedAt = Date.now()
    elapsedMs.value = 0
    intervalHandle = setInterval(() => {
      elapsedMs.value = Date.now() - startedAt
    }, 100)
  }

  const applyResult = (id: number, result: ComputeResult): void => {
    if (id !== latestId) return // superseded — a newer request/cancel has already landed
    stopTimer()
    if (result.ok) {
      model.value = result.model
      errorDetail.value = ''
      state.value = 'done'
    } else {
      model.value = null
      errorDetail.value = result.detail
      state.value = 'too-large'
    }
  }

  const applyError = (id: number, message: string): void => {
    if (id !== latestId) return // superseded
    stopTimer()
    model.value = null
    errorDetail.value = message
    state.value = 'error'
  }

  // Lazily constructs the worker on first use; reused afterwards. Once construction
  // has failed, stays in fallback mode permanently (retrying is pointless — an
  // environment without Worker support isn't going to gain it mid-session).
  const getWorker = (): Worker | null => {
    if (workerFailed) return null
    if (worker) return worker
    try {
      const instance = new Worker(new URL('../workers/diff.worker.ts', import.meta.url), { type: 'module' })
      instance.onmessage = (event: MessageEvent<DiffResponse>) => {
        const data = event.data
        if ('error' in data) {
          applyError(data.id, data.error)
        } else {
          applyResult(data.id, data.result)
        }
      }
      worker = instance
      return instance
    } catch {
      workerFailed = true
      worker = null
      return null
    }
  }

  const compute = (left: string, right: string, options: DiffOptions): void => {
    const id = ++latestId
    state.value = 'computing'
    model.value = null
    errorDetail.value = ''
    startTimer()

    const activeWorker = getWorker()
    if (activeWorker) {
      const request: DiffRequest = { id, left, right, options }
      activeWorker.postMessage(request)
      return
    }

    // Sync fallback: still wrap in setTimeout(0) so 'computing' paints before the
    // (blocking) main-thread compute runs.
    setTimeout(() => {
      if (id !== latestId) return // cancelled/superseded before it ran
      try {
        const result = computeDiffModel(left, right, options)
        applyResult(id, result)
      } catch (err) {
        applyError(id, err instanceof Error ? err.message : 'Diff computation failed')
      }
    }, 0)
  }

  const cancel = (): void => {
    latestId++ // any in-flight request/timer response is now stale and will be dropped
    stopTimer()
    state.value = 'idle'
    model.value = null
    errorDetail.value = ''
  }

  return {
    state,
    model,
    errorDetail,
    elapsedMs,
    compute,
    cancel,
    get usingFallback() {
      return workerFailed
    }
  }
}
