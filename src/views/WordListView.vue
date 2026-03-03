<template>
  <div class="fade-in">
    <div class="wordlist-header">
      <h2>Word List</h2>
    </div>

    <input
      class="search-box"
      type="text"
      placeholder="Search words..."
      v-model="session.wordListSearch"
    />

    <select class="topic-select" v-model="session.wordListTopic">
      <option value="all">All Topics</option>
      <option v-for="t in TOPIC_REGISTRY" :key="t.id" :value="t.id">
        {{ t.emoji }} {{ t.name }}
      </option>
    </select>

    <div class="filter-tabs">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-tab"
        :class="{ active: session.wordListFilter === f.key }"
        @click="setFilter(f.key)"
      >
        {{ f.label }} ({{ f.count }})
      </button>
    </div>

    <div class="word-list">
      <div v-if="visibleWords.length === 0" class="word-list-empty">No words found</div>
      <div
        v-for="w in visibleWords"
        :key="w.id"
        class="word-item"
        @click="session.openModal(w.id)"
      >
        <div class="word-item-text">
          <div class="word-item-word">{{ w.word }}</div>
          <div class="word-item-zh">{{ w.zh }}</div>
        </div>
        <span class="word-item-badge" :class="'badge-' + getState(w.id)">{{ getState(w.id) }}</span>
      </div>
      <button
        v-if="hasMore"
        class="load-more-btn"
        @click="session.wordListPage++"
      >
        Load more ({{ filtered.length - visibleCount }} remaining)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useSessionStore } from '@/stores/session'
import { WORD_LIST } from '@/data/words'
import { TOPIC_REGISTRY } from '@/data/topics'

const WORDS_PER_PAGE = 50

const srsStore = useSrsStore()
const session = useSessionStore()

// Reset page on filter/search change
watch([() => session.wordListSearch, () => session.wordListFilter, () => session.wordListTopic], () => {
  session.wordListPage = 0
})

const states = computed(() => srsStore.getAllCardStates())

function getState(wordId: number): string {
  return states.value[wordId] || 'unseen'
}

const filtered = computed(() => {
  const search = session.wordListSearch.toLowerCase().trim()
  return WORD_LIST.filter(w => {
    if (search && !w.word.toLowerCase().includes(search) && !w.zh.includes(search)) return false
    if (session.wordListTopic !== 'all') {
      const topics = w.topics || []
      if (!topics.includes(session.wordListTopic)) return false
    }
    const state = states.value[w.id] || 'unseen'
    const f = session.wordListFilter
    if (f === 'all') return true
    if (f === 'unseen') return state === 'unseen'
    if (f === 'learning') return state === 'learning' || state === 'relearning' || state === 'new'
    if (f === 'review') return state === 'review'
    if (f === 'mastered') return state === 'mastered'
    return true
  })
})

const visibleCount = computed(() => (session.wordListPage + 1) * WORDS_PER_PAGE)
const visibleWords = computed(() => filtered.value.slice(0, visibleCount.value))
const hasMore = computed(() => filtered.value.length > visibleCount.value)

const filters = computed(() => {
  const counts = { all: 0, unseen: 0, learning: 0, review: 0, mastered: 0 }
  for (const w of WORD_LIST) {
    const s = states.value[w.id] || 'unseen'
    counts.all++
    if (s === 'unseen') counts.unseen++
    else if (s === 'learning' || s === 'relearning' || s === 'new') counts.learning++
    else if (s === 'review') counts.review++
    else if (s === 'mastered') counts.mastered++
  }
  return [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'unseen', label: 'Unseen', count: counts.unseen },
    { key: 'learning', label: 'Learning', count: counts.learning },
    { key: 'review', label: 'Review', count: counts.review },
    { key: 'mastered', label: 'Mastered', count: counts.mastered }
  ]
})

function setFilter(f: string) {
  session.wordListFilter = f
}
</script>
