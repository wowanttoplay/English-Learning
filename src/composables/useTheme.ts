import { ref, onMounted } from 'vue'
import { Storage } from '@/lib/storage'

export function useTheme() {
  const isDark = ref(false)

  function init() {
    const saved = Storage.getTheme()
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark')
      isDark.value = true
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      isDark.value = false
    }
  }

  function toggle() {
    const newDark = !isDark.value
    setTheme(newDark ? 'dark' : 'light')
  }

  function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
    Storage.setTheme(theme)
    isDark.value = theme === 'dark'
  }

  onMounted(init)

  return { isDark, toggle, setTheme }
}
