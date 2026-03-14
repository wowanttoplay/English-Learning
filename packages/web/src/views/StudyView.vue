<template>
  <div class="fade-in">
    <!-- Session complete -->
    <template v-if="studySession.isComplete">
      <div class="header">
        <h1>Oxford 5000</h1>
      </div>
      <div class="session-complete">
        <div class="session-complete-icon">&#127881;</div>
        <h2>Session Complete!</h2>
        <p>Great work! You reviewed {{ studySession.completeStats?.reviewed || 0 }} cards.</p>

        <StatsGrid :items="completeStatsItems" :columns="2" />

        <div class="action-buttons">
          <button
            v-if="srsStore.dueCount.total > 0"
            class="btn btn-primary"
            @click="continueStudy"
          >
            Continue Studying
            <span class="btn-count">{{ srsStore.dueCount.total }}</span>
          </button>
          <button class="btn btn-secondary" @click="router.push('/')">
            Back to Dashboard
          </button>
        </div>
      </div>
    </template>

    <!-- Flashcard -->
    <template v-else-if="currentCard && currentWord">
      <div class="card-screen">
        <div class="card-header">
          <button class="back-btn" @click="router.push('/')">&#8592; Back</button>
          <span class="card-progress">
            {{ studySession.index + 1 }} / {{ studySession.queue.length }} &middot; {{ stateLabel }}
          </span>
        </div>
        <div class="card-progress-bar">
          <div class="card-progress-fill" :style="{ width: studySession.progressPct + '%' }"></div>
        </div>

        <div class="flashcard" @click="!studySession.revealed && studySession.reveal()">
          <div class="card-front">
            <div class="card-word">{{ currentWord.word }}</div>
            <div class="card-phonetic">{{ currentWord.phonetic }}</div>
            <div class="card-pos">{{ currentWord.pos }}</div>
            <LevelBadge :level="currentWord.level" />
            <AudioControls :word="currentWord.word" />
            <div v-if="!studySession.revealed" class="card-know-wrapper">
              <button class="card-know-btn" @click.stop="markCurrentAsKnown">Know This Word</button>
            </div>
            <div v-if="!studySession.revealed" class="tap-hint">Tap to reveal answer</div>
          </div>

          <div v-if="studySession.revealed" class="card-back">
            <div v-for="(text, locale) in currentWord.translations" :key="locale" class="card-def">
              {{ text }}
            </div>
            <ul class="card-examples">
              <li v-for="(ex, i) in currentWord.examples" :key="i">
                <span class="example-text">{{ ex }}</span>
                <button class="example-play-btn" @click.stop="audio.speakSentence(ex, 'normal', currentWord.word, i)" title="Play sentence">&#9654;</button>
              </li>
            </ul>

            <div v-if="extraDefs.length > 0" class="card-extra">
              <div class="card-extra-title">More definitions</div>
              <template v-for="(d, i) in extraDefs" :key="i">
                <div class="card-extra-def"><i>{{ d.pos }}</i> &mdash; {{ d.def }}</div>
                <div v-if="d.example" class="card-extra-example">"{{ d.example }}"</div>
              </template>
            </div>
          </div>
        </div>

        <RatingButtons v-if="studySession.revealed" :card="currentCard" @rate="onRate" />
      </div>
    </template>

    <!-- Fallback -->
    <template v-else>
      <div style="text-align:center; padding:40px">
        <p>Nothing to review right now.</p>
        <p style="color:var(--text-secondary); margin-top:8px">Read a passage to discover new words.</p>
        <div class="action-buttons" style="margin-top:16px">
          <button class="btn btn-primary" @click="router.push('/reading')">Go Read</button>
          <button class="btn btn-secondary" @click="router.push('/')">Back to Dashboard</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { useStudySessionStore } from '@/stores/studySession'
import { useAudio } from '@/composables/useAudio'
import { useStudySession } from '@/composables/useStudySession'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import AudioControls from '@/components/AudioControls.vue'
import RatingButtons from '@/components/RatingButtons.vue'
import StatsGrid from '@/components/StatsGrid.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import type { Rating } from '@/types'

const router = useRouter()
const srsStore = useSrsStore()
const studySession = useStudySessionStore()
const audio = useAudio()
const { currentCard, currentWord, stateLabel, extraDefs, completeStatsItems } = useStudySession()

async function onRate(rating: Rating) {
  const card = currentCard.value
  if (!card) return
  const updated = await srsStore.rateCard(card.wordId, rating)
  studySession.advance(updated)
}

async function markCurrentAsKnown() {
  const card = currentCard.value
  if (!card) return
  await srsStore.markAsKnown(card.wordId)
  studySession.skipCurrent()
}

function continueStudy() {
  const cards = srsStore.getCardsForToday()
  const queue = [...cards.learning, ...cards.review]
  if (queue.length === 0) return
  studySession.startSession(queue, 'review')
}

function revealOrRate() {
  if (studySession.isComplete) return
  if (!studySession.revealed) studySession.reveal()
  else onRate(3)
}

useKeyboardShortcuts({
  ' ': revealOrRate,
  'Enter': revealOrRate,
  '1': () => { if (studySession.revealed && !studySession.isComplete) onRate(1) },
  '2': () => { if (studySession.revealed && !studySession.isComplete) onRate(2) },
  '3': () => { if (studySession.revealed && !studySession.isComplete) onRate(3) },
  '4': () => { if (studySession.revealed && !studySession.isComplete) onRate(4) },
  'p': () => { if (currentWord.value) audio.speak(currentWord.value.word) },
  'P': () => { if (currentWord.value) audio.speak(currentWord.value.word) },
  'Escape': () => { router.push('/') }
})
</script>
