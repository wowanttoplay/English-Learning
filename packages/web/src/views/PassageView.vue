<template>
  <div v-if="loading" class="fade-in" style="text-align:center; padding:40px">
    <p>Loading passage...</p>
  </div>
  <div v-else-if="passage" class="passage-screen fade-in">
    <div class="card-header">
      <button class="back-btn" @click="router.push('/reading')">&#8592; Back</button>
      <span class="card-progress"><span class="level-badge" :class="'level-' + passage.level.toLowerCase()">{{ passage.level }}</span> &middot; {{ formatTopic(passage.topic) }}</span>
    </div>

    <PassageAudioPlayer
      :speeds="audio.speeds"
      :speed="audio.speed.value"
      :isPlaying="audio.isPlaying.value"
      :currentTime="audio.currentTime.value"
      :duration="audio.duration.value"
      :isFallback="audio.isFallback.value"
      :progressPercent="audio.progressPercent.value"
      :formatTime="audio.formatTime"
      :togglePlay="audio.togglePlay"
      :stop="audio.stop"
      :seekTo="audio.seekTo"
      :setSpeed="audio.setSpeed"
    />

    <div class="passage-content">
      <h2 class="passage-title">{{ passage.title }}</h2>
      <div ref="passageTextRef" class="passage-text" v-html="highlightedText"></div>
    </div>

    <!-- Tooltip overlay for mobile (bottom sheet) -->
    <Teleport to="body">
      <div
        v-if="tooltipWordId !== null || freeTooltipWord !== null"
        class="tooltip-overlay"
        @click="closeTooltips"
      >
        <div class="tooltip-sheet" @click.stop>
          <WordTooltip
            v-if="tooltipWordId !== null"
            :wordId="tooltipWordId"
            :words="passageWords"
            @close="closeTooltips"
          />
          <FreeWordTooltip
            v-if="freeTooltipWord !== null"
            :word="freeTooltipWord"
            @close="closeTooltips"
          />
        </div>
      </div>
    </Teleport>

    <div class="passage-actions">
      <button
        v-if="!isRead"
        class="btn btn-primary passage-action-btn"
        @click="markRead(router)"
      >
        &#10003; Mark as Read
      </button>
      <div v-else class="passage-already-read">&#10003; Already read</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePassageView } from '@/composables/usePassageView'
import { usePassageAudioPlayer } from '@/composables/usePassageAudioPlayer'
import { usePassageSentenceSync } from '@/composables/usePassageSentenceSync'
import { formatTopic } from '@/lib/format'
import WordTooltip from '@/components/WordTooltip.vue'
import FreeWordTooltip from '@/components/FreeWordTooltip.vue'
import PassageAudioPlayer from '@/components/PassageAudioPlayer.vue'

const router = useRouter()
const {
  passage,
  passageWords,
  passageTextRef,
  tooltipWordId,
  freeTooltipWord,
  isRead,
  highlightedText,
  loading,
  closeTooltips,
  markRead
} = usePassageView()

// Audio player — lifted from component to view for sentence sync access
const audio = usePassageAudioPlayer(
  () => passage.value?.id ?? 0,
  () => passage.value?.text ?? ''
)

// Sentence highlighting sync
usePassageSentenceSync(
  () => passage.value?.id ?? 0,
  () => audio.currentTime.value,
  () => audio.isPlaying.value,
  () => passageTextRef.value
)
</script>
