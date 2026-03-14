import { computed, watch, ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useStudySessionStore } from '@/stores/studySession'
import { useSettingsStore } from '@/stores/settings'
import { useAudio } from '@/composables/useAudio'
import { useDictionary } from '@/composables/useDictionary'
import * as wordsApi from '@/api/words'
import type { DictEntry, Word } from '@/types'

const wordCache = new Map<number, Word>()

export function useStudySession() {
  const srsStore = useSrsStore()
  const session = useStudySessionStore()
  const settingsStore = useSettingsStore()
  const audio = useAudio()
  const dict = useDictionary()

  // Clear word cache to avoid stale translations when locales change
  wordCache.clear()

  const currentCard = computed(() => session.currentCard)
  const currentWord = ref<Word | null>(null)

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
    const targetDef = currentWord.value.translations?.[settingsStore.settings.currentLanguage]
    const defs: { pos: string; def: string; example: string | null }[] = []
    for (const m of dictData.value.meanings) {
      for (const d of m.definitions) {
        if (d.definition !== targetDef && defs.length < 2) {
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

  async function loadWord(wordId: number): Promise<Word | null> {
    if (wordCache.has(wordId)) return wordCache.get(wordId)!
    try {
      const word = await wordsApi.getWordById(wordId, settingsStore.settings.selectedLocales)
      wordCache.set(wordId, word)
      return word
    } catch {
      return null
    }
  }

  // Auto-play and preload on card change
  watch(currentCard, async (card) => {
    if (!card) {
      currentWord.value = null
      return
    }
    currentWord.value = await loadWord(card.wordId)
    if (currentWord.value) {
      await audio.preloadWord(currentWord.value.word)
      audio.autoPlayWord(currentWord.value.word)
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

  async function preloadUpcoming() {
    for (let i = session.index + 1; i < Math.min(session.index + 4, session.queue.length); i++) {
      const card = session.queue[i]
      if (card) {
        const word = await loadWord(card.wordId)
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
