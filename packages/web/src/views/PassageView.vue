<template>
  <div v-if="loading" class="fade-in" style="text-align:center; padding:40px">
    <p>Loading passage...</p>
  </div>
  <div v-else-if="passage" class="passage-screen fade-in">
    <div class="card-header">
      <button class="back-btn" @click="router.push('/reading')">&#8592; Back</button>
      <span class="card-progress"><LevelBadge :level="passage.level" /> &middot; {{ formatTopic(passage.topic) }}</span>
    </div>

    <PassageAudioPlayer
      :speeds="audio.speeds"
      :speed="audio.speed.value"
      :isPlaying="audio.isPlaying.value"
      :currentTime="audio.currentTime.value"
      :duration="audio.duration.value"
      :isFallback="audio.isFallback.value"
      :progressPercent="audio.progressPercent.value"
      :currentTurnIndex="audio.currentTurnIndex.value"
      :turnCount="passage?.turns?.length ?? 0"
      :formatTime="audio.formatTime"
      :togglePlay="audio.togglePlay"
      :stop="audio.stop"
      :seekTo="audio.seekTo"
      :setSpeed="audio.setSpeed"
      @skip-prev="audio.skipPrev"
      @skip-next="audio.skipNext"
    />

    <div class="passage-content">
      <h2 class="passage-title" style="font-size:24px;font-weight:800;">{{ passage.title }}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;color:var(--text-secondary);">
        <LevelBadge :level="passage.level" />
        <span>{{ formatTopic(passage.topic) }}</span>
        <span v-if="passage.speakers?.length">
          &middot; {{ passage.speakers.map(s => s.name).join(' & ') }}
        </span>
      </div>
      <div ref="passageTextRef" class="passage-text">
        <div v-for="(turn, i) in passage.turns" :key="i"
             class="dialogue-turn"
             :class="{ 'turn-active': audio.currentTurnIndex.value === i }"
             :data-turn-index="i"
             :style="{
               borderLeft: '3px solid ' + (turn.speaker === 0 ? 'var(--speaker-a)' : 'var(--speaker-b)'),
               paddingLeft: '12px',
               marginBottom: '18px',
               display: 'flex',
               alignItems: 'flex-start',
               gap: '10px'
             }">
          <span
            :style="{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: '0', marginTop: '2px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
              background: turn.speaker === 0 ? 'linear-gradient(135deg, var(--speaker-a), #fbbf24)' : 'linear-gradient(135deg, var(--speaker-b), #818cf8)'
            }"
          >{{ passage.speakers[turn.speaker].name.charAt(0) }}</span>
          <div style="flex:1;">
            <span class="speaker-name" :class="`speaker-${turn.speaker}`">
              {{ passage.speakers[turn.speaker].name }}
            </span>
            <span class="turn-text" style="font-size:14px;line-height:1.65;" v-html="highlightedTurns[i]"></span>
          </div>
        </div>
      </div>
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePassageView } from '@/composables/usePassageView'
import { usePassageAudioPlayer } from '@/composables/usePassageAudioPlayer'
import { TimestampLoader } from '@/lib/timestamp-loader'
import { formatTopic } from '@/lib/format'
import type { TurnTimestamp } from '@english-learning/shared'
import WordTooltip from '@/components/WordTooltip.vue'
import FreeWordTooltip from '@/components/FreeWordTooltip.vue'
import PassageAudioPlayer from '@/components/PassageAudioPlayer.vue'
import LevelBadge from '@/components/LevelBadge.vue'

const router = useRouter()
const {
  passage,
  passageWords,
  passageTextRef,
  tooltipWordId,
  freeTooltipWord,
  isRead,
  highlightedTurns,
  turnUrls,
  fallbackText,
  loading,
  closeTooltips,
  markRead
} = usePassageView()

// Load timestamps for audio sync
const timestamps = ref<TurnTimestamp[]>([])
watch(() => passage.value?.id, async (id) => {
  if (!id) { timestamps.value = []; return }
  timestamps.value = await TimestampLoader.loadTimestamps(id) ?? []
}, { immediate: true })

// Audio player — sequential turn playback
const audio = usePassageAudioPlayer(
  () => turnUrls.value,
  () => timestamps.value,
  () => fallbackText.value
)

// Auto-scroll to active turn during playback
watch(() => audio.currentTurnIndex.value, (idx) => {
  if (idx < 0) return
  const el = document.querySelector(`[data-turn-index="${idx}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>
