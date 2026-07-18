import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useClipboard } from '../useClipboard'
import { useToast } from '../useToast'

describe('useClipboard', () => {
  beforeEach(() => {
    // Reset shared toast state between tests (module-level singleton)
    const { messages } = useToast()
    messages.value.splice(0, messages.value.length)
    vi.restoreAllMocks()
  })

  it('copies via navigator.clipboard and shows a success toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('hello', 'Original text')

    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    const { messages } = useToast()
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0]!.severity).toBe('success')
    expect(messages.value[0]!.summary).toBe('Original text copied')
  })

  it('falls back to execCommand when navigator.clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {}) // no clipboard (e.g. plain-HTTP context)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand as unknown as typeof document.execCommand

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('fallback text')

    expect(ok).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    const { messages } = useToast()
    expect(messages.value[0]!.severity).toBe('success')
    expect(messages.value[0]!.summary).toBe('Text copied')
  })

  it('shows an error toast when every strategy fails', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand

    const { copyWithFeedback } = useClipboard()
    const ok = await copyWithFeedback('nope')

    expect(ok).toBe(false)
    const { messages } = useToast()
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0]!.severity).toBe('error')
    expect(messages.value[0]!.summary).toBe('Copy failed')
  })
})
