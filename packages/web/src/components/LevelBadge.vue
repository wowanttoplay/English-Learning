<template>
  <span class="level-badge" :class="levelClass" :style="levelColor ? { background: levelColor } : {}">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getLevelDef } from '@english-learning/shared'

const props = withDefaults(defineProps<{ level: string; lang?: string }>(), {
  lang: 'en',
})

const levelClass = computed(() => 'level-' + props.level.toLowerCase())
const label = computed(() => props.level === 'user' ? 'MY' : props.level)
const levelColor = computed(() => {
  if (props.level === 'user') return null
  const def = getLevelDef(props.lang, props.level)
  return def?.color ?? null
})
</script>
