<template>
  <div v-if="passage" class="passage-screen fade-in">
    <div class="card-header">
      <button class="back-btn" @click="router.push('/reading')">&#8592; Back</button>
      <span class="card-progress">{{ passage.level }}<span v-if="passage.difficulty === 'bridge'" class="difficulty-badge">Easier</span> &middot; {{ formatTopic(passage.topic) }}</span>
    </div>

    <div class="passage-content">
      <h2 class="passage-title">{{ passage.title }}</h2>
      <div ref="passageTextRef" class="passage-text" v-html="highlightedText"></div>
      <WordTooltip
        v-if="tooltipWordId !== null"
        :wordId="tooltipWordId"
        @close="tooltipWordId = null"
      />
      <FreeWordTooltip
        v-if="freeTooltipWord !== null"
        :word="freeTooltipWord"
        @close="freeTooltipWord = null"
      />
    </div>

    <div class="passage-actions">
      <button class="btn btn-secondary passage-action-btn" @click="playAudio">
        &#9654; Play Audio
      </button>
      <button
        v-if="!isRead"
        class="btn btn-primary passage-action-btn"
        @click="markRead"
      >
        &#10003; Mark as Read
      </button>
      <div v-else class="passage-already-read">&#10003; Already read</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { WordIndex } from '@/lib/word-index'
import { useAudio } from '@/composables/useAudio'
import { usePassages } from '@/composables/usePassages'
import { formatTopic } from '@/lib/format'
import { PASSAGES } from '@/data/passages'
import WordTooltip from '@/components/WordTooltip.vue'
import FreeWordTooltip from '@/components/FreeWordTooltip.vue'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const passages = usePassages()

const passageTextRef = ref<HTMLElement | null>(null)
const tooltipWordId = ref<number | null>(null)
const freeTooltipWord = ref<string | null>(null)

const passage = computed(() => {
  const id = Number(route.params.id)
  return PASSAGES.find(p => p.id === id) || null
})


const isRead = computed(() => {
  if (!passage.value) return false
  return passages.isRead(passage.value.id)
})

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const highlightedText = computed(() => {
  if (!passage.value) return ''

  const targetIds = new Set(passage.value.wordIds)
  const tokens = passage.value.text.split(/([a-zA-Z'-]+)/)
  let result = ''

  for (const token of tokens) {
    if (/^[a-zA-Z'-]+$/.test(token)) {
      const w = WordIndex.getByText(token)
      if (w && targetIds.has(w.id)) {
        result += `<span class="highlight-word-target" data-word-id="${w.id}">${escapeHtml(token)}</span>`
      } else if (w) {
        result += `<span class="highlight-word-vocab" data-word-id="${w.id}">${escapeHtml(token)}</span>`
      } else {
        result += `<span class="plain-word" data-word="${escapeHtml(token)}">${escapeHtml(token)}</span>`
      }
    } else {
      result += escapeHtml(token)
    }
  }

  return result
})

// Use event delegation for highlighted words and plain words
function onPassageClick(e: Event) {
  const target = e.target as HTMLElement

  // Highlighted vocab words (B2 words in the word list)
  if (target.classList.contains('highlight-word-target') || target.classList.contains('highlight-word-vocab')) {
    const wordId = Number(target.dataset.wordId)
    freeTooltipWord.value = null  // close free tooltip
    if (tooltipWordId.value === wordId) {
      tooltipWordId.value = null
    } else {
      tooltipWordId.value = wordId
    }
    return
  }

  // Plain words (any word not in the word list)
  if (target.classList.contains('plain-word')) {
    const word = target.dataset.word ?? null
    tooltipWordId.value = null  // close vocab tooltip
    if (freeTooltipWord.value === word) {
      freeTooltipWord.value = null
    } else {
      freeTooltipWord.value = word
    }
    return
  }

  // Clicked outside any word — close both
  tooltipWordId.value = null
  freeTooltipWord.value = null
}

// Mount click listener via onMounted
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  passageTextRef.value?.addEventListener('click', onPassageClick)
})

onUnmounted(() => {
  passageTextRef.value?.removeEventListener('click', onPassageClick)
})

function playAudio() {
  if (passage.value) {
    audio.speakSentence(passage.value.text)
  }
}

function markRead() {
  if (!passage.value) return
  passages.markRead(passage.value.id)
  router.push('/reading')
}
</script>
