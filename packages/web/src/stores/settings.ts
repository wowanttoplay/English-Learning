import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSettings } from '@/types'
import * as settingsApi from '@/api/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({
    currentLanguage: 'en',
    audioAutoPlay: false,
  })
  const loaded = ref(false)

  async function loadSettings() {
    try {
      settings.value = await settingsApi.getSettings()
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
