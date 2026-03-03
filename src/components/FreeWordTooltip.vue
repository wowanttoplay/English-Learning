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
      <button v-if="!saved && !alreadySaved" class="btn btn-primary reading-tooltip-add" @click="saveToDeck">Save to Deck</button>
      <div v-if="saved" class="reading-tooltip-state saved">Saved to Deck!</div>
      <div v-if="alreadySaved && !saved" class="reading-tooltip-state">Already in Deck</div>
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
import { useSrsStore } from '@/stores/srs'
import { isUserWord } from '@/lib/user-words'
import type { DictEntry, Word } from '@/types'

const props = defineProps<{ word: string | null }>()
const emit = defineEmits<{ close: [] }>()

const audio = useAudio()
const srsStore = useSrsStore()
const dictEntry = ref<DictEntry | null>(null)
const loading = ref(false)
const notFound = ref(false)
const saved = ref(false)
const alreadySaved = ref(false)

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

function saveToDeck() {
  if (!dictEntry.value || !props.word) return
  const firstMeaning = dictEntry.value.meanings[0]
  const firstDef = firstMeaning?.definitions[0]?.definition ?? ''
  const examples: string[] = []
  for (const meaning of dictEntry.value.meanings) {
    for (const def of meaning.definitions) {
      if (def.example && examples.length < 2) examples.push(def.example)
    }
  }
  const wordData: Omit<Word, 'id'> = {
    word: dictEntry.value.word,
    pos: firstMeaning?.partOfSpeech ?? '',
    phonetic: firstPhonetic.value?.text ?? '',
    zh: '',
    en: firstDef,
    examples,
    level: 'user',
    topics: []
  }
  srsStore.addUserWordFromFreeTooltip(wordData)
  saved.value = true
}

watch(
  () => props.word,
  async (newWord) => {
    saved.value = false
    alreadySaved.value = newWord ? isUserWord(newWord) : false

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
      alreadySaved.value = isUserWord(cached.word)
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
      alreadySaved.value = isUserWord(result.word)
    } else {
      notFound.value = true
    }
  },
  { immediate: true }
)
</script>
