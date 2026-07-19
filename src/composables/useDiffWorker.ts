import { ref, getCurrentScope, onScopeDispose } from 'vue'
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
// May be constructed outside a component's setup too (driven directly in
// tests), so cleanup is opt-in via getCurrentScope(): inside a component, that
// active effect scope is enough for onScopeDispose to terminate the worker and
// stop the elapsed-timer interval on unmount, with no onUnmounted call needed
// here; outside one (a bare test), registration is skipped entirely rather
// than warning or throwing.
export function useDiffWorker(): UseDiffWorkerReturn {
  const state = ref<DiffWorkerState>('idle')
  const model = ref<DiffModel | null>(null)
  const errorDetail = ref('')
  const elapsedMs = ref(0)

  let worker: Worker | null = null
  let workerFailed = false
  let latestId = 0
  let intervalHandle: ReturnType<typeof setInterval> | null = null
  // The most recently posted request — kept only so a runtime worker failure
  // (onerror, I5) can still complete it via the synchronous fallback. Cleared
  // once a response actually lands for it.
  let inFlightRequest: DiffRequest | null = null

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

  const terminateWorker = (): void => {
    worker?.terminate()
    worker = null
  }

  const applyResult = (id: number, result: ComputeResult): void => {
    if (id !== latestId) return // superseded — a newer request/cancel has already landed
    if (inFlightRequest?.id === id) inFlightRequest = null
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
    if (inFlightRequest?.id === id) inFlightRequest = null
    stopTimer()
    model.value = null
    errorDetail.value = message
    state.value = 'error'
  }

  // Sync fallback: still wrap in setTimeout(0) so 'computing' paints before the
  // (blocking) main-thread compute runs. Shared by "no worker support at all"
  // (getWorker's catch) and "the worker we had just died at runtime" (onerror
  // below, I5) — both leave a request that will otherwise never resolve.
  const runFallback = (id: number, left: string, right: string, options: DiffOptions): void => {
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
      // A worker *runtime* failure (e.g. a script error) — as opposed to a
      // normal computeDiffModel failure, which arrives as a well-formed
      // {id, error} message instead — means the in-flight request will never
      // get a response from this worker at all (eternal spinner, I5). Fall
      // back synchronously so the UI still reaches a terminal state, and stop
      // trying to use a worker for the rest of the session (same policy as a
      // construction failure, in the catch below — this can only fire once in
      // practice, since workerFailed permanently short-circuits getWorker
      // before another instance/onerror could ever be attached).
      instance.onerror = (): void => {
        console.warn('Diff worker failed at runtime; falling back to synchronous compute.')
        workerFailed = true
        terminateWorker()
        if (inFlightRequest) {
          const { id, left, right, options } = inFlightRequest
          runFallback(id, left, right, options)
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
      inFlightRequest = request
      activeWorker.postMessage(request)
      return
    }

    runFallback(id, left, right, options)
  }

  const cancel = (): void => {
    latestId++ // any in-flight request/timer response is now stale and will be dropped
    stopTimer()
    // A cancelled compute may be well into a genuinely expensive diff, running
    // on the worker's one thread — terminating it (I4), rather than leaving it
    // to grind on in the background, means the next compute gets a fresh
    // worker immediately instead of queueing behind the abandoned request.
    terminateWorker()
    inFlightRequest = null
    state.value = 'idle'
    model.value = null
    errorDetail.value = ''
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      stopTimer()
      terminateWorker()
    })
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
