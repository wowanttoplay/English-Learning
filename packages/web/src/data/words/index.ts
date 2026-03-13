import type { Word } from '@/types'
import b2Words from './b2.json'

// Type guard to validate word structure at import time
function asWords(data: unknown[]): Word[] {
  return data as Word[]
}

// Future: import a1Words from './a1.json', etc.

export const ALL_WORDS: Word[] = [
  ...asWords(b2Words),
]
