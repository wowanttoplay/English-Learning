import { computed, watch, ref, type Ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useSettingsStore } from '@/stores/settings'
import { useDictionary } from '@/composables/useDictionary'
import * as wordsApi from '@/api/words'
import type { DictEntry, Word } from '@/types'

export function useWordModal(wordId: Ref<number | null>) {
  const srsStore = useSrsStore()
  const settingsStore = useSettingsStore()
  const dict = useDictionary()

  const word = ref<Word | null>(null)
  const dictData = ref<DictEntry | null>(null)

  const state = computed(() => {
    if (wordId.value === null) return 'unseen'
    return srsStore.getCardState(wordId.value)
  })

  const card = computed(() => {
    if (wordId.value === null) return null
    return srsStore.getCard(wordId.value)
  })

  watch(wordId, async (newId) => {
    if (newId === null) {
      word.value = null
      dictData.value = null
      return
    }
    try {
      word.value = await wordsApi.getWordById(newId, settingsStore.settings.selectedLocales)
    } catch {
      word.value = null
      return
    }
    if (word.value) {
      dictData.value = dict.getDictCached(word.value.word)
      if (!dictData.value) {
        await dict.fetchDictData(word.value.word)
        dictData.value = dict.getDictCached(word.value.word)
      }
    }
  }, { immediate: true })

  return {
    word,
    state,
    card,
    dictData,
  }
}
