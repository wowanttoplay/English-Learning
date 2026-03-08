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
        @click="seek"
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
import { usePassageAudioPlayer } from '@/composables/usePassageAudioPlayer'

const props = defineProps<{
  passageId: number
  passageText: string
}>()

const {
  speeds,
  speed,
  isPlaying,
  currentTime,
  duration,
  isFallback,
  progressRef,
  progressPercent,
  formatTime,
  togglePlay,
  stop,
  seek,
  setSpeed
} = usePassageAudioPlayer(() => props.passageId, () => props.passageText)
</script>
