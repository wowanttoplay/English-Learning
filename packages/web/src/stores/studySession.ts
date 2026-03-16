import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SrsCard } from '@/types'

export const useStudySessionStore = defineStore('studySession', () => {
  const queue = ref<SrsCard[]>([])
  const index = ref(0)
  const revealed = ref(false)
  const sessionType = ref<'review' | ''>('')
  const completeStats = ref<{ reviewed: number; type: string } | null>(null)
  const sessionStreak = ref(0)

  const currentCard = computed<SrsCard | null>(() => {
    if (index.value >= queue.value.length) return null
    return queue.value[index.value]
  })

  const progressPct = computed(() => {
    const total = queue.value.length
    return total > 0 ? Math.round((index.value / total) * 100) : 0
  })

  const isComplete = computed(() => completeStats.value !== null)

  function startSession(cards: SrsCard[], type: 'review') {
    queue.value = [...cards]
    index.value = 0
    revealed.value = false
    sessionType.value = type
    completeStats.value = null
    sessionStreak.value = 0
  }

  function reveal() {
    revealed.value = true
  }

  function advance(updatedCard: SrsCard, rating?: 1 | 2 | 3 | 4) {
    if (updatedCard.state === 'learning' || updatedCard.state === 'relearning') {
      if (Date.now() >= updatedCard.dueTimestamp) {
        queue.value.push(updatedCard)
      }
    }

    // Update session streak based on rating
    if (rating === 1) {
      sessionStreak.value = 0
    } else if (rating === 3 || rating === 4) {
      sessionStreak.value++
    }

    index.value++
    revealed.value = false

    if (index.value >= queue.value.length) {
      completeStats.value = {
        reviewed: index.value,
        type: sessionType.value
      }
    }
  }

  function skipCurrent() {
    index.value++
    revealed.value = false
    if (index.value >= queue.value.length) {
      completeStats.value = {
        reviewed: index.value,
        type: sessionType.value
      }
    }
  }

  return {
    queue,
    index,
    revealed,
    sessionType,
    completeStats,
    sessionStreak,
    currentCard,
    progressPct,
    isComplete,
    startSession,
    reveal,
    advance,
    skipCurrent
  }
})
