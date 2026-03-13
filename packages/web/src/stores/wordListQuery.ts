import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DomainId, SubtopicId } from '@/types'

export type WordListFilter = 'all' | 'unseen' | 'learning' | 'review' | 'mastered' | 'known' | 'user'

export const useWordListQueryStore = defineStore('wordListQuery', () => {
  const filter = ref<WordListFilter>('all')
  const search = ref('')
  const topic = ref<'all' | SubtopicId>('all')
  const domain = ref<'all' | DomainId>('all')
  const page = ref(0)

  function resetFilters() {
    filter.value = 'all'
    search.value = ''
    topic.value = 'all'
    domain.value = 'all'
    page.value = 0
  }

  return {
    filter,
    search,
    topic,
    domain,
    page,
    resetFilters
  }
})
