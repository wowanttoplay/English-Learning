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
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps<{
  passageId: number
  passageText: string
}>()

const speeds = [0.75, 1, 1.25] as const
const speed = ref(1)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isFallback = ref(false)
const progressRef = ref<HTMLElement | null>(null)

let audio: HTMLAudioElement | null = null
let animFrame = 0
let utterance: SpeechSynthesisUtterance | null = null
let fallbackTimer = 0

const progressPercent = computed(() => {
  if (duration.value <= 0) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getAudioUrl(): string {
  return `${import.meta.env.BASE_URL}audio/passages/passage-${props.passageId}.mp3`
}

function initAudio() {
  cleanup()

  const el = new Audio(getAudioUrl())
  audio = el

  el.addEventListener('loadedmetadata', () => {
    duration.value = el.duration
  })

  el.addEventListener('ended', () => {
    isPlaying.value = false
    cancelAnimationFrame(animFrame)
  })

  el.addEventListener('error', () => {
    // MP3 not available — switch to fallback
    audio = null
    isFallback.value = true
  })

  el.playbackRate = speed.value
}

function updateProgress() {
  if (audio) {
    currentTime.value = audio.currentTime
  }
  if (isPlaying.value) {
    animFrame = requestAnimationFrame(updateProgress)
  }
}

function togglePlay() {
  if (isFallback.value) {
    toggleFallback()
    return
  }

  if (!audio) {
    initAudio()
  }

  if (isPlaying.value) {
    audio?.pause()
    isPlaying.value = false
    cancelAnimationFrame(animFrame)
  } else {
    audio?.play()
    isPlaying.value = true
    updateProgress()
  }
}

function stop() {
  if (isFallback.value) {
    stopFallback()
    return
  }

  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
  isPlaying.value = false
  currentTime.value = 0
  cancelAnimationFrame(animFrame)
}

function seek(e: MouseEvent) {
  if (isFallback.value || !audio || !progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  audio.currentTime = ratio * duration.value
  currentTime.value = audio.currentTime
}

function setSpeed(s: number) {
  speed.value = s
  if (audio) {
    audio.playbackRate = s
  }
  if (isFallback.value && utterance) {
    // Speech synthesis rate: 0.75 maps to ~0.7, 1.25 maps to ~1.2
    utterance.rate = s
  }
}

// === Web Speech API fallback ===
function toggleFallback() {
  if (isPlaying.value) {
    speechSynthesis.cancel()
    isPlaying.value = false
    clearInterval(fallbackTimer)
  } else {
    utterance = new SpeechSynthesisUtterance(props.passageText)
    utterance.lang = 'en-US'
    utterance.rate = speed.value

    // Estimate duration from word count (~150 wpm adjusted by rate)
    const words = props.passageText.split(/\s+/).length
    const estSeconds = (words / 150) * 60 / speed.value
    duration.value = estSeconds
    currentTime.value = 0

    utterance.onend = () => {
      isPlaying.value = false
      currentTime.value = duration.value
      clearInterval(fallbackTimer)
    }

    speechSynthesis.speak(utterance)
    isPlaying.value = true

    // Approximate progress updates
    const startTime = Date.now()
    fallbackTimer = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      currentTime.value = Math.min(elapsed, duration.value)
    }, 250)
  }
}

function stopFallback() {
  speechSynthesis.cancel()
  isPlaying.value = false
  currentTime.value = 0
  clearInterval(fallbackTimer)
}

function cleanup() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audio = null
  }
  cancelAnimationFrame(animFrame)
  speechSynthesis.cancel()
  clearInterval(fallbackTimer)
  isPlaying.value = false
}

// Re-init when passage changes
watch(() => props.passageId, () => {
  cleanup()
  currentTime.value = 0
  duration.value = 0
  isFallback.value = false
  initAudio()
})

// Init on mount
initAudio()

onUnmounted(cleanup)
</script>
