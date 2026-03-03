<template>
  <div class="fade-in">
    <div class="header">
      <h1>Reading</h1>
    </div>

    <template v-if="!hasPassages">
      <div class="reading-empty">
        <div class="reading-empty-icon">&#128214;</div>
        <h3>No passages available yet</h3>
        <p>Passages will appear here as content is added.</p>
      </div>
    </template>

    <template v-else>
      <template v-if="readyPassages.length > 0">
        <div class="reading-section-title">Available to Read</div>
        <div class="passage-list">
          <div
            v-for="{ passage, coverage } in readyPassages"
            :key="passage.id"
            class="passage-item"
            @click="router.push('/reading/' + passage.id)"
          >
            <div class="passage-item-info">
              <div class="passage-item-title">{{ passage.title }}</div>
              <div class="passage-item-meta">
                <span class="passage-topic">{{ formatTopic(passage.topic) }}</span>
                <span class="passage-level">{{ passage.level }}</span>
                <span class="passage-words">{{ passage.wordIds.length }} target words</span>
              </div>
            </div>
            <div class="passage-coverage">
              <div class="passage-coverage-bar">
                <div class="passage-coverage-fill" :style="{ width: Math.round(coverage * 100) + '%' }"></div>
              </div>
              <span class="passage-coverage-text">{{ Math.round(coverage * 100) }}%</span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="completedPassages.length > 0">
        <div class="reading-section-title" style="margin-top: 24px">Completed</div>
        <div class="passage-list">
          <div
            v-for="p in completedPassages"
            :key="p.id"
            class="passage-item completed"
            @click="router.push('/reading/' + p.id)"
          >
            <div class="passage-item-info">
              <div class="passage-item-title">{{ p.title }}</div>
              <div class="passage-item-meta">
                <span class="passage-topic">{{ formatTopic(p.topic) }}</span>
                <span class="passage-level">{{ p.level }}</span>
              </div>
            </div>
            <span class="passage-done-badge">&#10003; Read</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSrsStore } from '@/stores/srs'
import { PASSAGES } from '@/data/passages'
import { usePassages } from '@/composables/usePassages'
import { formatTopic } from '@/lib/format'
import type { Passage } from '@/types'

const router = useRouter()
const srsStore = useSrsStore()
const passages = usePassages()

const hasPassages = PASSAGES.length > 0

const readyPassages = computed(() => {
  const states = srsStore.getAllCardStates()
  const learnedIds = new Set<number>()
  for (const id in states) {
    if (states[id] !== 'unseen') learnedIds.add(Number(id))
  }
  const readSet = new Set(passages.passagesRead.value)

  const ready: { passage: Passage; coverage: number }[] = []
  for (const p of PASSAGES) {
    if (readSet.has(p.id)) continue
    if (!p.wordIds || p.wordIds.length === 0) continue
    let known = 0
    for (const wid of p.wordIds) {
      if (learnedIds.has(wid)) known++
    }
    const coverage = known / p.wordIds.length
    ready.push({ passage: p, coverage })
  }
  ready.sort((a, b) => b.coverage - a.coverage)
  return ready
})

const completedPassages = computed(() => {
  const readSet = new Set(passages.passagesRead.value)
  return PASSAGES.filter(p => readSet.has(p.id))
})
</script>
