<template>
  <div class="audio-controls">
    <button class="audio-btn" @click.stop="audio.speak(word)" title="Play pronunciation">
      &#9654;
    </button>
    <button class="audio-btn audio-btn-slow" @click.stop="audio.speakSlow(word)" title="Play slowly">
      &#9654;&frac12;
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'

defineProps<{ word: string }>()
const audio = useAudio()
</script>
