import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  const currentLanguage = ref('en')

  function setLanguage(lang: string) {
    currentLanguage.value = lang
  }

  return { currentLanguage, setLanguage }
})
