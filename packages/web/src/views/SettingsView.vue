<template>
  <div class="fade-in">
    <div class="settings-view-inner">
      <div class="header">
        <h1>Settings</h1>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">Appearance</div>
        <div class="settings-item">
          <span class="settings-label">Theme</span>
          <div class="settings-value">
            <div class="theme-pills">
              <button class="theme-pill" :class="{ active: !theme.isDark.value }" @click="theme.setTheme('light')">Light</button>
              <button class="theme-pill" :class="{ active: theme.isDark.value }" @click="theme.setTheme('dark')">Dark</button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">Audio</div>
        <div class="settings-item">
          <span class="settings-label">Auto-play pronunciation</span>
          <div class="settings-value">
            <button class="toggle-btn" :class="{ active: autoPlay }" @click="toggleAutoPlay">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">Translation Languages</div>
        <div v-for="loc in availableLocales" :key="loc.locale" class="settings-item locale-item">
          <span class="settings-label">{{ loc.name }}</span>
          <button
            class="circle-check"
            :class="{ checked: settingsStore.settings.selectedLocales?.includes(loc.locale) }"
            @click="toggleLocale(loc.locale)"
          >
            <svg v-if="settingsStore.settings.selectedLocales?.includes(loc.locale)" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.5L5.5 10L11 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">Statistics</div>
        <div class="settings-item">
          <span class="settings-label">Total words in list</span>
          <span class="settings-stat-value">{{ stats.totalWords }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Words in deck</span>
          <span class="settings-stat-value">{{ stats.deckSize }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Known</span>
          <span class="settings-stat-value">{{ stats.totalKnown }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Mastered (21+ day interval)</span>
          <span class="settings-stat-value">{{ stats.totalMastered }}</span>
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
