<template>
  <div class="fade-in">
    <div class="settings-view-inner">
      <div class="header">
        <h1>Settings</h1>
      </div>

      <div class="settings-section">
        <div class="settings-item">
          <span class="settings-label">Theme</span>
          <div class="settings-value">
            <button class="filter-tab" :class="{ active: !theme.isDark.value }" @click="theme.setTheme('light')">Light</button>
            <button class="filter-tab" :class="{ active: theme.isDark.value }" @click="theme.setTheme('dark')">Dark</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Audio</div>
        <div class="settings-item">
          <span class="settings-label">Auto-play pronunciation</span>
          <div class="settings-value">
            <button class="toggle-btn" :class="{ active: autoPlay }" @click="toggleAutoPlay">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </div>

      <section class="settings-section">
        <h3>Translation Languages</h3>
        <div v-for="loc in availableLocales" :key="loc.locale" class="setting-row">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="settingsStore.settings.selectedLocales?.includes(loc.locale)"
              @change="toggleLocale(loc.locale)"
            />
            {{ loc.name }}
          </label>
        </div>
      </section>

      <div class="settings-section">
        <div class="settings-section-title">Statistics</div>
        <div class="settings-item">
          <span class="settings-label">Total words in list</span>
          <span>{{ stats.totalWords }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Words in deck</span>
          <span>{{ stats.deckSize }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Mastered (21+ day interval)</span>
          <span>{{ stats.totalMastered }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'
import { getAvailableLocales, type LocaleInfo } from '@/api/translations'

const srsStore = useSrsStore()
const settingsStore = useSettingsStore()
const theme = useTheme()
const audio = useAudio()

const availableLocales = ref<LocaleInfo[]>([])

onMounted(async () => {
  srsStore.loadCards()
  const lang = settingsStore.settings.currentLanguage || 'en'
  availableLocales.value = await getAvailableLocales(lang)
})

const stats = computed(() => srsStore.stats)
const autoPlay = ref(audio.getAutoPlay())

function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  audio.setAutoPlay(autoPlay.value)
}

function toggleLocale(locale: string) {
  const current = settingsStore.settings.selectedLocales ?? []
  const updated = current.includes(locale)
    ? current.filter((l: string) => l !== locale)
    : [...current, locale]
  settingsStore.saveSettings({ selectedLocales: updated })
}
</script>
