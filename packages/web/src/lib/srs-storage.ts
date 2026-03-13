import type { SrsCard, SrsData, CardState } from '@/types'
import { DEFAULT_EASE, MASTERED_INTERVAL, today, now } from './srs-engine'
import { Storage } from './storage'

// --- Cache ---

let _cache: SrsData | null = null

export function loadData(): SrsData {
  const data = Storage.loadSrsData({
    cards: {},
    settings: { userAddedWords: [] },
    history: {}
  })
  // Migration: promote any legacy 'new' cards to 'learning'
  for (const id in data.cards) {
    if ((data.cards[id].state as string) === 'new') {
      data.cards[id].state = 'learning'
    }
  }
  return data
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
  if (card.state === 'known') return 'known'
  if (card.state === 'review' && card.interval >= MASTERED_INTERVAL) return 'mastered'
  return card.state
}

export function getAllCardStates(): Record<string, CardState> {
  const data = readData()
  const states: Record<string, CardState> = {}
  for (const id in data.cards) {
    const card = data.cards[id]
    if (card.state === 'known') {
      states[id] = 'known'
    } else if (card.state === 'review' && card.interval >= MASTERED_INTERVAL) {
      states[id] = 'mastered'
    } else {
      states[id] = card.state
    }
  }
  return states
}

// --- Settings ---

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

export function addUserWord(wordId: number): void {
  withData(data => {
    if (data.cards[wordId]) return // already in deck
    const todayStr = today()
    data.cards[wordId] = {
      wordId,
      state: 'learning',
      ease: DEFAULT_EASE,
      interval: 0,
      due: todayStr,
      dueTimestamp: now(),
      reps: 0,
      lapses: 0,
      step: 0
    }
    if (!data.history[todayStr]) {
      data.history[todayStr] = { reviewed: 0, learned: 0 }
    }
    data.history[todayStr].learned++
  })
}

// --- Mark as Known ---

export function markAsKnown(wordId: number): void {
  withData(data => {
    const card = data.cards[wordId]
    if (card) {
      if (card.state === 'known') return // already known
      if (card.state === 'learning' || card.state === 'review' || card.state === 'relearning') {
        card.previousState = card.state
      }
      card.state = 'known'
    } else {
      data.cards[wordId] = {
        wordId,
        state: 'known',
        ease: DEFAULT_EASE,
        interval: 0,
        due: today(),
        dueTimestamp: now(),
        reps: 0,
        lapses: 0,
        step: 0
      }
    }
  })
}

export function unmarkKnown(wordId: number): void {
  withData(data => {
    const card = data.cards[wordId]
    if (!card || card.state !== 'known') return
    if (card.previousState) {
      card.state = card.previousState
      delete card.previousState
    } else {
      delete data.cards[wordId]
    }
  })
}
