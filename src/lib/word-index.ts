import type { Word, TopicEntry } from '@/types'

const byId = new Map<number, Word>()
const byTopic: Record<string, Word[]> = {}

function build(wordList: Word[]): void {
  byId.clear()
  for (const key in byTopic) delete byTopic[key]

  for (const word of wordList) {
    byId.set(word.id, word)
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

function getByTopic(topicId: string): Word[] {
  return byTopic[topicId] || []
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
  getByTopic,
  getAllTopicCounts
}
