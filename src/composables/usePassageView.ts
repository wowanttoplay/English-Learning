import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { WordIndex } from '@/lib/word-index'
import { usePassages } from '@/composables/usePassages'
import { PASSAGES } from '@/data/passages'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function usePassageView() {
  const route = useRoute()
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

  onMounted(() => {
    passageTextRef.value?.addEventListener('click', onPassageClick)
  })

  onUnmounted(() => {
    passageTextRef.value?.removeEventListener('click', onPassageClick)
    document.body.style.overflow = ''
  })

  function markRead(router: { push: (path: string) => void }) {
    if (!passage.value) return
    passages.markRead(passage.value.id)
    router.push('/reading')
  }

  return {
    passage,
    passageTextRef,
    tooltipWordId,
    freeTooltipWord,
    isRead,
    highlightedText,
    closeTooltips,
    markRead
  }
}
