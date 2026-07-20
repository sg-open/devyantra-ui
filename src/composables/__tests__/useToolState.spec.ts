import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useToolState } from '../useToolState'

// Mock localStorage (mirrors useShareState.spec.ts's mock style).
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('useToolState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Hermetic default: no stored state unless a test explicitly seeds one
    // (vi.clearAllMocks() clears call history but not mockReturnValue).
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('1. restore ordering — restoring never triggers a save', () => {
    it('applies stored fields synchronously, then does NOT save even after the debounce elapses', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: { input: 'restored value' } })
      )
      const input = ref('')

      const { restored } = useToolState('demo-tool', { input })

      expect(input.value).toBe('restored value')
      expect(restored).toBe(true)

      vi.advanceTimersByTime(800)

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('2. post-restore edits save after the debounce', () => {
    it('does not save before the default 800ms debounce elapses', async () => {
      const input = ref('')
      useToolState('demo-tool', { input })

      input.value = 'hello'
      await nextTick()
      vi.advanceTimersByTime(799)

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('saves the new value once the debounce elapses', async () => {
      const input = ref('')
      useToolState('demo-tool', { input })

      input.value = 'hello'
      await nextTick()
      vi.advanceTimersByTime(800)

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
      const [key, payload] = mockLocalStorage.setItem.mock.calls[0]
      expect(key).toBe('devyantra:demo-tool:state')
      expect(JSON.parse(payload)).toEqual({ v: 1, fields: { input: 'hello' } })
    })

    it('honors a custom debounceMs from opts', async () => {
      const input = ref('')
      useToolState('demo-tool', { input }, { debounceMs: 200 })

      input.value = 'hello'
      await nextTick()
      vi.advanceTimersByTime(199)
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
    })

    it('debounces rapid successive edits into a single save', async () => {
      const input = ref('')
      useToolState('demo-tool', { input })

      input.value = 'h'
      await nextTick()
      vi.advanceTimersByTime(500)
      input.value = 'he'
      await nextTick()
      vi.advanceTimersByTime(500)
      input.value = 'hel'
      await nextTick()
      vi.advanceTimersByTime(800)

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
      const payload = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(payload.fields.input).toBe('hel')
    })
  })

  describe('3. per-field strict typeof matching on restore', () => {
    it('skips a stored value whose type does not match the ref current typeof', () => {
      // `input` is a string ref but storage has a number for it.
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: { input: 42, flag: true } })
      )
      const input = ref('')
      const flag = ref(false)

      const { restored } = useToolState('demo-tool', { input, flag })

      expect(input.value).toBe('') // untouched: number stored, string expected
      expect(flag.value).toBe(true) // applied: boolean matches boolean
      expect(restored).toBe(true) // at least one field DID apply
    })
  })

  describe('4. envelope validation', () => {
    it('rejects the whole envelope when v !== 1', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 2, fields: { input: 'nope' } })
      )
      const input = ref('original')

      const { restored } = useToolState('demo-tool', { input })

      expect(input.value).toBe('original')
      expect(restored).toBe(false)
    })

    it('rejects the whole envelope when fields is not an object', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: 'not-an-object' })
      )
      const input = ref('original')

      const { restored } = useToolState('demo-tool', { input })

      expect(input.value).toBe('original')
      expect(restored).toBe(false)
    })
  })

  describe('5. flushSave', () => {
    it('cancels the pending timer and writes immediately, with no double-write later', async () => {
      const input = ref('')
      const { flushSave } = useToolState('demo-tool', { input })

      input.value = 'urgent'
      await nextTick()
      flushSave()

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
      expect(JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])).toEqual({
        v: 1,
        fields: { input: 'urgent' }
      })

      vi.advanceTimersByTime(800)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1) // no repeat save from the cancelled timer
    })
  })

  describe('6. clearSaved', () => {
    it('removes the key and cancels a pending debounced save (no overwrite after clear)', async () => {
      const input = ref('')
      const { clearSaved } = useToolState('demo-tool', { input })

      input.value = 'to be cleared'
      await nextTick() // schedules the debounced save

      clearSaved()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('devyantra:demo-tool:state')

      vi.advanceTimersByTime(800)
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('7. non-persistable field values', () => {
    it('skips object/array-valued fields on save, warns once per instance, and still persists primitives', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const input = ref('a')
      const meta = ref<{ n: number }>({ n: 1 })
      const list = ref<number[]>([1, 2, 3])

      const { flushSave } = useToolState('demo-tool', { input, meta, list })

      flushSave()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      const firstSave = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(firstSave).toEqual({ v: 1, fields: { input: 'a' } })

      // A second save (still non-persistable fields present) must not warn again.
      flushSave()
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('8. corrupt JSON in storage', () => {
    it('falls back to empty silently (no throw), restored is false, refs untouched', () => {
      mockLocalStorage.getItem.mockReturnValue('{not valid json')
      const input = ref('unchanged')

      let result: ReturnType<typeof useToolState> | undefined
      expect(() => {
        result = useToolState('demo-tool', { input })
      }).not.toThrow()

      expect(input.value).toBe('unchanged')
      expect(result?.restored).toBe(false)
    })
  })

  describe('9. restored flag semantics', () => {
    it('is false when the envelope is valid but no stored key matches any field', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: { unknownKey: 'x' } })
      )
      const input = ref('')

      const { restored } = useToolState('demo-tool', { input })

      expect(restored).toBe(false)
      expect(input.value).toBe('')
    })

    it('is false when the envelope is valid but every matching field is a typeof mismatch', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: { input: 42 } })
      )
      const input = ref('') // string ref, stored value is a number

      const { restored } = useToolState('demo-tool', { input })

      expect(restored).toBe(false)
      expect(input.value).toBe('')
    })

    it('is true as soon as at least one field applies', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ v: 1, fields: { input: 'hit', other: 999 } })
      )
      const input = ref('')
      const other = ref('') // typeof mismatch (string ref, number stored) -> skipped

      const { restored } = useToolState('demo-tool', { input, other })

      expect(restored).toBe(true)
      expect(input.value).toBe('hit')
      expect(other.value).toBe('')
    })

    it('is false when storage is empty', () => {
      const input = ref('x')
      const { restored } = useToolState('demo-tool', { input })
      expect(restored).toBe(false)
    })
  })
})
