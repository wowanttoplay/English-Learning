import { ref } from 'vue'
import { Storage } from '@/lib/storage'

export function usePassages() {
  const passagesRead = ref<number[]>(Storage.getPassagesRead())

  function isRead(id: number): boolean {
    return passagesRead.value.includes(id)
  }

  function markRead(id: number): void {
    Storage.markPassageRead(id)
    if (!passagesRead.value.includes(id)) {
      passagesRead.value = [...passagesRead.value, id]
    }
  }

  return {
    passagesRead,
    isRead,
    markRead,
  }
}
