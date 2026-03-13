<template>
  <div class="progress-section">
    <div class="progress-header">
      <span>Progress</span>
      <span>{{ started }} / {{ total }} words</span>
    </div>
    <div class="progress-bar-multi">
      <div class="progress-segment mastered" :style="{ width: masteredPct + '%' }"></div>
      <div class="progress-segment young" :style="{ width: youngPct + '%' }"></div>
      <div class="progress-segment learning" :style="{ width: learningPct + '%' }"></div>
    </div>
    <div class="progress-legend">
      <span class="legend-item"><span class="legend-dot mastered"></span>{{ mastered }} Mastered</span>
      <span class="legend-item"><span class="legend-dot young"></span>{{ young }} Young</span>
      <span class="legend-item"><span class="legend-dot learning"></span>{{ learning }} Learning</span>
      <span class="legend-item"><span class="legend-dot unseen"></span>{{ unseen }} Unseen</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  started: number
  mastered: number
  young: number
  learning: number
}>()

const unseen = computed(() => props.total - props.started)
const denom = computed(() => props.total || 1)
const masteredPct = computed(() => Math.round((props.mastered / denom.value) * 100))
const youngPct = computed(() => Math.round((props.young / denom.value) * 100))
const learningPct = computed(() => Math.round((props.learning / denom.value) * 100))
</script>
