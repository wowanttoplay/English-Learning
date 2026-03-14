import type { DictEntry } from '@/types'

// Per-language dictionary API base URLs
// Add new providers here as languages are added
const DICT_PROVIDERS: Record<string, string> = {
  en: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  // Future: ja, es, fr, etc.
}

const DICT_CACHE_PREFIX = 'dict_cache_'
const DICT_CACHE_MAX = 500
const MIN_REQUEST_INTERVAL = 100
const memCache = new Map<string, DictEntry>()
let lastRequestTime = 0

function cacheKey(lang: string): string {
  return `${DICT_CACHE_PREFIX}${lang}`
}

function memCacheKey(word: string, lang: string): string {
  return `${lang}:${word}`
}

function loadDictCache(lang: string): Record<string, DictEntry> {
  try {
    const raw = localStorage.getItem(cacheKey(lang))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

function saveDictCache(lang: string, cache: Record<string, DictEntry>): void {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(cache))
  } catch {
    // ignore quota errors
  }
}

function rateLimitDelay(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed >= MIN_REQUEST_INTERVAL) {
    lastRequestTime = now
    return Promise.resolve()
  }
  const delay = MIN_REQUEST_INTERVAL - elapsed
  return new Promise(resolve => {
    setTimeout(() => {
      lastRequestTime = Date.now()
      resolve()
    }, delay)
  })
}

async function lookup(word: string, lang: string = 'en'): Promise<DictEntry | null> {
  const mk = memCacheKey(word, lang)
  const mem = memCache.get(mk)
  if (mem) return mem

  const cache = loadDictCache(lang)
  if (cache[word]) {
    memCache.set(mk, cache[word])
    return cache[word]
  }

  const apiBase = DICT_PROVIDERS[lang]
  if (!apiBase) return null

  try {
    await rateLimitDelay()
    const response = await fetch(apiBase + encodeURIComponent(word))
    if (!response.ok) return null

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const result: DictEntry = {
      word: entry.word,
      phonetics: [],
      meanings: []
    }

    if (entry.phonetics) {
      for (const p of entry.phonetics) {
        if (p.text) {
          result.phonetics.push({
            text: p.text,
            audio: p.audio || null
          })
        }
      }
    }

    if (entry.meanings) {
      for (const m of entry.meanings) {
        const meaning = {
          partOfSpeech: m.partOfSpeech,
          definitions: [] as { definition: string; example: string | null }[]
        }
        if (m.definitions) {
          for (const d of m.definitions.slice(0, 3)) {
            meaning.definitions.push({
              definition: d.definition,
              example: d.example || null
            })
          }
        }
        result.meanings.push(meaning)
      }
    }

    cache[word] = result
    const keys = Object.keys(cache)
    if (keys.length > DICT_CACHE_MAX) {
      const removeCount = keys.length - DICT_CACHE_MAX
      for (let i = 0; i < removeCount; i++) {
        delete cache[keys[i]]
      }
    }
    saveDictCache(lang, cache)
    memCache.set(mk, result)
    return result
  } catch (e) {
    console.warn('Dict API lookup failed for:', word, e)
    return null
  }
}

function getCached(word: string, lang: string = 'en'): DictEntry | null {
  const mk = memCacheKey(word, lang)
  const mem = memCache.get(mk)
  if (mem) return mem

  const cache = loadDictCache(lang)
  if (cache[word]) {
    memCache.set(mk, cache[word])
    return cache[word]
  }
  return null
}

function clearCache(lang?: string): void {
  if (lang) {
    // Clear specific language cache
    for (const [key] of memCache) {
      if (key.startsWith(`${lang}:`)) memCache.delete(key)
    }
    localStorage.removeItem(cacheKey(lang))
  } else {
    // Clear all language caches
    memCache.clear()
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(DICT_CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    // Also remove legacy key for migration
    localStorage.removeItem('dict_cache')
  }
}

export const DictAPI = {
  lookup,
  getCached,
  clearCache
}
