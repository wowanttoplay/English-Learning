<template>
  <div class="fade-in">
    <div class="header">
      <h1>Oxford 5000</h1>
      <div class="header-actions">
        <button class="icon-btn" @click="theme.toggle()" title="Toggle theme">
          <span v-html="theme.isDark.value ? '&#9728;' : '&#9790;'"></span>
        </button>
      </div>
    </div>

    <StatsGrid :items="topStats" />

    <ProgressBar
      :total="stats.totalWords"
      :started="stats.totalStarted"
      :mastered="stats.totalMastered"
      :young="stats.totalReview"
      :learning="stats.totalLearning"
    />

    <TopicSummary />

    <div class="action-buttons">
      <button
        class="btn btn-primary"
        :disabled="due.total === 0"
        @click="startStudy('mixed')"
      >
        Start Study
        <span class="btn-count">{{ due.total }}</span>
      </button>
      <button
        v-if="due.review + due.learning > 0"
        class="btn btn-secondary"
        @click="startStudy('review')"
      >
        Review Due
        <span class="btn-count">{{ due.review + due.learning }}</span>
      </button>
      <button
        v-if="due.new > 0"
        class="btn btn-secondary"
        @click="startStudy('learn')"
      >
        Learn New Words
        <span class="btn-count">{{ due.new }}</span>
      </button>
    </div>

    <WeeklyHeatmap :history="srsStore.getHistory()" />

    <StatsGrid :items="bottomStats" :columns="2" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { useSessionStore } from '@/stores/session'
import { useTheme } from '@/composables/useTheme'
import StatsGrid from '@/components/StatsGrid.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WeeklyHeatmap from '@/components/WeeklyHeatmap.vue'
import TopicSummary from '@/components/TopicSummary.vue'

const router = useRouter()
const srsStore = useSrsStore()
const session = useSessionStore()
const theme = useTheme()

const stats = computed(() => srsStore.stats)
const due = computed(() => srsStore.dueCount)

const topStats = computed(() => [
  { value: due.value.new, label: 'New', color: 'blue' },
  { value: due.value.review + due.value.learning, label: 'To Review', color: 'orange' },
  { value: stats.value.streak, label: 'Day Streak', color: 'green' }
])

const bottomStats = computed(() => [
  { value: stats.value.todayLearned, label: 'Learned Today' },
  { value: stats.value.todayReviewed, label: 'Reviewed Today' }
])

function startStudy(type: 'learn' | 'review' | 'mixed') {
  const cards = srsStore.getCardsForToday()
  let queue
  if (type === 'review') {
    queue = [...cards.learning, ...cards.review]
  } else if (type === 'learn') {
    queue = [...cards.new]
  } else {
    queue = [...cards.learning, ...cards.review, ...cards.new]
  }
  if (queue.length === 0) return
  session.startSession(queue, type)
  router.push('/study')
}
</script>
