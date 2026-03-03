import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rateCard as srsRateCard, getCardsForToday as srsGetCardsForToday, getDueCount, getStats } from '@/lib/srs-queue'
import { getCardState as srsGetCardState, getAllCardStates as srsGetAllCardStates, setNewCardsPerDay as srsSetNewCardsPerDay, setActiveTopics as srsSetActiveTopics, getActiveTopics as srsGetActiveTopics, resetProgress as srsResetProgress, clearCache, getCard as srsGetCard, getHistory as srsGetHistory, addUserWord as srsAddUserWord } from '@/lib/srs-storage'
import { WORD_LIST } from '@/data/words'
import type { SrsStats, DueCount, CardQueue, CardState, Rating, SrsCard } from '@/types'

export const useSrsStore = defineStore('srs', () => {
  // Reactive version trigger — increment to force recomputation
  const _version = ref(0)

  function _bump() {
    _version.value++
  }

  const stats = computed<SrsStats>(() => {
    _version.value // track
    return getStats(WORD_LIST.length)
  })

  const dueCount = computed<DueCount>(() => {
    _version.value // track
    return getDueCount(WORD_LIST)
  })

  function rateCard(wordId: number, rating: Rating): SrsCard {
    const result = srsRateCard(wordId, rating)
    _bump()
    return result
  }

  function getCardsForToday(): CardQueue {
    return srsGetCardsForToday(WORD_LIST)
  }

  function setActiveTopics(topicIds: string[]) {
    srsSetActiveTopics(topicIds)
    clearCache()
    _bump()
  }

  function getActiveTopics(): string[] {
    return srsGetActiveTopics()
  }

  function setNewCardsPerDay(count: number) {
    srsSetNewCardsPerDay(count)
    _bump()
  }

  function resetProgress() {
    srsResetProgress()
    _bump()
  }

  function getCardState(wordId: number): CardState {
    _version.value // track
    return srsGetCardState(wordId)
  }

  function getAllCardStates(): Record<string, CardState> {
    _version.value // track
    return srsGetAllCardStates()
  }

  function getHistory(): Record<string, { reviewed: number; learned: number }> {
    _version.value // track
    return srsGetHistory()
  }

  function getCard(wordId: number) {
    return srsGetCard(wordId)
  }

  function addWordFromReading(wordId: number) {
    srsAddUserWord(wordId)
    clearCache()
    _bump()
  }

  return {
    _version,
    stats,
    dueCount,
    rateCard,
    getCardsForToday,
    setActiveTopics,
    getActiveTopics,
    setNewCardsPerDay,
    resetProgress,
    getCardState,
    getAllCardStates,
    getHistory,
    getCard,
    addWordFromReading
  }
})
