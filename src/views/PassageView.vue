<template>
  <div v-if="passage" class="passage-screen fade-in">
    <div class="card-header">
      <button class="back-btn" @click="router.push('/reading')">&#8592; Back</button>
      <span class="card-progress">{{ passage.level }} &middot; {{ formatTopic(passage.topic) }}</span>
    </div>

    <div class="passage-content">
      <h2 class="passage-title">{{ passage.title }}</h2>
      <div ref="passageTextRef" class="passage-text" v-html="highlightedText"></div>
      <WordTooltip
        v-if="tooltipWordId !== null"
        :wordId="tooltipWordId"
        @close="tooltipWordId = null"
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
import type { Word } from '@/types'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const passages = usePassages()

const passageTextRef = ref<HTMLElement | null>(null)
const tooltipWordId = ref<number | null>(null)

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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const highlightedText = computed(() => {
  if (!passage.value) return ''

  const wordMap: Record<string, Word> = {}
  for (const wid of passage.value.wordIds) {
    const w = WordIndex.get(wid)
    if (w) wordMap[w.word.toLowerCase()] = w
  }

  const wordKeys = Object.keys(wordMap)
  if (wordKeys.length === 0) return escapeHtml(passage.value.text)

  const sorted = wordKeys.sort((a, b) => b.length - a.length)
  const pattern = new RegExp('\\b(' + sorted.map(w => escapeRegex(w)).join('|') + ')\\b', 'gi')

  let result = ''
  let lastIndex = 0
  const text = passage.value.text

  text.replace(pattern, (match: string, _word: string, offset: number) => {
    result += escapeHtml(text.slice(lastIndex, offset))
    const w = wordMap[match.toLowerCase()]
    if (w) {
      result += `<span class="highlight-word" data-word-id="${w.id}">${escapeHtml(match)}</span>`
    } else {
      result += escapeHtml(match)
    }
    lastIndex = offset + match.length
    return match
  })

  result += escapeHtml(text.slice(lastIndex))
  return result
})

// Use event delegation for highlighted words
function onPassageClick(e: Event) {
  const target = e.target as HTMLElement
  if (target.classList.contains('highlight-word')) {
    const wordId = Number(target.dataset.wordId)
    if (tooltipWordId.value === wordId) {
      tooltipWordId.value = null
    } else {
      tooltipWordId.value = wordId
    }
  }
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
