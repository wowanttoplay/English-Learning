<template>
  <div class="heatmap-section">
    <div class="heatmap-title">This Week</div>
    <div class="heatmap-grid">
      <div
        v-for="day in days"
        :key="day.name"
        class="heatmap-day"
        :class="{ today: day.isToday }"
      >
        <span class="heatmap-label">{{ day.name }}</span>
        <div class="heatmap-bar-track">
          <div
            class="heatmap-bar"
            :class="'level-' + day.level"
            :style="{ width: day.barWidth + '%' }"
          ></div>
        </div>
        <span class="heatmap-count">{{ day.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  history: Record<string, { reviewed: number; learned: number }>
}>()

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const days = computed(() => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  let maxCount = 1
  const result: { name: string; count: number; isToday: boolean; level: number; barWidth: number }[] = []

  // First pass: collect counts
  const counts: number[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - (mondayOffset - i))
    const key = formatDateKey(d)
    const entry = props.history[key]
    const count = entry ? (entry.reviewed || 0) : 0
    if (count > maxCount) maxCount = count
    counts.push(count)
  }

  // Second pass: compute levels
  for (let i = 0; i < 7; i++) {
    const count = counts[i]
    const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4))
    const barWidth = count === 0 ? 0 : Math.max(8, (count / maxCount) * 100)
    result.push({
      name: dayNames[i],
      count,
      isToday: i === mondayOffset,
      level,
      barWidth
    })
  }

  return result
})
</script>
