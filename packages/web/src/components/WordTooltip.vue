<template>
  <div v-if="word" class="reading-tooltip" @click.stop>
    <div class="reading-tooltip-close" @click="emit('close')">&#10005;</div>
    <div class="reading-tooltip-word">
      {{ word.word }} <span class="reading-tooltip-pos">{{ word.pos }}</span>
      <span class="reading-tooltip-state" :class="'state-' + cardState">{{ stateLabel }}</span>
      <LevelBadge v-if="word" :level="word.level" />
    </div>
    <div class="reading-tooltip-phonetic">
      {{ word.phonetic }}
      <button class="example-play-btn" @click="audio.speak(word.word)" title="Play">&#9654;</button>
    </div>
    <div class="reading-tooltip-zh">{{ word.definitionNative }}</div>
    <div class="reading-tooltip-en">{{ word.definitionTarget }}</div>
    <button
      v-if="cardState === 'unseen'"
      class="btn btn-primary reading-tooltip-add"
      @click="addToDeck"
    >
      Save to Deck
    </button>
    <button
      v-if="cardState === 'unseen'"
      class="btn btn-secondary reading-tooltip-add"
      @click="markKnown"
    >
      Already Know This
    </button>
    <button
      v-if="cardState === 'known'"
      class="btn btn-secondary reading-tooltip-add"
      @click="unmarkKnown"
    >
      Study This Word
    </button>
    <button
      v-if="cardState === 'learning' || cardState === 'relearning' || cardState === 'review' || cardState === 'mastered'"
      class="btn btn-secondary reading-tooltip-add"
      @click="markKnown"
    >
      Mark as Known
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useSrsStore } from '@/stores/srs'
import type { Word } from '@/types'
import LevelBadge from '@/components/LevelBadge.vue'

const props = defineProps<{ wordId: number | null; words?: Word[] }>()
const emit = defineEmits<{ close: [] }>()
const audio = useAudio()
const srsStore = useSrsStore()

const word = computed(() => {
  if (props.wordId === null) return null
  return (props.words ?? []).find(w => w.id === props.wordId) ?? null
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
    case 'known': return 'Known'
    default: return ''
  }
})

function addToDeck() {
  if (props.wordId !== null) {
    srsStore.addWordFromReading(props.wordId)
  }
}

function markKnown() {
  if (props.wordId !== null) {
    srsStore.markAsKnown(props.wordId)
    emit('close')
  }
}

function unmarkKnown() {
  if (props.wordId !== null) {
    srsStore.unmarkKnown(props.wordId)
    emit('close')
  }
}
</script>
