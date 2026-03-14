<template>
  <div v-if="word" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-handle"></div>

      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div style="flex:1">
          <div class="card-word" style="font-size:28px">{{ word.word }}</div>
          <div class="card-phonetic">{{ word.phonetic }}</div>
          <div class="card-pos">{{ word.pos }}</div>
        </div>
        <div class="audio-controls">
          <button class="audio-btn" @click="audio.speak(word.word)" title="Play">&#9654;</button>
          <button class="audio-btn audio-btn-slow" @click="audio.speakSlow(word.word)" title="Slow">&#9654;&frac12;</button>
        </div>
        <span class="word-item-badge" :class="'badge-' + state">{{ state }}</span>
        <LevelBadge :level="word.level" />
      </div>

      <div v-for="(text, locale) in word.translations" :key="locale" class="card-def" style="margin-top:8px">
        {{ text }}
      </div>

      <ul class="card-examples" style="margin-top:12px">
        <li v-for="(ex, i) in word.examples" :key="i">
          <span class="example-text">{{ ex }}</span>
          <button class="example-play-btn" @click="audio.speakSentence(ex, 'normal', word.word, i)" title="Play sentence">&#9654;</button>
          <div v-for="(texts, locale) in word.exampleTranslations" :key="locale" class="example-translation">
            {{ texts[i] }}
          </div>
        </li>
      </ul>

      <div
        v-if="card"
        style="margin-top:16px; padding-top:12px; border-top: 1px solid var(--border); font-size:13px; color:var(--text-secondary)"
      >
        Ease: {{ card.ease.toFixed(2) }} &middot; Interval: {{ card.interval }}d &middot; Reps: {{ card.reps }}
        <template v-if="card.due"> &middot; Due: {{ card.due }}</template>
      </div>

      <div v-if="dictData && dictData.meanings" class="card-extra" style="margin-top:16px">
        <div class="card-extra-title">Dictionary</div>
        <div v-for="(m, mi) in dictData.meanings" :key="mi" style="margin-bottom:8px">
          <i>{{ m.partOfSpeech }}</i>
          <template v-for="(d, di) in m.definitions" :key="di">
            <div class="card-extra-def">&bull; {{ d.definition }}</div>
            <div v-if="d.example" class="card-extra-example">"{{ d.example }}"</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useWordModal } from '@/composables/useWordModal'
import LevelBadge from '@/components/LevelBadge.vue'

const props = defineProps<{ wordId: number | null }>()
const emit = defineEmits<{ close: [] }>()

const audio = useAudio()
const { word, state, card, dictData } = useWordModal(toRef(props, 'wordId'))
</script>
