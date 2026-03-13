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

    <div class="action-buttons">
      <button
        v-if="due.total > 0"
        class="btn btn-primary"
        @click="startStudy"
      >
        Start Review
        <span class="btn-count">{{ due.total }}</span>
      </button>
      <button
        class="btn btn-secondary"
        @click="router.push('/reading')"
      >
        Go Read
      </button>
    </div>

    <WeeklyHeatmap :history="srsStore.history" />

    <StatsGrid :items="bottomStats" :columns="2" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { useStudySessionStore } from '@/stores/studySession'
import { useTheme } from '@/composables/useTheme'
import StatsGrid from '@/components/StatsGrid.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WeeklyHeatmap from '@/components/WeeklyHeatmap.vue'

const router = useRouter()
const srsStore = useSrsStore()
const studySession = useStudySessionStore()
const theme = useTheme()

onMounted(() => srsStore.loadCards())

const stats = computed(() => srsStore.stats)
const due = computed(() => srsStore.dueCount)

const topStats = computed(() => [
  { value: due.value.total, label: 'To Review', color: 'orange' },
  { value: stats.value.streak, label: 'Day Streak', color: 'green' },
  { value: stats.value.deckSize, label: 'In Deck', color: 'blue' }
])

const bottomStats = computed(() => [
  { value: stats.value.todayLearned, label: 'Learned Today' },
  { value: stats.value.todayReviewed, label: 'Reviewed Today' }
])

function startStudy() {
  const cards = srsStore.getCardsForToday()
  const queue = [...cards.learning, ...cards.review]
  if (queue.length === 0) return
  studySession.startSession(queue, 'review')
  router.push('/study')
}
</script>
