import { describe, it, expect, beforeEach } from 'vitest'
import { WordIndex } from '@/lib/word-index'
import type { Word } from '@/types'

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 1,
    word: 'negotiate',
    pos: 'verb',
    phonetic: '/nɪˈɡəʊʃieɪt/',
    zh: '谈判',
    en: 'to try to reach an agreement',
    examples: ['Example one here.', 'Example two here.'],
    level: 'B2',
    topics: ['business'],
    ...overrides
  }
}

const sampleWords: Word[] = [
  makeWord({ id: 1, word: 'negotiate', topics: ['business', 'work'] }),
  makeWord({ id: 2, word: 'adequate', topics: ['daily-life'] }),
  makeWord({ id: 3, word: 'Significant', topics: ['science', 'education'] })
]

describe('WordIndex', () => {
  beforeEach(() => {
    WordIndex.build(sampleWords)
  })

  describe('build + get', () => {
    it('retrieves a word by ID', () => {
      const word = WordIndex.get(1)
      expect(word).not.toBeNull()
      expect(word!.word).toBe('negotiate')
    })

    it('returns null for unknown ID', () => {
      expect(WordIndex.get(999)).toBeNull()
    })
  })

  describe('getByText', () => {
    it('finds a word by text (case-insensitive)', () => {
      expect(WordIndex.getByText('negotiate')?.id).toBe(1)
      expect(WordIndex.getByText('NEGOTIATE')?.id).toBe(1)
      expect(WordIndex.getByText('Negotiate')?.id).toBe(1)
    })

    it('finds word stored with mixed case', () => {
      // 'Significant' was stored with capital S
      expect(WordIndex.getByText('significant')?.id).toBe(3)
    })

    it('returns null for unknown text', () => {
      expect(WordIndex.getByText('nonexistent')).toBeNull()
    })
  })

  describe('getByTopic', () => {
    it('returns words for a topic', () => {
      const business = WordIndex.getByTopic('business')
      expect(business).toHaveLength(1)
      expect(business[0].id).toBe(1)
    })

    it('returns empty array for unknown topic', () => {
      expect(WordIndex.getByTopic('unknown')).toEqual([])
    })

    it('indexes words with multiple topics', () => {
      expect(WordIndex.getByTopic('work')).toHaveLength(1)
      expect(WordIndex.getByTopic('business')).toHaveLength(1)
    })
  })

  describe('addWord', () => {
    it('adds a new word to all indexes', () => {
      const newWord = makeWord({ id: 100, word: 'innovate', topics: ['technology'] })
      WordIndex.addWord(newWord)

      expect(WordIndex.get(100)?.word).toBe('innovate')
      expect(WordIndex.getByText('innovate')?.id).toBe(100)
      expect(WordIndex.getByTopic('technology')).toHaveLength(1)
    })

    it('skips duplicate IDs', () => {
      const duplicate = makeWord({ id: 1, word: 'different' })
      WordIndex.addWord(duplicate)
      // Original word should remain
      expect(WordIndex.get(1)?.word).toBe('negotiate')
    })
  })

  describe('build clears previous data', () => {
    it('rebuild replaces old index', () => {
      const newWords = [makeWord({ id: 50, word: 'fresh', topics: ['daily-life'] })]
      WordIndex.build(newWords)

      expect(WordIndex.get(1)).toBeNull()
      expect(WordIndex.get(50)?.word).toBe('fresh')
      expect(WordIndex.getByTopic('business')).toEqual([])
    })
  })
})
