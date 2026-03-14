import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Word, DomainId, SubtopicId, CefrLevel } from '@/types'
import * as wordsApi from '@/api/words'
import { useLanguageStore } from './language'

export type WordListFilter = 'all' | 'unseen' | 'learning' | 'review' | 'mastered' | 'known'

export const useWordListQueryStore = defineStore('wordListQuery', () => {
  const filter = ref<WordListFilter>('all')
  const search = ref('')
  const topic = ref<'all' | SubtopicId>('all')
  const domain = ref<'all' | DomainId>('all')
  const level = ref<'all' | CefrLevel>('all')
  const page = ref(1)
  const pageSize = ref(50)

  const words = ref<Word[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function loadWords() {
    loading.value = true
    try {
      const lang = useLanguageStore().currentLanguage
      const result = await wordsApi.getWords({
        lang,
        page: page.value,
        pageSize: pageSize.value,
        level: level.value === 'all' ? undefined : level.value,
        topic: topic.value === 'all' ? undefined : topic.value,
      })
      words.value = result.items
      total.value = result.total
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filter.value = 'all'
    search.value = ''
    topic.value = 'all'
    domain.value = 'all'
    level.value = 'all'
    page.value = 1
  }

  return {
    filter,
    search,
    topic,
    domain,
    level,
    page,
    pageSize,
    words,
    total,
    loading,
    loadWords,
    resetFilters,
  }
})
