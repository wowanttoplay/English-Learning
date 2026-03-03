<template>
  <div class="topic-summary" @click="router.push('/topics')">
    <span class="topic-summary-label">Topics</span>
    <span class="topic-summary-value">{{ label }}</span>
    <span class="topic-summary-arrow">&#8250;</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { TOPIC_REGISTRY } from '@/data/topics'

const router = useRouter()
const srsStore = useSrsStore()

const label = computed(() => {
  const active = srsStore.getActiveTopics()
  if (active.length === 0) return 'All Topics'
  const names = active.map(id => {
    const t = TOPIC_REGISTRY.find(r => r.id === id)
    return t ? t.name : id
  })
  return names.length <= 2 ? names.join(', ') : names.slice(0, 2).join(', ') + ' +' + (names.length - 2)
})
</script>
