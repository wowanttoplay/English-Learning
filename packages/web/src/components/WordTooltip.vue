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
    <div v-for="(text, locale) in word.translations" :key="locale" class="reading-tooltip-def">
      {{ text }}
    </div>
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
import { toRef } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useWordTooltip } from '@/composables/useWordTooltip'
import type { Word } from '@/types'
import LevelBadge from '@/components/LevelBadge.vue'

const props = defineProps<{ wordId: number | null; words?: Word[] }>()
const emit = defineEmits<{ close: [] }>()
const audio = useAudio()

const { word, cardState, stateLabel, addToDeck, markKnown: doMarkKnown, unmarkKnown: doUnmarkKnown } = useWordTooltip(
  toRef(props, 'wordId'),
  toRef(props, 'words')
)

function markKnown() {
  doMarkKnown()
  emit('close')
}

function unmarkKnown() {
  doUnmarkKnown()
  emit('close')
}
</script>
