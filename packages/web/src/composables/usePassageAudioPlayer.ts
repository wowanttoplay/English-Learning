import { ref, computed, watch, onUnmounted } from 'vue'
import type { TurnTimestamp } from '@english-learning/shared'

export function usePassageAudioPlayer(
  getTurnUrls: () => string[],
  getTimestamps: () => TurnTimestamp[],
  getFallbackText: () => string
) {
  const speeds = [0.75, 1, 1.25] as const
  const speed = ref<number>(1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const currentTurnIndex = ref(-1)
  const duration = ref(0)
  const isFallback = ref(false)

  let audio: HTMLAudioElement | null = null
  let animFrame = 0
  let utterance: SpeechSynthesisUtterance | null = null
  let fallbackTimer = 0

  const progressPercent = computed(() => {
    const ts = getTimestamps()
    if (ts.length === 0 || currentTurnIndex.value < 0) return 0
    const total = ts[ts.length - 1].end
    if (total === 0) return 0
    const elapsed = ts[currentTurnIndex.value].start + currentTime.value
    return Math.min(100, (elapsed / total) * 100)
  })

  function updateProgress() {
    if (audio) currentTime.value = audio.currentTime
    if (isPlaying.value) animFrame = requestAnimationFrame(updateProgress)
  }

  function playTurn(index: number) {
    const urls = getTurnUrls()
    if (index < 0 || index >= urls.length) {
      isPlaying.value = false
      currentTurnIndex.value = -1
      return
    }

    currentTurnIndex.value = index
    currentTime.value = 0

    if (!audio) audio = new Audio()
    audio.src = urls[index]
    audio.playbackRate = speed.value
    audio.onended = () => {
      if (currentTurnIndex.value < urls.length - 1) {
        playTurn(currentTurnIndex.value + 1)
      } else {
        isPlaying.value = false
        currentTurnIndex.value = -1
        cancelAnimationFrame(animFrame)
      }
    }
    audio.onerror = () => {
      cleanup()
      isFallback.value = true
    }
    audio.play().catch(() => {
      cleanup()
      isFallback.value = true
    })
    isPlaying.value = true
    updateProgress()
  }

  function togglePlay() {
    if (isFallback.value) {
      toggleFallback()
      return
    }
    if (isPlaying.value) {
      audio?.pause()
      isPlaying.value = false
      cancelAnimationFrame(animFrame)
    } else {
      if (currentTurnIndex.value < 0) {
        playTurn(0)
      } else {
        audio?.play()
        isPlaying.value = true
        updateProgress()
      }
    }
  }

  function stop() {
    if (isFallback.value) { stopFallback(); return }
    if (audio) { audio.pause(); audio.currentTime = 0 }
    isPlaying.value = false
    currentTime.value = 0
    currentTurnIndex.value = -1
    cancelAnimationFrame(animFrame)
  }

  function seekTo(ratio: number) {
    if (isFallback.value) return
    const ts = getTimestamps()
    if (ts.length === 0) return
    const total = ts[ts.length - 1].end
    const target = Math.max(0, Math.min(1, ratio)) * total

    let targetTurn = 0
    for (let i = 0; i < ts.length; i++) {
      if (target >= ts[i].start && target < ts[i].end) { targetTurn = i; break }
    }

    const wasPlaying = isPlaying.value
    playTurn(targetTurn)
    if (audio) audio.currentTime = target - ts[targetTurn].start
    if (!wasPlaying) { audio?.pause(); isPlaying.value = false; cancelAnimationFrame(animFrame) }
  }

  function skipPrev() {
    if (currentTurnIndex.value > 0) {
      const wasPlaying = isPlaying.value
      playTurn(currentTurnIndex.value - 1)
      if (!wasPlaying) { audio?.pause(); isPlaying.value = false; cancelAnimationFrame(animFrame) }
    }
  }

  function skipNext() {
    const urls = getTurnUrls()
    if (currentTurnIndex.value < urls.length - 1) {
      const wasPlaying = isPlaying.value
      playTurn(currentTurnIndex.value + 1)
      if (!wasPlaying) { audio?.pause(); isPlaying.value = false; cancelAnimationFrame(animFrame) }
    }
  }

  function setSpeed(s: number) {
    speed.value = s
    if (audio) audio.playbackRate = s
    if (utterance) utterance.rate = s
  }

  function toggleFallback() {
    if (isPlaying.value) {
      speechSynthesis.cancel()
      isPlaying.value = false
      clearInterval(fallbackTimer)
    } else {
      utterance = new SpeechSynthesisUtterance(getFallbackText())
      utterance.lang = 'en-US'
      utterance.rate = speed.value
      const words = getFallbackText().split(/\s+/).length
      duration.value = (words / 150) * 60 / speed.value
      currentTime.value = 0
      currentTurnIndex.value = 0
      utterance.onend = () => { isPlaying.value = false; clearInterval(fallbackTimer) }
      speechSynthesis.speak(utterance)
      isPlaying.value = true
      const start = Date.now()
      fallbackTimer = window.setInterval(() => {
        currentTime.value = Math.min((Date.now() - start) / 1000, duration.value)
      }, 250)
    }
  }

  function stopFallback() {
    speechSynthesis.cancel()
    isPlaying.value = false
    currentTime.value = 0
    currentTurnIndex.value = -1
    clearInterval(fallbackTimer)
  }

  function cleanup() {
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
    cancelAnimationFrame(animFrame)
    speechSynthesis.cancel()
    clearInterval(fallbackTimer)
    isPlaying.value = false
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Reset when passage changes (watch first URL as proxy for passage ID)
  watch(() => getTurnUrls()[0] ?? '', () => {
    cleanup()
    currentTime.value = 0
    currentTurnIndex.value = -1
    const ts = getTimestamps()
    duration.value = ts.length > 0 ? ts[ts.length - 1].end : 0
    isFallback.value = false
  })

  onUnmounted(cleanup)

  return {
    speeds, speed, isPlaying, currentTime, currentTurnIndex,
    duration, isFallback, progressPercent,
    formatTime, togglePlay, stop, seekTo, skipPrev, skipNext, setSpeed,
  }
}
