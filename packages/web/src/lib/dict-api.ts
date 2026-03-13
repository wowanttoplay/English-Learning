import type { DictEntry } from '@/types'

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const DICT_CACHE_KEY = 'dict_cache'
const DICT_CACHE_MAX = 500
const MIN_REQUEST_INTERVAL = 100
const memCache = new Map<string, DictEntry>()
let lastRequestTime = 0

function loadDictCache(): Record<string, DictEntry> {
  try {
    const raw = localStorage.getItem(DICT_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

function saveDictCache(cache: Record<string, DictEntry>): void {
  try {
    localStorage.setItem(DICT_CACHE_KEY, JSON.stringify(cache))
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

async function lookup(word: string): Promise<DictEntry | null> {
  const mem = memCache.get(word)
  if (mem) return mem

  const cache = loadDictCache()
  if (cache[word]) {
    memCache.set(word, cache[word])
    return cache[word]
  }

  try {
    await rateLimitDelay()
    const response = await fetch(API_BASE + encodeURIComponent(word))
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
    saveDictCache(cache)
    memCache.set(word, result)
    return result
  } catch (e) {
    console.warn('Dict API lookup failed for:', word, e)
    return null
  }
}

function getCached(word: string): DictEntry | null {
  const mem = memCache.get(word)
  if (mem) return mem

  const cache = loadDictCache()
  if (cache[word]) {
    memCache.set(word, cache[word])
    return cache[word]
  }
  return null
}

function clearCache(): void {
  memCache.clear()
  localStorage.removeItem(DICT_CACHE_KEY)
}

export const DictAPI = {
  lookup,
  getCached,
  clearCache
}
