<template>
  <div v-if="word" class="reading-tooltip" @click.stop>
    <div class="reading-tooltip-close" @click="emit('close')">&#10005;</div>
    <div class="reading-tooltip-word">
      {{ word.word }} <span class="reading-tooltip-pos">{{ word.pos }}</span>
    </div>
    <div class="reading-tooltip-phonetic">
      {{ word.phonetic }}
      <button class="example-play-btn" @click="audio.speak(word.word)" title="Play">&#9654;</button>
    </div>
    <div class="reading-tooltip-zh">{{ word.zh }}</div>
    <div class="reading-tooltip-en">{{ word.en }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WordIndex } from '@/lib/word-index'
import { useAudio } from '@/composables/useAudio'

const props = defineProps<{ wordId: number | null }>()
const emit = defineEmits<{ close: [] }>()
const audio = useAudio()

const word = computed(() => {
  if (props.wordId === null) return null
  return WordIndex.get(props.wordId)
})
</script>
