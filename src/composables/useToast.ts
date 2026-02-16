import { ref } from 'vue'

export interface ToastMessage {
  id: number
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail?: string
  life?: number
}

const messages = ref<ToastMessage[]>([])
let nextId = 0

export function useToast() {
  const add = (msg: Omit<ToastMessage, 'id'>) => {
    const id = nextId++
    const life = msg.life ?? 3000
    messages.value.push({ ...msg, id })
    setTimeout(() => {
      remove(id)
    }, life)
  }

  const remove = (id: number) => {
    const idx = messages.value.findIndex((m) => m.id === id)
    if (idx !== -1) messages.value.splice(idx, 1)
  }

  return { messages, add, remove }
}
