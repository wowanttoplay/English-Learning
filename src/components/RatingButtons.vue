<template>
  <div class="rating-buttons">
    <button class="rate-btn again" @click="emit('rate', 1)">
      Again
      <span class="rate-interval">{{ intervals.again }}</span>
    </button>
    <button class="rate-btn hard" @click="emit('rate', 2)">
      Hard
      <span class="rate-interval">{{ intervals.hard }}</span>
    </button>
    <button class="rate-btn good" @click="emit('rate', 3)">
      Good
      <span class="rate-interval">{{ intervals.good }}</span>
    </button>
    <button class="rate-btn easy" @click="emit('rate', 4)">
      Easy
      <span class="rate-interval">{{ intervals.easy }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SrsCard, Rating } from '@/types'

const props = defineProps<{ card: SrsCard }>()
const emit = defineEmits<{ rate: [rating: Rating] }>()

function formatInterval(days: number): string {
  if (days < 1) return '<1d'
  if (days === 1) return '1d'
  if (days < 30) return days + 'd'
  if (days < 365) return Math.round(days / 30) + 'mo'
  return (days / 365).toFixed(1) + 'y'
}

const intervals = computed(() => {
  const card = props.card
  if (card.state === 'learning' || card.state === 'relearning') {
    const step = card.step || 0
    return {
      again: '1m',
      hard: step < 2 ? ['1m', '10m'][step] : '10m',
      good: step + 1 >= 2 ? '1d' : '10m',
      easy: '4d'
    }
  }

  const ease = card.ease || 2.5
  const interval = card.interval || 1
  return {
    again: '1d',
    hard: formatInterval(Math.max(1, Math.round(interval * 1.2))),
    good: formatInterval(Math.max(1, Math.round(interval * ease))),
    easy: formatInterval(Math.max(1, Math.round(interval * ease * 1.3)))
  }
})
</script>
