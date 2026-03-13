import { onMounted, onUnmounted } from 'vue'

type ShortcutMap = Record<string, () => void>

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  function handler(e: KeyboardEvent) {
    // Don't trigger in input fields
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const key = e.key
    if (shortcuts[key]) {
      e.preventDefault()
      shortcuts[key]()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handler)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handler)
  })
}
