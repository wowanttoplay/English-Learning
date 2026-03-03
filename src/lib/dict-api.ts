import type { DictEntry } from '@/types'
import { Storage } from './storage'

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const memCache = new Map<string, DictEntry>()

async function lookup(word: string): Promise<DictEntry | null> {
  const mem = memCache.get(word)
  if (mem) return mem

  const cache = Storage.loadDictCache()
  if (cache[word]) {
    memCache.set(word, cache[word])
    return cache[word]
  }

  try {
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
    Storage.saveDictCache(cache)
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

  const cache = Storage.loadDictCache()
  if (cache[word]) {
    memCache.set(word, cache[word])
    return cache[word]
  }
  return null
}

function clearCache(): void {
  memCache.clear()
  Storage.removeDictCache()
}

export const DictAPI = {
  lookup,
  getCached,
  clearCache
}
