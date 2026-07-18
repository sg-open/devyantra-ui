import { useToast } from '@/composables/useToast'

/**
 * Clipboard writes with mandatory user feedback.
 * Falls back to execCommand('copy') where the async Clipboard API is
 * unavailable (non-secure contexts) or rejects (permissions).
 */
export function useClipboard() {
  const toast = useToast()

  const copyWithFeedback = async (text: string, label = 'Text'): Promise<boolean> => {
    const ok = await writeClipboard(text)
    if (ok) {
      toast.add({ severity: 'success', summary: `${label} copied`, life: 2000 })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Copy failed',
        detail: 'Clipboard is unavailable in this context.',
        life: 4000
      })
    }
    return ok
  }

  return { copyWithFeedback }
}

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to execCommand
    }
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
