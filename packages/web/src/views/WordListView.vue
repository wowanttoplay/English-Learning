<template>
  <div class="fade-in">
    <div class="wordlist-header">
      <h2>Word List</h2>
    </div>

    <div class="wordlist-filters-row">
      <input
        class="search-box"
        type="text"
        placeholder="Search words..."
        v-model="query.search"
      />
    </div>

    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: query.domain === 'all' }"
        @click="setDomain('all')"
      >All Topics</button>
      <button
        v-for="domain in DOMAINS"
        :key="domain.id"
        class="filter-tab"
        :class="{ active: query.domain === domain.id }"
        @click="setDomain(domain.id)"
      >{{ domain.emoji }} {{ domain.name }}</button>
    </div>

    <div v-if="query.domain !== 'all'" class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: query.topic === 'all' }"
        @click="query.topic = 'all'"
      >All</button>
      <button
        v-for="sub in domainSubtopics"
        :key="sub.id"
        class="filter-tab"
        :class="{ active: query.topic === sub.id }"
        @click="query.topic = sub.id"
      >{{ sub.emoji }} {{ sub.name }}</button>
    </div>

    <div class="filter-tabs">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-tab"
        :class="{ active: query.filter === f.key }"
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
        @click="ui.openModal(w.id)"
      >
        <div class="word-item-text">
          <div class="word-item-word">{{ w.word }}</div>
          <div v-if="w.zh" class="word-item-zh">{{ w.zh }}</div>
        </div>
        <button
          class="word-known-btn"
          :class="{ 'is-known': getState(w.id) === 'known' }"
          @click.stop="toggleKnown(w.id)"
          :title="getState(w.id) === 'known' ? 'Unmark known' : 'Mark as known'"
        >{{ getState(w.id) === 'known' ? '\u2605' : '\u2606' }}</button>
        <span class="word-item-badge" :class="'badge-' + getState(w.id)">{{ getState(w.id) }}</span>
      </div>
      <button
        v-if="hasMore"
        class="load-more-btn"
        @click="query.page++"
      >
        Load more ({{ filtered.length - visibleCount }} remaining)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useWordListQueryStore, type WordListFilter } from '@/stores/wordListQuery'
import { useUiStateStore } from '@/stores/uiState'
import { WORD_LIST } from '@/data/words'
import { DOMAINS, getSubtopicsByDomain } from '@/data/topics'
import { loadUserWords } from '@/lib/user-words'
import type { DomainId } from '@/types'

const WORDS_PER_PAGE = 50

const srsStore = useSrsStore()
const query = useWordListQueryStore()
const ui = useUiStateStore()

function setDomain(d: 'all' | DomainId) {
  query.domain = d
  query.topic = 'all'
}

const domainSubtopics = computed(() => {
  if (query.domain === 'all') return []
  return getSubtopicsByDomain(query.domain)
})

// Reset page on filter/search change
watch([() => query.search, () => query.filter, () => query.topic, () => query.domain], () => {
  query.page = 0
})

const states = computed(() => srsStore.getAllCardStates())

function getState(wordId: number): string {
  return states.value[wordId] || 'unseen'
}

const allWords = computed(() => {
  srsStore._version
  return [...WORD_LIST, ...loadUserWords()]
})

const filtered = computed(() => {
  const search = query.search.toLowerCase().trim()
  // Build set of subtopic IDs for domain filter
  const domainSubIds = query.domain !== 'all'
    ? new Set(getSubtopicsByDomain(query.domain).map(s => s.id))
    : null
  return allWords.value.filter(w => {
    if (search && !w.word.toLowerCase().includes(search) && !(w.zh && w.zh.includes(search))) return false
    // Domain filter
    if (domainSubIds) {
      const topics = w.topics || []
      if (!topics.some(t => domainSubIds.has(t))) return false
    }
    // Subtopic filter
    if (query.topic !== 'all') {
      const topics = w.topics || []
      if (!topics.includes(query.topic as any)) return false
    }
    const state = states.value[w.id] || 'unseen'
    const f = query.filter
    if (f === 'all') return true
    if (f === 'unseen') return state === 'unseen'
    if (f === 'learning') return state === 'learning' || state === 'relearning'
    if (f === 'review') return state === 'review'
    if (f === 'mastered') return state === 'mastered'
    if (f === 'known') return state === 'known'
    if (f === 'user') return w.level === 'user'
    return true
  })
})

const visibleCount = computed(() => (query.page + 1) * WORDS_PER_PAGE)
const visibleWords = computed(() => filtered.value.slice(0, visibleCount.value))
const hasMore = computed(() => filtered.value.length > visibleCount.value)

const filters = computed(() => {
  const counts = { all: 0, unseen: 0, learning: 0, review: 0, mastered: 0, known: 0, user: 0 }
  for (const w of allWords.value) {
    const s = states.value[w.id] || 'unseen'
    counts.all++
    if (w.level === 'user') counts.user++
    if (s === 'unseen') counts.unseen++
    else if (s === 'learning' || s === 'relearning') counts.learning++
    else if (s === 'review') counts.review++
    else if (s === 'mastered') counts.mastered++
    else if (s === 'known') counts.known++
  }
  return [
    { key: 'all' as WordListFilter, label: 'All', count: counts.all },
    { key: 'unseen' as WordListFilter, label: 'Unseen', count: counts.unseen },
    { key: 'learning' as WordListFilter, label: 'Learning', count: counts.learning },
    { key: 'review' as WordListFilter, label: 'Review', count: counts.review },
    { key: 'mastered' as WordListFilter, label: 'Mastered', count: counts.mastered },
    { key: 'known' as WordListFilter, label: 'Known', count: counts.known },
    { key: 'user' as WordListFilter, label: 'My Words', count: counts.user }
  ]
})

function setFilter(f: WordListFilter) {
  query.filter = f
}

function toggleKnown(wordId: number) {
  const state = states.value[wordId]
  if (state === 'known') {
    srsStore.unmarkKnown(wordId)
  } else {
    srsStore.markAsKnown(wordId)
  }
}
</script>
