import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Passage } from '@/types'
import * as passagesApi from '@/api/passages'

export const usePassagesStore = defineStore('passages', () => {
  const passages = ref<Passage[]>([])
  const total = ref(0)
  const passagesRead = ref<Set<number>>(new Set())
  const loading = ref(false)

  async function loadPassages(lang: string, level?: string, topic?: string) {
    loading.value = true
    try {
      const data = await passagesApi.getPassages({ lang, level, topic, pageSize: 100 })
      passages.value = data.items
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function loadPassagesRead() {
    try {
      const data = await passagesApi.getPassagesRead()
      passagesRead.value = new Set(data.items)
    } catch {
      // Not logged in — no read state
    }
  }

  function isRead(passageId: number): boolean {
    return passagesRead.value.has(passageId)
  }

  async function markRead(passageId: number) {
    passagesRead.value.add(passageId)
    await passagesApi.markPassageRead(passageId)
  }

  return { passages, total, passagesRead, loading, loadPassages, loadPassagesRead, isRead, markRead }
})
