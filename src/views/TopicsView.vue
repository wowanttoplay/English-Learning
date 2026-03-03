<template>
  <div class="fade-in">
    <div class="header">
      <h1>Topics</h1>
    </div>

    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
      Select topics for new cards. Review cards are not affected by topic filters.
    </p>

    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <button class="filter-tab" :class="{ active: activeTopics.length === 0 }" @click="clearAll">All Topics</button>
      <button class="filter-tab" @click="selectAll">Select All</button>
      <button class="filter-tab" @click="clearAll">Clear All</button>
    </div>

    <div class="topic-grid">
      <div
        v-for="topic in topicItems"
        :key="topic.id"
        class="topic-card"
        :class="{ active: topic.isActive }"
        @click="toggleTopic(topic.id)"
      >
        <div class="topic-card-emoji">{{ topic.emoji }}</div>
        <div class="topic-card-info">
          <div class="topic-card-name">{{ topic.name }}</div>
          <div class="topic-card-meta">{{ topic.wordCount }} words &middot; {{ topic.pct }}% learned</div>
        </div>
        <div class="topic-card-check" v-html="topic.isActive ? '&#10003;' : ''"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { WordIndex } from '@/lib/word-index'
import { TOPIC_REGISTRY } from '@/data/topics'

const srsStore = useSrsStore()

const activeTopics = ref<string[]>(srsStore.getActiveTopics())

const topicItems = computed(() => {
  const activeSet = new Set(activeTopics.value)
  const counts = WordIndex.getAllTopicCounts(TOPIC_REGISTRY)
  const states = srsStore.getAllCardStates()

  return TOPIC_REGISTRY.map(topic => {
    const wordCount = counts[topic.id] || 0
    let learnedCount = 0
    const words = WordIndex.getByTopic(topic.id)
    for (const w of words) {
      if (states[w.id]) learnedCount++
    }
    const pct = wordCount > 0 ? Math.round((learnedCount / wordCount) * 100) : 0
    return {
      id: topic.id,
      name: topic.name,
      emoji: topic.emoji,
      wordCount,
      pct,
      isActive: activeSet.has(topic.id)
    }
  })
})

function toggleTopic(topicId: string) {
  const idx = activeTopics.value.indexOf(topicId)
  if (idx >= 0) {
    activeTopics.value.splice(idx, 1)
  } else {
    activeTopics.value.push(topicId)
  }
  srsStore.setActiveTopics([...activeTopics.value])
}

function selectAll() {
  activeTopics.value = TOPIC_REGISTRY.map(t => t.id)
  srsStore.setActiveTopics([...activeTopics.value])
}

function clearAll() {
  activeTopics.value = []
  srsStore.setActiveTopics([])
}
</script>
