import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSettings } from '@/types'
import * as settingsApi from '@/api/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({
    currentLanguage: 'en',
    audioAutoPlay: false,
    selectedLocales: [],
  })
  const loaded = ref(false)

  async function loadSettings() {
    try {
      settings.value = await settingsApi.getSettings()
      if (!settings.value.selectedLocales?.length) {
        const browserLocale = navigator.language
        const target = settings.value.currentLanguage || 'en'
        const locales = [target]
        if (browserLocale && !locales.includes(browserLocale)) {
          locales.push(browserLocale)
        }
        settings.value.selectedLocales = locales
      }
      loaded.value = true
    } catch {
      // Use defaults if not logged in
    }
  }

  async function saveSettings(updated: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...updated }
    await settingsApi.saveSettings(settings.value)
  }

  return { settings, loaded, loadSettings, saveSettings }
})
