import { DictAPI } from '@/lib/dict-api'

export function useDictionary() {
  function fetchDictData(word: string): Promise<void> {
    if (!DictAPI.getCached(word)) {
      return DictAPI.lookup(word).then(() => {})
    }
    return Promise.resolve()
  }

  function getDictCached(word: string) {
    return DictAPI.getCached(word)
  }

  function clearCache(): void {
    DictAPI.clearCache()
  }

  return {
    fetchDictData,
    getDictCached,
    clearCache
  }
}
