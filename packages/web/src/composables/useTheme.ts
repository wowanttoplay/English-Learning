import { ref, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  function init() {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark')
      isDark.value = true
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      isDark.value = false
    }
  }

  function toggle() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    isDark.value = theme === 'dark'
  }

  onMounted(init)

  return { isDark, toggle, setTheme }
}
