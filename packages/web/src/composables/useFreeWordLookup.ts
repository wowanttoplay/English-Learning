import { ref, computed, watch } from 'vue'
import { DictAPI } from '@/lib/dict-api'
import { useAudio } from '@/composables/useAudio'
import { useSrsStore } from '@/stores/srs'
import type { DictEntry, Word } from '@/types'

export function useFreeWordLookup(getWord: () => string | null) {
  const audio = useAudio()
  const srsStore = useSrsStore()
  const dictEntry = ref<DictEntry | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  const saved = ref(false)
  const alreadySaved = ref(false)

  const firstPhonetic = computed(() => {
    if (!dictEntry.value) return null
    return dictEntry.value.phonetics.find(p => p.text) ?? null
  })

  const firstPos = computed(() => {
    if (!dictEntry.value || dictEntry.value.meanings.length === 0) return null
    return dictEntry.value.meanings[0].partOfSpeech
  })

  const firstDefinitions = computed(() => {
    if (!dictEntry.value || dictEntry.value.meanings.length === 0) return []
    return dictEntry.value.meanings[0].definitions.slice(0, 2)
  })

  const searchUrl = computed(() => {
    const word = getWord()
    if (!word) return ''
    return `https://www.google.com/search?q=define+${encodeURIComponent(word)}`
  })

  function playWord() {
    const word = getWord()
    if (word) audio.speak(word)
  }

  function saveToDeck() {
    const word = getWord()
    if (!dictEntry.value || !word) return
    const firstMeaning = dictEntry.value.meanings[0]
    const firstDef = firstMeaning?.definitions[0]?.definition ?? ''
    const examples: string[] = []
    for (const meaning of dictEntry.value.meanings) {
      for (const def of meaning.definitions) {
        if (def.example && examples.length < 2) examples.push(def.example)
      }
    }
    const wordData: Omit<Word, 'id'> = {
      word: dictEntry.value.word,
      pos: firstMeaning?.partOfSpeech ?? '',
      phonetic: firstPhonetic.value?.text ?? '',
      definitionNative: '',
      definitionTarget: firstDef,
      examples,
      level: 'user',
      topics: [],
      languageId: 'en',
    }
    srsStore.addUserWordFromFreeTooltip(wordData)
    saved.value = true
  }

  watch(
    getWord,
    async (newWord) => {
      saved.value = false
      alreadySaved.value = false

      if (!newWord) {
        dictEntry.value = null
        loading.value = false
        notFound.value = false
        return
      }

      const cached = DictAPI.getCached(newWord)
      if (cached) {
        dictEntry.value = cached
        loading.value = false
        notFound.value = false
        return
      }

      loading.value = true
      notFound.value = false
      dictEntry.value = null

      const result = await DictAPI.lookup(newWord)
      loading.value = false
      if (result) {
        dictEntry.value = result
        notFound.value = false
      } else {
        notFound.value = true
      }
    },
    { immediate: true }
  )

  return {
    dictEntry,
    loading,
    notFound,
    saved,
    alreadySaved,
    firstPhonetic,
    firstPos,
    firstDefinitions,
    searchUrl,
    playWord,
    saveToDeck
  }
}
