import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SrsCard, SrsStats, SrsHistory, DueCount, CardQueue, Rating, Word } from '@/types'
import * as cardsApi from '@/api/cards'
import * as userWordsApi from '@/api/userWords'
import { buildQueue, computeStats } from '@english-learning/shared'

export const useSrsStore = defineStore('srs', () => {
  const cards = ref<SrsCard[]>([])
  const history = ref<Record<string, SrsHistory>>({})
  const totalWordCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stats = computed<SrsStats>(() =>
    computeStats(cards.value, totalWordCount.value, history.value)
  )

  const dueCount = computed<DueCount>(() => {
    const queue = buildQueue(cards.value)
    return { learning: queue.learning.length, review: queue.review.length, total: queue.total }
  })

  function getCardsForToday(): CardQueue {
    return buildQueue(cards.value)
  }

  function getCardState(wordId: number) {
    const card = cards.value.find(c => c.wordId === wordId)
    if (!card) return 'unseen' as const
    if (card.state === 'known') return 'known' as const
    if (card.state === 'review' && card.interval >= 21) return 'mastered' as const
    return card.state
  }

  function getAllCardStates(): Record<number, string> {
    const states: Record<number, string> = {}
    for (const card of cards.value) {
      states[card.wordId] = getCardState(card.wordId)
    }
    return states
  }

  function getCard(wordId: number): SrsCard | undefined {
    return cards.value.find(c => c.wordId === wordId)
  }

  async function loadCards(lang?: string) {
    loading.value = true
    error.value = null
    try {
      const data = await cardsApi.getCards(lang)
      cards.value = data.cards
      history.value = data.history
      totalWordCount.value = data.stats.totalWords
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function rateCard(wordId: number, rating: Rating): Promise<SrsCard> {
    const updated = await cardsApi.rateCard(wordId, rating)
    const idx = cards.value.findIndex(c => c.wordId === wordId)
    if (idx >= 0) cards.value[idx] = updated
    else cards.value.push(updated)
    return updated
  }

  async function addWordFromReading(wordId: number) {
    const card = await cardsApi.addCard(wordId)
    const idx = cards.value.findIndex(c => c.wordId === wordId)
    if (idx >= 0) cards.value[idx] = card
    else cards.value.push(card)
  }

  async function addUserWordFromFreeTooltip(wordData: Omit<Word, 'id'>) {
    const created = await userWordsApi.createUserWord({
      languageId: wordData.languageId,
      word: wordData.word,
      pos: wordData.pos,
      phonetic: wordData.phonetic,
      translations: wordData.translations,
      examples: wordData.examples,
      topics: wordData.topics as string[],
    })
    // The server also creates an SRS card — reload to get it
    await loadCards()
    return created
  }

  async function markAsKnown(wordId: number) {
    await cardsApi.markKnown(wordId, true)
    const idx = cards.value.findIndex(c => c.wordId === wordId)
    if (idx >= 0) {
      cards.value[idx] = { ...cards.value[idx], state: 'known', previousState: cards.value[idx].state as any }
    } else {
      cards.value.push({ wordId, state: 'known', ease: 2.5, interval: 0, due: '', dueTimestamp: 0, reps: 0, lapses: 0, step: 0 })
    }
  }

  async function unmarkKnown(wordId: number) {
    await cardsApi.markKnown(wordId, false)
    // Reload to get accurate state
    await loadCards()
  }

  return {
    cards,
    history,
    stats,
    dueCount,
    loading,
    error,
    loadCards,
    rateCard,
    getCardsForToday,
    getCardState,
    getAllCardStates,
    getCard,
    addWordFromReading,
    addUserWordFromFreeTooltip,
    markAsKnown,
    unmarkKnown,
  }
})
