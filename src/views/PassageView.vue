<template>
  <div v-if="passage" class="passage-screen fade-in">
    <div class="card-header">
      <button class="back-btn" @click="router.push('/reading')">&#8592; Back</button>
      <span class="card-progress">{{ passage.level }}<span v-if="passage.level === 'B1'" class="difficulty-badge">Easier</span> &middot; {{ formatTopic(passage.topic) }}</span>
    </div>

    <PassageAudioPlayer
      :passageId="passage.id"
      :passageText="passage.text"
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
import { formatTopic } from '@/lib/format'
import WordTooltip from '@/components/WordTooltip.vue'
import FreeWordTooltip from '@/components/FreeWordTooltip.vue'
import PassageAudioPlayer from '@/components/PassageAudioPlayer.vue'

const router = useRouter()
const {
  passage,
  passageTextRef,
  tooltipWordId,
  freeTooltipWord,
  isRead,
  highlightedText,
  closeTooltips,
  markRead
} = usePassageView()
</script>
