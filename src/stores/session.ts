import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SrsCard } from '@/types'

export const useSessionStore = defineStore('session', () => {
  // ── Study Session State ──────────────────────────────────────────────
  const queue = ref<SrsCard[]>([])
  const index = ref(0)
  const revealed = ref(false)
  const sessionType = ref<'review' | ''>('')
  const completeStats = ref<{ reviewed: number; type: string } | null>(null)

  // ── Word List UI State ───────────────────────────────────────────────
  const wordListFilter = ref('all')
  const wordListSearch = ref('')
  const wordListTopic = ref('all')
  const wordListPage = ref(0)

  // ── Global UI State ──────────────────────────────────────────────────
  const modalWordId = ref<number | null>(null)

  const currentCard = computed<SrsCard | null>(() => {
    if (index.value >= queue.value.length) return null
    return queue.value[index.value]
  })

  const progressPct = computed(() => {
    const total = queue.value.length
    return total > 0 ? Math.round((index.value / total) * 100) : 0
  })

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
    // If card is still in learning/relearning steps, only re-add if actually due now
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

  const isComplete = computed(() => {
    return completeStats.value !== null
  })

  function openModal(wordId: number) {
    modalWordId.value = wordId
  }

  function closeModal() {
    modalWordId.value = null
  }

  function resetWordListFilters() {
    wordListFilter.value = 'all'
    wordListSearch.value = ''
    wordListTopic.value = 'all'
    wordListPage.value = 0
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
    wordListFilter,
    wordListSearch,
    wordListTopic,
    wordListPage,
    modalWordId,
    startSession,
    reveal,
    advance,
    skipCurrent,
    openModal,
    closeModal,
    resetWordListFilters
  }
})
