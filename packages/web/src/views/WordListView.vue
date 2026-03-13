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
        v-model="searchInput"
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
        @click="query.topic = 'all'; query.loadWords()"
      >All</button>
      <button
        v-for="sub in domainSubtopics"
        :key="sub.id"
        class="filter-tab"
        :class="{ active: query.topic === sub.id }"
        @click="query.topic = sub.id; query.loadWords()"
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
        {{ f.label }}
      </button>
    </div>

    <div v-if="query.loading" class="word-list-empty">Loading...</div>

    <div class="word-list">
      <div v-if="!query.loading && visibleWords.length === 0" class="word-list-empty">No words found</div>
      <div
        v-for="w in visibleWords"
        :key="w.id"
        class="word-item"
        @click="ui.openModal(w.id)"
      >
        <div class="word-item-text">
          <div class="word-item-word">{{ w.word }}</div>
          <div v-if="w.definitionNative" class="word-item-zh">{{ w.definitionNative }}</div>
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
        @click="query.page++; query.loadWords()"
      >
        Load more
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useWordListQueryStore, type WordListFilter } from '@/stores/wordListQuery'
import { useUiStateStore } from '@/stores/uiState'
import { DOMAINS, getSubtopicsByDomain } from '@/data/topics'
import type { DomainId } from '@/types'

const srsStore = useSrsStore()
const query = useWordListQueryStore()
const ui = useUiStateStore()

const searchInput = ref(query.search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Debounce search input
watch(searchInput, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    query.search = val
    query.page = 1
    query.loadWords()
  }, 300)
})

onMounted(() => {
  srsStore.loadCards()
  query.loadWords()
})

function setDomain(d: 'all' | DomainId) {
  query.domain = d
  query.topic = 'all'
  query.page = 1
  query.loadWords()
}

const domainSubtopics = computed(() => {
  if (query.domain === 'all') return []
  return getSubtopicsByDomain(query.domain)
})

const states = computed(() => srsStore.getAllCardStates())

function getState(wordId: number): string {
  return states.value[wordId] || 'unseen'
}

// Client-side filtering by SRS state on top of API-loaded words
const filtered = computed(() => {
  const f = query.filter
  if (f === 'all') return query.words
  return query.words.filter(w => {
    const state = states.value[w.id] || 'unseen'
    if (f === 'unseen') return state === 'unseen'
    if (f === 'learning') return state === 'learning' || state === 'relearning'
    if (f === 'review') return state === 'review'
    if (f === 'mastered') return state === 'mastered'
    if (f === 'known') return state === 'known'
    if (f === 'user') return w.level === 'user'
    return true
  })
})

const visibleWords = computed(() => filtered.value)
const hasMore = computed(() => query.words.length < query.total)

const filters = computed<{ key: WordListFilter; label: string }[]>(() => [
  { key: 'all', label: 'All' },
  { key: 'unseen', label: 'Unseen' },
  { key: 'learning', label: 'Learning' },
  { key: 'review', label: 'Review' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'known', label: 'Known' },
  { key: 'user', label: 'My Words' }
])

function setFilter(f: WordListFilter) {
  query.filter = f
}

async function toggleKnown(wordId: number) {
  const state = states.value[wordId]
  if (state === 'known') {
    await srsStore.unmarkKnown(wordId)
  } else {
    await srsStore.markAsKnown(wordId)
  }
}
</script>
