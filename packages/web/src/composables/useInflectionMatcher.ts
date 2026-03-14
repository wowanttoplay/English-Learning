import { computed, type Ref } from 'vue'
import type { Word } from '@/types'

// English-specific suffix table — add per-language strategies as needed
// CJK languages will need morphological analysis (e.g., kuromoji for Japanese)

type InflectionStrategy = (words: Word[]) => Map<string, Word>

const englishInflections: InflectionStrategy = (words) => {
  const map = new Map<string, Word>()
  for (const w of words) {
    const base = w.word.toLowerCase()
    map.set(base, w)
    // Regular inflections
    map.set(base + 's', w)
    map.set(base + 'es', w)
    map.set(base + 'ed', w)
    map.set(base + 'ing', w)
    map.set(base + 'ly', w)
    map.set(base + 'er', w)
    map.set(base + 'est', w)
    map.set(base + 'ment', w)
    map.set(base + 'tion', w)
    map.set(base + 'ness', w)
    // -e drop: integrate → integrating, integrated, integration
    if (base.endsWith('e')) {
      map.set(base.slice(0, -1) + 'ing', w)
      map.set(base.slice(0, -1) + 'ed', w)
      map.set(base.slice(0, -1) + 'ion', w)
    }
    // -y to -ies/-ied: strategy → strategies, modify → modified
    if (base.endsWith('y')) {
      map.set(base.slice(0, -1) + 'ies', w)
      map.set(base.slice(0, -1) + 'ied', w)
    }
    // -is to -ize: emphasis → emphasize/emphasizes/emphasized/emphasizing
    if (base.endsWith('is')) {
      map.set(base.slice(0, -2) + 'ize', w)
      map.set(base.slice(0, -2) + 'izes', w)
      map.set(base.slice(0, -2) + 'ized', w)
      map.set(base.slice(0, -2) + 'izing', w)
    }
    // -le to -les: obstacle → obstacles
    if (base.endsWith('le')) {
      map.set(base.slice(0, -1) + 'es', w)
    }
    // -or/-er plurals: indicator → indicators
    if (base.endsWith('or') || base.endsWith('er')) {
      map.set(base + 's', w)
    }
  }
  return map
}

const strategies: Record<string, InflectionStrategy> = {
  en: englishInflections,
  // Future: ja, es, fr, de, etc.
}

export function useInflectionMatcher(words: Ref<Word[]>, lang: string = 'en') {
  return computed(() => {
    const strategy = strategies[lang] ?? strategies.en
    return strategy(words.value)
  })
}
