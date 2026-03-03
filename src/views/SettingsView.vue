<template>
  <div class="fade-in">
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

    <div class="action-buttons" style="margin-top: 24px;">
      <button class="btn btn-danger" @click="confirmReset">
        Reset All Progress
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'
import { useDictionary } from '@/composables/useDictionary'

const router = useRouter()
const srsStore = useSrsStore()
const theme = useTheme()
const audio = useAudio()
const dict = useDictionary()

const stats = computed(() => srsStore.stats)
const autoPlay = ref(audio.getAutoPlay())

function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  audio.setAutoPlay(autoPlay.value)
}

function confirmReset() {
  if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
    srsStore.resetProgress()
    dict.clearCache()
    router.push('/')
  }
}
</script>
