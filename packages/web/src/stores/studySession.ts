import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SrsCard } from '@/types'

export const useStudySessionStore = defineStore('studySession', () => {
  const queue = ref<SrsCard[]>([])
  const index = ref(0)
  const revealed = ref(false)
  const sessionType = ref<'review' | ''>('')
  const completeStats = ref<{ reviewed: number; type: string } | null>(null)

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
  }

  function reveal() {
    revealed.value = true
  }

  function advance(updatedCard: SrsCard) {
    if (updatedCard.state === 'learning' || updatedCard.state === 'relearning') {
      if (Date.now() >= updatedCard.dueTimestamp) {
        queue.value.push(updatedCard)
      }
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
    currentCard,
    progressPct,
    isComplete,
    startSession,
    reveal,
    advance,
    skipCurrent
  }
})
