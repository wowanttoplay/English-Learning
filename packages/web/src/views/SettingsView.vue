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
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'

const srsStore = useSrsStore()
const theme = useTheme()
const audio = useAudio()

onMounted(() => srsStore.loadCards())

const stats = computed(() => srsStore.stats)
const autoPlay = ref(audio.getAutoPlay())

function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  audio.setAutoPlay(autoPlay.value)
}
</script>
