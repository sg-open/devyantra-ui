import { watch, type Ref } from 'vue'

/** Options for {@link useToolState}. */
export interface UseToolStateOptions {
  /** Debounce window (ms) between an edit and the localStorage write. Default 800. */
  debounceMs?: number
}

/** Return value of {@link useToolState}. */
export interface UseToolStateReturn {
  /** Cancels any pending debounced save and writes the current field values now. */
  flushSave(): void
  /** Removes the persisted state and cancels any pending debounced save. */
  clearSaved(): void
  /** True only when a valid stored envelope existed AND applied at least one field. */
  restored: boolean
}

const DEFAULT_DEBOUNCE_MS = 800
const ENVELOPE_VERSION = 1 as const

/** Only these primitive types round-trip through JSON without losing shape/identity. */
type PersistableValue = string | number | boolean

function isPersistable(value: unknown): value is PersistableValue {
  const t = typeof value
  return t === 'string' || t === 'number' || t === 'boolean'
}

interface ToolStateEnvelope {
  v: 1
  fields: Record<string, unknown>
}

/** `v === 1` and `fields` is a plain object — anything else rejects the WHOLE envelope. */
function isValidEnvelope(value: unknown): value is ToolStateEnvelope {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  if (obj.v !== ENVELOPE_VERSION) return false
  return !!obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields)
}

/**
 * Per-tool localStorage persistence for a flat set of primitive `Ref`s.
 *
 * Restores synchronously at call time — BEFORE the debounced deep watcher
 * below is registered — so applying restored values can never itself be
 * mistaken for a user edit and immediately re-saved (mirrors useShareState's
 * autoLoad-before-autosave-watch ordering fix).
 *
 * Storage key: `devyantra:<toolSlug>:state`, envelope `{ v: 1, fields }`.
 * Only string/number/boolean field values persist; object/array-valued
 * fields are skipped on save (with one dev `console.warn` per instance, not
 * per field/save, so it doesn't spam the console on every keystroke).
 */
export function useToolState<T extends Record<string, Ref<unknown>>>(
  toolSlug: string,
  fields: T,
  opts?: UseToolStateOptions
): UseToolStateReturn {
  const storageKey = `devyantra:${toolSlug}:state`
  const debounceMs = opts?.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const fieldKeys = Object.keys(fields)

  let timer: ReturnType<typeof setTimeout> | null = null
  let warnedNonPersistable = false

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const persist = () => {
    const out: Record<string, unknown> = {}
    const skipped: string[] = []

    for (const key of fieldKeys) {
      const value = fields[key]!.value
      if (isPersistable(value)) {
        out[key] = value
      } else {
        skipped.push(key)
      }
    }

    if (skipped.length > 0 && !warnedNonPersistable) {
      warnedNonPersistable = true
      console.warn(
        `useToolState(${toolSlug}): skipping non-persistable field(s) [${skipped.join(', ')}] — only string/number/boolean values are saved`
      )
    }

    try {
      const envelope: ToolStateEnvelope = { v: ENVELOPE_VERSION, fields: out }
      localStorage.setItem(storageKey, JSON.stringify(envelope))
    } catch {
      // Best-effort: storage may be unavailable (quota, private mode, SSR, ...).
    }
  }

  const scheduleSave = () => {
    cancelTimer()
    timer = setTimeout(() => {
      timer = null
      persist()
    }, debounceMs)
  }

  const flushSave = () => {
    cancelTimer()
    persist()
  }

  const clearSaved = () => {
    cancelTimer()
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Best-effort.
    }
  }

  // --- Restore (synchronous, runs before the watcher is registered below) ---
  let restored = false
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isValidEnvelope(parsed)) {
        for (const key of fieldKeys) {
          if (!(key in parsed.fields)) continue
          const stored = parsed.fields[key]
          const fieldRef = fields[key]!
          if (typeof stored === typeof fieldRef.value) {
            fieldRef.value = stored
            restored = true
          }
        }
      }
    }
  } catch {
    // Corrupt JSON (or storage access failure): silent fallback to empty state.
  }

  // Registered AFTER restore on purpose — see function doc comment.
  watch(Object.values(fields), scheduleSave, { deep: true })

  return { flushSave, clearSaved, restored }
}
