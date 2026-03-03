import type { SrsCard, SrsData, CardState } from '@/types'
import { MASTERED_INTERVAL } from './srs-engine'
import { Storage } from './storage'

const NEW_CARDS_PER_DAY = 20

// --- Cache ---

let _cache: SrsData | null = null

export function loadData(): SrsData {
  return Storage.loadSrsData({
    cards: {},
    settings: { newCardsPerDay: NEW_CARDS_PER_DAY, currentPosition: 0, activeTopics: [] },
    history: {}
  })
}

function readData(): SrsData {
  if (!_cache) {
    _cache = loadData()
  }
  return _cache
}

export function peekData(): SrsData {
  return readData()
}

export function withData<T>(fn: (data: SrsData) => T): T {
  const data = readData()
  const result = fn(data)
  Storage.saveSrsData(data)
  return result
}

// --- Card access ---

export function getCard(wordId: number): SrsCard | null {
  const data = readData()
  return data.cards[wordId] || null
}

// --- Card state queries ---

export function getCardState(wordId: number): CardState {
  const card = getCard(wordId)
  if (!card) return 'unseen'
  if (card.state === 'review' && card.interval >= MASTERED_INTERVAL) return 'mastered'
  return card.state
}

export function getAllCardStates(): Record<string, CardState> {
  const data = readData()
  const states: Record<string, CardState> = {}
  for (const id in data.cards) {
    const card = data.cards[id]
    if (card.state === 'review' && card.interval >= MASTERED_INTERVAL) {
      states[id] = 'mastered'
    } else {
      states[id] = card.state
    }
  }
  return states
}

// --- Settings ---

export function setNewCardsPerDay(count: number): void {
  withData(data => {
    data.settings.newCardsPerDay = count
  })
}

export function setActiveTopics(topicIds: string[]): void {
  withData(data => {
    data.settings.activeTopics = topicIds || []
  })
}

export function getActiveTopics(): string[] {
  const data = readData()
  return data.settings.activeTopics || []
}

export function resetProgress(): void {
  _cache = null
  Storage.removeSrsData()
}

export function clearCache(): void {
  _cache = null
}

// --- History ---

export function getHistory(): Record<string, { reviewed: number; learned: number }> {
  return readData().history
}
