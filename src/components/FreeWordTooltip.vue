<template>
  <div v-if="word" class="reading-tooltip free-word-tooltip" @click.stop>
    <div class="reading-tooltip-close" @click="emit('close')">&#10005;</div>

    <!-- Loading state -->
    <div v-if="loading" class="free-tooltip-loading">
      <span class="free-tooltip-spinner"></span>
      Looking up <em>{{ word }}</em>...
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="free-tooltip-notfound">
      <div class="reading-tooltip-word">{{ word }}</div>
      <div class="free-tooltip-notfound-msg">No definition found.</div>
      <a :href="searchUrl" target="_blank" rel="noopener" class="free-tooltip-search">
        Search on Google &rarr;
      </a>
    </div>

    <!-- Found state -->
    <template v-else-if="dictEntry">
      <div class="reading-tooltip-word">
        {{ dictEntry.word }}
        <span v-if="firstPos" class="reading-tooltip-pos">{{ firstPos }}</span>
      </div>
      <div v-if="firstPhonetic" class="reading-tooltip-phonetic">
        {{ firstPhonetic.text }}
        <button class="example-play-btn" @click="playWord" title="Play">&#9654;</button>
      </div>
      <div v-for="(def, i) in firstDefinitions" :key="i" class="reading-tooltip-en free-tooltip-def">
        {{ def.definition }}
        <div v-if="def.example" class="free-tooltip-example">"{{ def.example }}"</div>
      </div>
      <a :href="searchUrl" target="_blank" rel="noopener" class="free-tooltip-search">
        More on Google &rarr;
      </a>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DictAPI } from '@/lib/dict-api'
import { useAudio } from '@/composables/useAudio'
import type { DictEntry } from '@/types'

const props = defineProps<{ word: string | null }>()
const emit = defineEmits<{ close: [] }>()

const audio = useAudio()
const dictEntry = ref<DictEntry | null>(null)
const loading = ref(false)
const notFound = ref(false)

const firstPhonetic = computed(() => {
  if (!dictEntry.value) return null
  return dictEntry.value.phonetics.find(p => p.text) ?? null
})

const firstPos = computed(() => {
  if (!dictEntry.value || dictEntry.value.meanings.length === 0) return null
  return dictEntry.value.meanings[0].partOfSpeech
})

const firstDefinitions = computed(() => {
  if (!dictEntry.value || dictEntry.value.meanings.length === 0) return []
  return dictEntry.value.meanings[0].definitions.slice(0, 2)
})

const searchUrl = computed(() => {
  if (!props.word) return ''
  return `https://www.google.com/search?q=define+${encodeURIComponent(props.word)}`
})

function playWord() {
  if (props.word) audio.speak(props.word)
}

watch(
  () => props.word,
  async (newWord) => {
    if (!newWord) {
      dictEntry.value = null
      loading.value = false
      notFound.value = false
      return
    }

    // Check cache first — no loading flicker for previously looked-up words
    const cached = DictAPI.getCached(newWord)
    if (cached) {
      dictEntry.value = cached
      loading.value = false
      notFound.value = false
      return
    }

    loading.value = true
    notFound.value = false
    dictEntry.value = null

    const result = await DictAPI.lookup(newWord)
    loading.value = false
    if (result) {
      dictEntry.value = result
      notFound.value = false
    } else {
      notFound.value = true
    }
  },
  { immediate: true }
)
</script>
