import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePassagesStore } from '@/stores/passages'
import * as passagesApi from '@/api/passages'
import { splitSentences } from '@/lib/sentence-splitter'
import { AudioPlayer } from '@/lib/audio'
import type { Passage, Word } from '@/types'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function usePassageView() {
  const route = useRoute()
  const passagesStore = usePassagesStore()

  const passageTextRef = ref<HTMLElement | null>(null)
  const tooltipWordId = ref<number | null>(null)
  const freeTooltipWord = ref<string | null>(null)
  const passage = ref<Passage | null>(null)
  const passageWords = ref<Word[]>([])
  const loading = ref(false)

  // Build a lookup set of word text -> word for this passage
  // Includes common inflected forms so "emphasize" matches "emphasis", etc.
  const wordsByText = computed(() => {
    const map = new Map<string, Word>()
    for (const w of passageWords.value) {
      const base = w.word.toLowerCase()
      map.set(base, w)
      // Generate common inflections
      map.set(base + 's', w)
      map.set(base + 'es', w)
      map.set(base + 'ed', w)
      map.set(base + 'ing', w)
      map.set(base + 'ly', w)
      map.set(base + 'er', w)
      map.set(base + 'est', w)
      map.set(base + 'ment', w)
      map.set(base + 'tion', w)
      map.set(base + 'ness', w)
      if (base.endsWith('e')) {
        map.set(base.slice(0, -1) + 'ing', w)  // integrate → integrating
        map.set(base.slice(0, -1) + 'ed', w)   // integrate → integrated
        map.set(base.slice(0, -1) + 'ion', w)  // integrate → integration
      }
      if (base.endsWith('y')) {
        map.set(base.slice(0, -1) + 'ies', w)  // strategy → strategies
        map.set(base.slice(0, -1) + 'ied', w)  // modify → modified
      }
      if (base.endsWith('is')) {
        map.set(base.slice(0, -2) + 'ize', w)  // emphasis → emphasize
        map.set(base.slice(0, -2) + 'izes', w)
        map.set(base.slice(0, -2) + 'ized', w)
        map.set(base.slice(0, -2) + 'izing', w)
      }
      if (base.endsWith('le')) {
        map.set(base.slice(0, -1) + 'es', w)   // obstacle → obstacles
      }
      if (base.endsWith('or') || base.endsWith('er')) {
        map.set(base + 's', w)                  // indicator → indicators
      }
    }
    return map
  })

  // Build set of target word IDs (the B2 words linked to this passage)
  const targetWordIds = computed(() => new Set(passageWords.value.map(w => w.id)))

  const isRead = computed(() => {
    if (!passage.value) return false
    return passagesStore.isRead(passage.value.id)
  })

  const highlightedText = computed(() => {
    if (!passage.value) return ''
    const text = passage.value.text
    const sentences = splitSentences(text)
    let result = ''
    let lastEnd = 0

    for (const sentence of sentences) {
      if (sentence.start > lastEnd) {
        result += escapeHtml(text.slice(lastEnd, sentence.start))
      }
      result += `<span class="sentence" data-sentence-index="${sentence.index}">`

      const sentenceText = text.slice(sentence.start, sentence.end)
      const tokens = sentenceText.split(/([a-zA-Z'-]+)/)
      for (const token of tokens) {
        if (/^[a-zA-Z'-]+$/.test(token)) {
          const w = wordsByText.value.get(token.toLowerCase())
          if (w && targetWordIds.value.has(w.id)) {
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
      result += '</span>'
      lastEnd = sentence.end
    }

    if (lastEnd < text.length) {
      result += escapeHtml(text.slice(lastEnd))
    }
    return result
  })

  // Load passage from API when route changes
  watch(() => route.params.id, async (id) => {
    if (!id) return
    loading.value = true
    try {
      const data = await passagesApi.getPassageById(Number(id))
      passage.value = data.passage
      passageWords.value = data.words
      // Preload dictionary data (MP3 audio URLs) for all target words in background
      for (const w of data.words) {
        AudioPlayer.preload(w.word)
      }
    } catch {
      passage.value = null
      passageWords.value = []
    } finally {
      loading.value = false
    }
  }, { immediate: true })

  function onPassageClick(e: Event) {
    const target = e.target as HTMLElement

    if (target.classList.contains('highlight-word-target') || target.classList.contains('highlight-word-vocab')) {
      const wordId = Number(target.dataset.wordId)
      freeTooltipWord.value = null
      if (tooltipWordId.value === wordId) {
        tooltipWordId.value = null
      } else {
        tooltipWordId.value = wordId
      }
      return
    }

    if (target.classList.contains('plain-word')) {
      const word = target.dataset.word ?? null
      tooltipWordId.value = null
      if (freeTooltipWord.value === word) {
        freeTooltipWord.value = null
      } else {
        freeTooltipWord.value = word
      }
      return
    }

    closeTooltips()
  }

  function closeTooltips() {
    tooltipWordId.value = null
    freeTooltipWord.value = null
  }

  // Lock body scroll when tooltip is open
  const isTooltipOpen = computed(() => tooltipWordId.value !== null || freeTooltipWord.value !== null)
  watch(isTooltipOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  })

  // Bind click handler after passage content renders
  watch(passageTextRef, (el, oldEl) => {
    oldEl?.removeEventListener('click', onPassageClick)
    el?.addEventListener('click', onPassageClick)
  })

  onUnmounted(() => {
    passageTextRef.value?.removeEventListener('click', onPassageClick)
    document.body.style.overflow = ''
  })

  function markRead(router: { push: (path: string) => void }) {
    if (!passage.value) return
    passagesStore.markRead(passage.value.id)
    router.push('/reading')
  }

  return {
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
  }
}
