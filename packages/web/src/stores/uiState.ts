import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStateStore = defineStore('uiState', () => {
  const modalWordId = ref<number | null>(null)

  function openModal(wordId: number) {
    modalWordId.value = wordId
  }

  function closeModal() {
    modalWordId.value = null
  }

  return {
    modalWordId,
    openModal,
    closeModal
  }
})
