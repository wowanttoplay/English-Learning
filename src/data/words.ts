import type { Word } from '@/types'
import { ALL_WORDS } from './words/index'

const TOPIC_ORDER = [
  'daily-life', 'work', 'education', 'technology', 'health',
  'emotions', 'relationships', 'business', 'travel', 'communication',
  'environment', 'society', 'science', 'arts', 'law', 'politics'
]

// Deduplicate by word string (case-insensitive) — earlier entries take priority
function dedup(words: Word[]): Word[] {
  const seen = new Set<string>()
  const result: Word[] = []
  for (const w of words) {
    const key = w.word.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(w)
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

export const WORD_LIST: Word[] = dedup(ALL_WORDS)
