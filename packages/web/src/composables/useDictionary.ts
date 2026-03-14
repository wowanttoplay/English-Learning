import { DictAPI } from '@/lib/dict-api'

export function useDictionary() {
  function fetchDictData(word: string, lang: string = 'en'): Promise<void> {
    if (!DictAPI.getCached(word, lang)) {
      return DictAPI.lookup(word, lang).then(() => {})
    }
    return Promise.resolve()
  }

  function getDictCached(word: string, lang: string = 'en') {
    return DictAPI.getCached(word, lang)
  }

  function clearCache(lang?: string): void {
    DictAPI.clearCache(lang)
  }

  return {
    fetchDictData,
    getDictCached,
    clearCache
  }
}
