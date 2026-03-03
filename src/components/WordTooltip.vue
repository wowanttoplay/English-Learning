<template>
  <div v-if="word" class="reading-tooltip" @click.stop>
    <div class="reading-tooltip-close" @click="emit('close')">&#10005;</div>
    <div class="reading-tooltip-word">
      {{ word.word }} <span class="reading-tooltip-pos">{{ word.pos }}</span>
      <span class="reading-tooltip-state" :class="'state-' + cardState">{{ stateLabel }}</span>
    </div>
    <div class="reading-tooltip-phonetic">
      {{ word.phonetic }}
      <button class="example-play-btn" @click="audio.speak(word.word)" title="Play">&#9654;</button>
    </div>
    <div class="reading-tooltip-zh">{{ word.zh }}</div>
    <div class="reading-tooltip-en">{{ word.en }}</div>
    <button
      v-if="cardState === 'unseen'"
      class="btn btn-primary reading-tooltip-add"
      @click="addToDeck"
    >
      Save to Deck
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WordIndex } from '@/lib/word-index'
import { useAudio } from '@/composables/useAudio'
import { useSrsStore } from '@/stores/srs'

const props = defineProps<{ wordId: number | null }>()
const emit = defineEmits<{ close: [] }>()
const audio = useAudio()
const srsStore = useSrsStore()

const word = computed(() => {
  if (props.wordId === null) return null
  return WordIndex.get(props.wordId)
})

const cardState = computed(() => {
  if (props.wordId === null) return 'unseen'
  return srsStore.getCardState(props.wordId)
})

const stateLabel = computed(() => {
  switch (cardState.value) {
    case 'unseen': return 'Not in deck'
    case 'learning': return 'Learning'
    case 'relearning': return 'Relearning'
    case 'review': return 'Review'
    case 'mastered': return 'Mastered'
    default: return ''
  }
})

function addToDeck() {
  if (props.wordId !== null) {
    srsStore.addWordFromReading(props.wordId)
  }
}
</script>
