<template>
  <div class="fade-in">
    <div class="header">
      <h1>Reading</h1>
    </div>

    <template v-if="!hasPassages">
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
            :class="{ active: difficultyFilter === 'all' }"
            @click="difficultyFilter = 'all'"
          >All</button>
          <button
            class="filter-tab"
            :class="{ active: difficultyFilter === 'bridge' }"
            @click="difficultyFilter = 'bridge'"
          >Easier</button>
          <button
            class="filter-tab"
            :class="{ active: difficultyFilter === 'standard' }"
            @click="difficultyFilter = 'standard'"
          >Standard</button>
        </div>

        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: topicFilter === 'all' }"
            @click="topicFilter = 'all'"
          >All Topics</button>
          <button
            v-for="topic in availableTopics"
            :key="topic.id"
            class="filter-tab"
            :class="{ active: topicFilter === topic.id }"
            @click="topicFilter = topic.id"
          >{{ topic.emoji }} {{ topic.name }}</button>
        </div>
      </div>

      <template v-if="readyPassages.length === 0 && completedPassages.length === 0">
        <div class="reading-empty">
          <div class="reading-empty-icon">&#128269;</div>
          <h3>No passages match these filters</h3>
          <p>Try selecting a different topic or difficulty.</p>
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
                <span class="passage-level">{{ passage.level }}</span>
                <span v-if="passage.difficulty === 'bridge'" class="difficulty-badge">Easier</span>
                <span class="passage-words">{{ passage.wordIds.length }} target words</span>
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
                <span class="passage-level">{{ p.level }}</span>
                <span v-if="p.difficulty === 'bridge'" class="difficulty-badge">Easier</span>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PASSAGES } from '@/data/passages'
import { TOPIC_REGISTRY } from '@/data/topics'
import { usePassages } from '@/composables/usePassages'
import { formatTopic } from '@/lib/format'

const router = useRouter()
const passages = usePassages()

const hasPassages = PASSAGES.length > 0

const difficultyFilter = ref<'all' | 'bridge' | 'standard'>('all')
const topicFilter = ref<string>('all')

const filteredPassages = computed(() => {
  if (difficultyFilter.value === 'all') return PASSAGES
  if (difficultyFilter.value === 'bridge') return PASSAGES.filter(p => p.difficulty === 'bridge')
  // 'standard' shows passages without difficulty set or with difficulty === 'standard'
  return PASSAGES.filter(p => !p.difficulty || p.difficulty === 'standard')
})

const availableTopics = computed(() => {
  const topicIds = new Set(PASSAGES.map(p => p.topic))
  return TOPIC_REGISTRY.filter(t => topicIds.has(t.id))
})

const topicFilteredPassages = computed(() => {
  if (topicFilter.value === 'all') return filteredPassages.value
  return filteredPassages.value.filter(p => p.topic === topicFilter.value)
})

const readyPassages = computed(() => {
  const readSet = new Set(passages.passagesRead.value)
  return topicFilteredPassages.value.filter(p => !readSet.has(p.id))
})

const completedPassages = computed(() => {
  const readSet = new Set(passages.passagesRead.value)
  return topicFilteredPassages.value.filter(p => readSet.has(p.id))
})
</script>
