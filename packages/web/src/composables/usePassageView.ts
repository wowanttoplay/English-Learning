import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePassagesStore } from '@/stores/passages'
import { useSettingsStore } from '@/stores/settings'
import * as passagesApi from '@/api/passages'
import { getWordPattern } from '@/lib/sentence-splitter'
import { AudioPlayer } from '@/lib/audio'
import type { Passage, Word } from '@/types'
import { useInflectionMatcher } from '@/composables/useInflectionMatcher'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function usePassageView() {
  const route = useRoute()
  const passagesStore = usePassagesStore()
  const settingsStore = useSettingsStore()

  const passageTextRef = ref<HTMLElement | null>(null)
  const tooltipWordId = ref<number | null>(null)
  const freeTooltipWord = ref<string | null>(null)
  const passage = ref<Passage | null>(null)
  const passageWords = ref<Word[]>([])
  const loading = ref(false)

  // Build inflection map using language-aware strategy
  const wordsByText = useInflectionMatcher(passageWords)

  // Build set of target word IDs (the B2 words linked to this passage)
  const targetWordIds = computed(() => new Set(passageWords.value.map(w => w.id)))

  const isRead = computed(() => {
    if (!passage.value) return false
    return passagesStore.isRead(passage.value.id)
  })

  const highlightedTurns = computed(() => {
    const p = passage.value
    if (!p || !p.turns) return []

    return p.turns.map(turn => {
      const tokens = turn.text.split(getWordPattern())
      let html = ''

      for (const token of tokens) {
        if (/^[a-zA-ZÀ-ÿ'-]+$/.test(token)) {
          const w = wordsByText.value.get(token.toLowerCase())
          if (w && targetWordIds.value.has(w.id)) {
            html += `<span class="highlight-word-target" data-word-id="${w.id}">${escapeHtml(token)}</span>`
          } else if (w) {
            html += `<span class="highlight-word-vocab" data-word-id="${w.id}">${escapeHtml(token)}</span>`
          } else {
            html += `<span class="plain-word" data-word="${escapeHtml(token.toLowerCase())}">${escapeHtml(token)}</span>`
          }
        } else {
          html += escapeHtml(token)
        }
      }
      return html
    })
  })

  const turnUrls = computed(() => {
    const p = passage.value
    if (!p) return []
    const base = import.meta.env.VITE_AUDIO_BASE_URL || (import.meta.env.BASE_URL + 'audio')
    return p.turns.map((_, i) => `${base}/passages/passage-${p.id}-turn-${i}.mp3`)
  })

  const fallbackText = computed(() => {
    const p = passage.value
    if (!p) return ''
    return p.turns.map(t => t.text).join(' ')
  })

  // Load passage from API when route changes
  watch(() => route.params.id, async (id) => {
    if (!id) return
    loading.value = true
    try {
      const data = await passagesApi.getPassageById(Number(id), settingsStore.settings.selectedLocales)
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
    highlightedTurns,
    turnUrls,
    fallbackText,
    loading,
    closeTooltips,
    markRead
  }
}
