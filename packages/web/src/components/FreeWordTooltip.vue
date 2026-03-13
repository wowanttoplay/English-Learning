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
import { useFreeWordLookup } from '@/composables/useFreeWordLookup'

const props = defineProps<{ word: string | null }>()
const emit = defineEmits<{ close: [] }>()

const {
  dictEntry,
  loading,
  notFound,
  saved,
  alreadySaved,
  firstPhonetic,
  firstPos,
  firstDefinitions,
  searchUrl,
  playWord,
  saveToDeck
} = useFreeWordLookup(() => props.word)
</script>
