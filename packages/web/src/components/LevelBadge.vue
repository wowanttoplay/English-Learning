<template>
  <span class="level-badge" :class="levelClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CefrLevel } from '@/types'

const props = defineProps<{ level: CefrLevel }>()

const levelClass = computed(() => 'level-' + props.level.toLowerCase())
const label = computed(() => props.level === 'user' ? 'MY' : props.level)
</script>
