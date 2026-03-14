<template>
  <div class="fade-in">
    <div class="header">
      <h1>Reading</h1>
    </div>

    <template v-if="passagesStore.loading">
      <div class="reading-empty">
        <p>Loading passages...</p>
      </div>
    </template>

    <template v-else-if="!hasPassages">
      <div class="reading-empty">
        <div class="reading-empty-icon">&#128214;</div>
        <h3>No passages available yet</h3>
        <p>Passages will appear here as content is added.</p>
      </div>
    </template>

    <template v-else>
      <div class="filter-section">
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: levelFilter === 'all' }"
            @click="levelFilter = 'all'"
          >All</button>
          <button
            v-for="level in cefrLevels"
            :key="level"
            class="filter-tab"
            :class="{ active: levelFilter === level }"
            @click="levelFilter = level"
          >{{ level }}</button>
        </div>

        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: domainFilter === 'all' }"
            @click="setDomain('all')"
          >All Topics</button>
          <button
            v-for="domain in DOMAINS"
            :key="domain.id"
            class="filter-tab"
            :class="{ active: domainFilter === domain.id }"
            @click="setDomain(domain.id)"
          >{{ domain.emoji }} {{ domain.name }}</button>
        </div>

        <div v-if="domainFilter !== 'all'" class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: topicFilter === 'all' }"
            @click="topicFilter = 'all'"
          >All</button>
          <button
            v-for="sub in availableSubtopics"
            :key="sub.id"
            class="filter-tab"
            :class="{ active: topicFilter === sub.id }"
            @click="topicFilter = sub.id"
          >{{ sub.emoji }} {{ sub.name }}</button>
        </div>
      </div>

      <template v-if="readyPassages.length === 0 && completedPassages.length === 0">
        <div class="reading-empty">
          <div class="reading-empty-icon">&#128269;</div>
          <h3>No passages match these filters</h3>
          <p>Try selecting a different topic or level.</p>
        </div>
      </template>

      <template v-if="readyPassages.length > 0">
        <div class="reading-section-title">Available to Read</div>
        <div class="passage-list">
          <div
            v-for="passage in readyPassages"
            :key="passage.id"
            class="passage-item"
            @click="router.push('/reading/' + passage.id)"
          >
            <div class="passage-item-info">
              <div class="passage-item-title">{{ passage.title }}</div>
              <div class="passage-item-meta">
                <span class="passage-topic">{{ formatTopic(passage.topic) }}</span>
                <span class="level-badge" :class="'level-' + passage.level.toLowerCase()">{{ passage.level }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="completedPassages.length > 0">
        <div class="reading-section-title" style="margin-top: 24px">Completed</div>
        <div class="passage-list">
          <div
            v-for="p in completedPassages"
            :key="p.id"
            class="passage-item completed"
            @click="router.push('/reading/' + p.id)"
          >
            <div class="passage-item-info">
              <div class="passage-item-title">{{ p.title }}</div>
              <div class="passage-item-meta">
                <span class="passage-topic">{{ formatTopic(p.topic) }}</span>
                <span class="level-badge" :class="'level-' + p.level.toLowerCase()">{{ p.level }}</span>
              </div>
            </div>
            <span class="passage-done-badge">&#10003; Read</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePassagesStore } from '@/stores/passages'
import { DOMAINS, getSubtopicsByDomain } from '@/data/topics'
import { formatTopic } from '@/lib/format'
import type { CefrCoreLevel, DomainId, SubtopicId } from '@/types'

const router = useRouter()
const passagesStore = usePassagesStore()

onMounted(() => {
  passagesStore.loadPassages('en')
  passagesStore.loadPassagesRead()
})

const hasPassages = computed(() => passagesStore.passages.length > 0)

const cefrLevels: CefrCoreLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const levelFilter = ref<'all' | CefrCoreLevel>('all')
const domainFilter = ref<'all' | DomainId>('all')
const topicFilter = ref<'all' | SubtopicId>('all')

function setDomain(d: 'all' | DomainId) {
  domainFilter.value = d
  topicFilter.value = 'all'
}

const filteredPassages = computed(() => {
  if (levelFilter.value === 'all') return passagesStore.passages
  return passagesStore.passages.filter(p => p.level === levelFilter.value)
})

const availableSubtopics = computed(() => {
  if (domainFilter.value === 'all') return []
  const subs = getSubtopicsByDomain(domainFilter.value)
  const topicIds = new Set(filteredPassages.value.map(p => p.topic))
  return subs.filter(s => topicIds.has(s.id))
})

const topicFilteredPassages = computed(() => {
  let list = filteredPassages.value
  if (domainFilter.value !== 'all') {
    const domainSubtopicIds = new Set(getSubtopicsByDomain(domainFilter.value).map(s => s.id))
    list = list.filter(p => domainSubtopicIds.has(p.topic))
  }
  if (topicFilter.value !== 'all') {
    list = list.filter(p => p.topic === topicFilter.value)
  }
  return list
})

const readyPassages = computed(() =>
  topicFilteredPassages.value.filter(p => !passagesStore.isRead(p.id))
)

const completedPassages = computed(() =>
  topicFilteredPassages.value.filter(p => passagesStore.isRead(p.id))
)
</script>
