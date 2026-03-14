import { computed, type Ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import type { Word } from '@/types'

export function useWordTooltip(
  wordId: Ref<number | null>,
  words: Ref<Word[] | undefined>
) {
  const srsStore = useSrsStore()

  const word = computed(() => {
    if (wordId.value === null) return null
    return (words.value ?? []).find(w => w.id === wordId.value) ?? null
  })

  const cardState = computed(() => {
    if (wordId.value === null) return 'unseen'
    return srsStore.getCardState(wordId.value)
  })

  const stateLabel = computed(() => {
    switch (cardState.value) {
      case 'unseen': return 'Not in deck'
      case 'learning': return 'Learning'
      case 'relearning': return 'Relearning'
      case 'review': return 'Review'
      case 'mastered': return 'Mastered'
      case 'known': return 'Known'
      default: return ''
    }
  })

  function addToDeck() {
    if (wordId.value !== null) {
      srsStore.addWordFromReading(wordId.value)
    }
  }

  function markKnown() {
    if (wordId.value !== null) {
      srsStore.markAsKnown(wordId.value)
    }
  }

  function unmarkKnown() {
    if (wordId.value !== null) {
      srsStore.unmarkKnown(wordId.value)
    }
  }

  return {
    word,
    cardState,
    stateLabel,
    addToDeck,
    markKnown,
    unmarkKnown,
  }
}
