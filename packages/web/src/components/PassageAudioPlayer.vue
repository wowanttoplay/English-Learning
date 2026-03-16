<template>
  <div class="passage-player">
    <!-- Row 1: progress bar + time -->
    <div class="player-progress-row">
      <span class="player-time">{{ formatTime(currentTime) }}</span>
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
      <span class="player-time">{{ formatTime(duration) }}</span>
    </div>

    <!-- Row 2: controls -->
    <div class="player-controls">
      <div class="speed-picker">
        <button class="speed-pill" @click="showSpeedMenu = !showSpeedMenu">
          {{ speed }}x
        </button>
        <div v-if="showSpeedMenu" class="speed-menu">
          <button
            v-for="s in speeds"
            :key="s"
            class="speed-menu-item"
            :class="{ active: speed === s }"
            @click="setSpeed(s); showSpeedMenu = false"
          >
            {{ s }}x
          </button>
        </div>
      </div>

      <button
        @click="$emit('skip-prev')"
        :disabled="currentTurnIndex <= 0"
        class="btn-icon"
        title="Previous turn"
      >&#9198;</button>

      <button
        class="player-btn player-btn-play"
        @click="togglePlay"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
      >
        <span v-if="isPlaying">&#9646;&#9646;</span>
        <span v-else>&#9654;</span>
      </button>

      <button
        @click="$emit('skip-next')"
        :disabled="currentTurnIndex >= turnCount - 1"
        class="btn-icon"
        title="Next turn"
      >&#9197;</button>

      <button class="player-btn player-btn-stop" @click="stop" aria-label="Stop">
        &#9632;
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
  currentTurnIndex: number
  turnCount: number
  formatTime: (s: number) => string
  togglePlay: () => void
  stop: () => void
  seekTo: (ratio: number) => void
  setSpeed: (s: number) => void
}>()

defineEmits<{
  'skip-prev': []
  'skip-next': []
}>()

const progressRef = ref<HTMLElement | null>(null)
const showSpeedMenu = ref(false)

function onProgressClick(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  props.seekTo(ratio)
}
</script>
