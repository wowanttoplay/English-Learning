import type { Word, TopicEntry } from '@/types'

const byId = new Map<number, Word>()
const byText = new Map<string, Word>()
const byTopic: Record<string, Word[]> = {}

function build(wordList: Word[]): void {
  byId.clear()
  byText.clear()
  for (const key in byTopic) delete byTopic[key]

  for (const word of wordList) {
    byId.set(word.id, word)
    byText.set(word.word.toLowerCase(), word)
    if (word.topics) {
      for (const t of word.topics) {
        if (!byTopic[t]) byTopic[t] = []
        byTopic[t].push(word)
      }
    }
  }
}

function get(id: number): Word | null {
  return byId.get(id) || null
}

function getByText(text: string): Word | null {
  return byText.get(text.toLowerCase()) || null
}

function getByTopic(topicId: string): Word[] {
  return byTopic[topicId] || []
}

function addWord(word: Word): void {
  if (byId.has(word.id)) return
  byId.set(word.id, word)
  byText.set(word.word.toLowerCase(), word)
  if (word.topics) {
    for (const t of word.topics) {
      if (!byTopic[t]) byTopic[t] = []
      if (!byTopic[t].some(w => w.id === word.id)) {
        byTopic[t].push(word)
      }
    }
  }
}

function getAllTopicCounts(registry: TopicEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const topic of registry) {
    counts[topic.id] = (byTopic[topic.id] || []).length
  }
  return counts
}

export const WordIndex = {
  build,
  get,
  getByText,
  getByTopic,
  getAllTopicCounts,
  addWord
}
