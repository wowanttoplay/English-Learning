import type { Word } from '@/types'
import { words as batch1 } from './words-b2-001'
import { words as batch2 } from './words-b2-002'
import { words as batch3 } from './words-b2-003'

const TOPIC_ORDER = [
  'daily-life', 'work', 'education', 'technology', 'health',
  'emotions', 'relationships', 'business', 'travel', 'communication',
  'environment', 'society', 'science', 'arts', 'law', 'politics'
]

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
  // Sort by primary topic for clustered introduction
  result.sort((a, b) => {
    const ta = TOPIC_ORDER.indexOf(a.topics?.[0] ?? '')
    const tb = TOPIC_ORDER.indexOf(b.topics?.[0] ?? '')
    return (ta === -1 ? 99 : ta) - (tb === -1 ? 99 : tb)
  })
  return result
}

export const WORD_LIST: Word[] = dedup([batch1, batch2, batch3])
