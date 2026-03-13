import { ref, watch, onUnmounted } from 'vue'
import { TimestampLoader } from '@/lib/timestamp-loader'
import type { SentenceTimestamp } from '@/types'

export function usePassageSentenceSync(
  getPassageId: () => number,
  getCurrentTime: () => number,
  getIsPlaying: () => boolean,
  getPassageTextRef: () => HTMLElement | null
) {
  const currentSentenceIndex = ref(-1)
  const timestampsLoaded = ref(false)
  const timestamps = ref<SentenceTimestamp[]>([])

  let prevSentenceIndex = -1

  // Load timestamps when passage changes
  watch(getPassageId, async (id) => {
    timestampsLoaded.value = false
    timestamps.value = []
    currentSentenceIndex.value = -1
    prevSentenceIndex = -1
    clearHighlight()

    if (id <= 0) return

    const data = await TimestampLoader.loadTimestamps(id)
    timestamps.value = data
    timestampsLoaded.value = data.length > 0
  }, { immediate: true })

  // Watch currentTime to update sentence index
  watch(getCurrentTime, (time) => {
    if (!getIsPlaying() || timestamps.value.length === 0) return

    const idx = findSentenceIndex(time)
    if (idx !== prevSentenceIndex) {
      prevSentenceIndex = idx
      currentSentenceIndex.value = idx
      applyHighlight(idx)
    }
  })

  // Clear highlight when playback stops
  watch(getIsPlaying, (playing) => {
    if (!playing) {
      currentSentenceIndex.value = -1
      prevSentenceIndex = -1
      clearHighlight()
    }
  })

  function findSentenceIndex(time: number): number {
    const ts = timestamps.value
    if (ts.length === 0) return -1

    // Linear scan — typically ~15 sentences, simpler than binary search
    for (let i = 0; i < ts.length; i++) {
      if (time >= ts[i].start && time < ts[i].end) {
        return ts[i].index
      }
    }

    // If past all timestamps, return last sentence
    if (time >= ts[ts.length - 1].start) {
      return ts[ts.length - 1].index
    }

    return -1
  }

  function applyHighlight(index: number) {
    const el = getPassageTextRef()
    if (!el) return

    // Remove previous highlight
    const prev = el.querySelector('.sentence-active')
    if (prev) prev.classList.remove('sentence-active')

    if (index < 0) return

    // Add highlight to current sentence
    const sentence = el.querySelector(`[data-sentence-index="${index}"]`)
    if (sentence) {
      sentence.classList.add('sentence-active')
      sentence.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function clearHighlight() {
    const el = getPassageTextRef()
    if (!el) return
    const active = el.querySelector('.sentence-active')
    if (active) active.classList.remove('sentence-active')
  }

  onUnmounted(clearHighlight)

  return {
    currentSentenceIndex,
    timestampsLoaded
  }
}
