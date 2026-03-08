import { computed, watch, ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useStudySessionStore } from '@/stores/studySession'
import { useAudio } from '@/composables/useAudio'
import { useDictionary } from '@/composables/useDictionary'
// WordIndex is a pure sync lookup utility with no side effects — direct import is fine
import { WordIndex } from '@/lib/word-index'
import type { DictEntry, Word } from '@/types'

export function useStudySession() {
  const srsStore = useSrsStore()
  const session = useStudySessionStore()
  const audio = useAudio()
  const dict = useDictionary()

  const currentCard = computed(() => session.currentCard)

  const currentWord = computed<Word | null>(() => {
    const card = currentCard.value
    if (!card) return null
    return WordIndex.get(card.wordId)
  })

  const stateLabel = computed(() => {
    const card = currentCard.value
    if (!card) return ''
    switch (card.state) {
      case 'learning': return 'Learning'
      case 'relearning': return 'Relearning'
      case 'review': return 'Review'
      default: return ''
    }
  })

  const dictData = ref<DictEntry | null>(null)

  const extraDefs = computed(() => {
    if (!dictData.value?.meanings || !currentWord.value) return []
    const defs: { pos: string; def: string; example: string | null }[] = []
    for (const m of dictData.value.meanings) {
      for (const d of m.definitions) {
        if (d.definition !== currentWord.value.en && defs.length < 2) {
          defs.push({ pos: m.partOfSpeech, def: d.definition, example: d.example })
        }
      }
    }
    return defs
  })

  const completeStatsItems = computed(() => [
    { value: srsStore.stats.todayLearned, label: 'Saved Today', color: 'green' },
    { value: srsStore.stats.todayReviewed, label: 'Reviewed Today', color: 'blue' },
    { value: srsStore.stats.streak, label: 'Day Streak', color: 'orange' },
    { value: srsStore.stats.totalStarted, label: 'Total Started' }
  ])

  // Auto-play and preload on card change
  watch(currentWord, async (word) => {
    if (word) {
      await audio.preloadWord(word.word)
      audio.autoPlayWord(word.word)
      preloadUpcoming()
    }
  }, { immediate: true })

  // Fetch dict data when card is revealed
  watch(() => session.revealed, async (isRevealed) => {
    if (isRevealed && currentWord.value) {
      dictData.value = dict.getDictCached(currentWord.value.word)
      if (!dictData.value) {
        await dict.fetchDictData(currentWord.value.word)
        dictData.value = dict.getDictCached(currentWord.value.word)
      }
    } else {
      dictData.value = null
    }
  })

  function preloadUpcoming() {
    for (let i = session.index + 1; i < Math.min(session.index + 4, session.queue.length); i++) {
      const card = session.queue[i]
      if (card) {
        const word = WordIndex.get(card.wordId)
        if (word) audio.preloadWord(word.word)
      }
    }
  }

  return {
    currentCard,
    currentWord,
    stateLabel,
    dictData,
    extraDefs,
    completeStatsItems,
  }
}
