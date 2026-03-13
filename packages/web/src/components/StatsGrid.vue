<template>
  <div class="stats-grid" :style="columns ? `grid-template-columns: repeat(${columns}, 1fr)` : ''">
    <div v-for="(item, i) in items" :key="i" class="stat-card">
      <div class="stat-value" :class="item.color || ''">{{ item.value }}</div>
      <div class="stat-label">{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: { value: number | string; label: string; color?: string }[]
  columns?: number
}>()
</script>
