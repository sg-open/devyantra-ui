import { ref, getCurrentScope, onScopeDispose } from 'vue'
import type { Ref } from 'vue'
import { computeRegexResult, type RegexRequest, type RegexResponse, type RegexResult } from '@/workers/regex.worker'

export type RegexWorkerState = 'idle' | 'computing' | 'done' | 'error' | 'timeout'

export interface UseRegexWorkerReturn {
  state: Ref<RegexWorkerState>
  result: Ref<RegexResult | null>
  errorDetail: Ref<string>
  run(request: Omit<RegexRequest, 'id'>): void
  cancel(): void
  readonly usingFallback: boolean
}

// A pathological pattern (catastrophic backtracking) has no natural "done" —
// JS has no preemption, so the only way to reclaim the thread is to terminate
// the worker outright. 2s is generous for any legitimate pattern/test-string
// pairing this tool targets, short enough that "timed out" reads as immediate
// feedback rather than a stall.
const TIMEOUT_MS = 2000

// useRegexWorker — request/supersede/timeout/fallback state for regex
// evaluation. Mirrors useDiffWorker's shape closely (see that file for the
// fuller rationale on scope-based cleanup and the fallback split); it differs
// in two ways: (a) a genuine watchdog timeout, since a worker running a
// catastrophic-backtracking pattern never naturally resolves on its own, and
// (b) no elapsed-time progress ticker (evaluation is expected to be
// near-instant, or to time out — there's no useful "still working" interval
// to show in between).
export function useRegexWorker(): UseRegexWorkerReturn {
  const state = ref<RegexWorkerState>('idle')
  const result = ref<RegexResult | null>(null)
  const errorDetail = ref('')

  let worker: Worker | null = null
  let workerFailed = false
  let latestId = 0
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null
  // The most recently posted request — kept only so a runtime worker failure
  // (onerror, the diff worker's I5 lesson) can still complete it via the
  // synchronous fallback. Cleared once a response/timeout actually lands for it.
  let inFlightRequest: RegexRequest | null = null

  const clearTimeoutHandle = (): void => {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
  }

  const terminateWorker = (): void => {
    worker?.terminate()
    worker = null
  }

  const applyResult = (id: number, value: RegexResult): void => {
    if (id !== latestId) return // superseded — a newer run/cancel already landed
    if (inFlightRequest?.id === id) inFlightRequest = null
    clearTimeoutHandle()
    result.value = value
    errorDetail.value = ''
    state.value = 'done'
  }

  const applyError = (id: number, message: string): void => {
    if (id !== latestId) return // superseded
    if (inFlightRequest?.id === id) inFlightRequest = null
    clearTimeoutHandle()
    result.value = null
    errorDetail.value = message
    state.value = 'error'
  }

  const applyTimeout = (id: number): void => {
    if (id !== latestId) return // already superseded or resolved just before firing
    if (inFlightRequest?.id === id) inFlightRequest = null
    // Terminate rather than let it keep spinning (same I4 policy as
    // useDiffWorker's cancel): the *next* run must get a fresh worker
    // immediately instead of queueing behind a pattern that's never coming back.
    terminateWorker()
    result.value = null
    state.value = 'timeout'
  }

  const startTimeout = (id: number): void => {
    clearTimeoutHandle()
    timeoutHandle = setTimeout(() => {
      timeoutHandle = null
      applyTimeout(id)
    }, TIMEOUT_MS)
  }

  // Sync fallback: still wrap in setTimeout(0) so 'computing' paints before
  // the (blocking) main-thread evaluation runs — same UX reasoning as
  // useDiffWorker's runFallback. "WITHOUT timeout protection" (per spec) means
  // no watchdog is armed around this: there is no worker thread left to
  // terminate in this degraded mode, so a pathological pattern here will hang
  // the tab. That trade-off is accepted for environments without Worker
  // support rather than pretending a timer could interrupt synchronous,
  // non-preemptible main-thread work.
  const runFallback = (id: number, request: Omit<RegexRequest, 'id'>): void => {
    setTimeout(() => {
      if (id !== latestId) return // cancelled/superseded before it ran
      try {
        const value = computeRegexResult(request.pattern, request.flags, request.testString, request.replacement)
        applyResult(id, value)
      } catch (err) {
        applyError(id, err instanceof Error ? err.message : 'Invalid regular expression')
      }
    }, 0)
  }

  // Lazily constructs the worker on first use; reused afterwards. Once
  // construction has failed, stays in fallback mode permanently (retrying is
  // pointless — an environment without Worker support isn't going to gain it
  // mid-session).
  const getWorker = (): Worker | null => {
    if (workerFailed) return null
    if (worker) return worker
    try {
      const instance = new Worker(new URL('../workers/regex.worker.ts', import.meta.url), { type: 'module' })
      instance.onmessage = (event: MessageEvent<RegexResponse>) => {
        const data = event.data
        if ('error' in data) {
          applyError(data.id, data.error)
        } else {
          applyResult(data.id, data.result)
        }
      }
      // A worker *runtime* failure (as opposed to a normal invalid-pattern
      // failure, which arrives as a well-formed {id, error} message instead)
      // means the in-flight request will never get a response from this
      // worker at all. Fall back synchronously so the UI still reaches a
      // terminal state, and stop trying to use a worker for the rest of the
      // session (same policy as a construction failure, in the catch below).
      instance.onerror = (): void => {
        console.warn('Regex worker failed at runtime; falling back to synchronous evaluation.')
        workerFailed = true
        terminateWorker()
        clearTimeoutHandle()
        if (inFlightRequest) {
          const { id, pattern, flags, testString, replacement } = inFlightRequest
          runFallback(id, { pattern, flags, testString, replacement })
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

  const run = (request: Omit<RegexRequest, 'id'>): void => {
    const id = ++latestId
    state.value = 'computing'
    result.value = null
    errorDetail.value = ''

    const activeWorker = getWorker()
    if (activeWorker) {
      const message: RegexRequest = { id, ...request }
      inFlightRequest = message
      startTimeout(id)
      activeWorker.postMessage(message)
      return
    }

    runFallback(id, request)
  }

  const cancel = (): void => {
    latestId++ // any in-flight response/timeout is now stale and will be dropped
    clearTimeoutHandle()
    // A cancelled run may be well into a genuinely expensive (or pathological)
    // evaluation running on the worker's one thread — terminating it (I4),
    // rather than leaving it to grind on in the background, means the next
    // run gets a fresh worker immediately instead of queueing behind the
    // abandoned request.
    terminateWorker()
    inFlightRequest = null
    state.value = 'idle'
    result.value = null
    errorDetail.value = ''
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearTimeoutHandle()
      terminateWorker()
    })
  }

  return {
    state,
    result,
    errorDetail,
    run,
    cancel,
    get usingFallback() {
      return workerFailed
    }
  }
}
