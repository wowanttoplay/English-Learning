import type { Word } from '@/types'
import { words as batch1 } from './words-b2-001'
import { words as batch2 } from './words-b2-002'
import { words as batch3 } from './words-b2-003'

// Deduplicate by word string — earlier batches take priority
function dedup(batches: Word[][]): Word[] {
  const seen = new Set<string>()
  const result: Word[] = []
  for (const batch of batches) {
    for (const w of batch) {
      if (!seen.has(w.word)) {
        seen.add(w.word)
        result.push(w)
      }
    }
  }
  return result
}

export const WORD_LIST: Word[] = dedup([batch1, batch2, batch3])
