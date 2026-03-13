import type { Word } from '@/types'
import { Storage } from './storage'
import { WordIndex } from './word-index'

export const USER_WORD_ID_START = 100000

// --- In-memory cache ---

let _cache: Word[] | null = null

export function loadUserWords(): Word[] {
  if (_cache) return _cache
  _cache = Storage.loadUserWords()
  return _cache
}

export function saveUserWord(wordData: Omit<Word, 'id'>): Word | null {
  const existing = loadUserWords()
  if (existing.some(w => w.word.toLowerCase() === wordData.word.toLowerCase())) return null
  const id = existing.length === 0
    ? USER_WORD_ID_START + 1
    : Math.max(...existing.map(w => w.id)) + 1
  const word: Word = { ...wordData, id }
  existing.push(word)
  Storage.saveUserWords(existing)
  _cache = existing
  WordIndex.addWord(word)
  return word
}

export function isUserWord(wordText: string): boolean {
  const existing = loadUserWords()
  return existing.some(w => w.word.toLowerCase() === wordText.toLowerCase())
}

export function clearUserWordsCache(): void {
  _cache = null
}

export function resetUserWords(): void {
  Storage.removeUserWords()
  _cache = null
}
