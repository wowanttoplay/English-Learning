<template>
  <div class="passage-player">
    <div class="player-controls">
      <button
        class="player-btn player-btn-play"
        @click="togglePlay"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
      >
        <span v-if="isPlaying">&#9646;&#9646;</span>
        <span v-else>&#9654;</span>
      </button>

      <div
        class="player-progress-wrapper"
        @click="onProgressClick"
        ref="progressRef"
        :class="{ disabled: isFallback }"
      >
        <div class="player-progress-track">
          <div class="player-progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <span class="player-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

      <button class="player-btn player-btn-stop" @click="stop" aria-label="Stop">
        &#9632;
      </button>
    </div>

    <div class="player-speed-row">
      <button
        v-for="s in speeds"
        :key="s"
        class="speed-btn"
        :class="{ active: speed === s }"
        @click="setSpeed(s)"
      >
        {{ s }}x
      </button>
    </div>

    <div v-if="isFallback" class="player-fallback-notice">
      Audio file unavailable — using browser speech synthesis
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  speeds: readonly number[]
  speed: number
  isPlaying: boolean
  currentTime: number
  duration: number
  isFallback: boolean
  progressPercent: number
  formatTime: (s: number) => string
  togglePlay: () => void
  stop: () => void
  seekTo: (ratio: number) => void
  setSpeed: (s: number) => void
}>()

const progressRef = ref<HTMLElement | null>(null)

function onProgressClick(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  props.seekTo(ratio)
}
</script>
