export interface Word {
  id: number
  word: string
  pos: string
  phonetic: string
  zh: string
  en: string
  examples: string[]
  level: string
  topics?: string[]
}

export interface TopicEntry {
  id: string
  name: string
  emoji: string
}

export interface Passage {
  id: number
  title: string
  text: string
  wordIds: number[]
  level: string
  topic: string
}

export interface SrsCard {
  wordId: number
  state: 'new' | 'learning' | 'review' | 'relearning'
  ease: number
  interval: number
  due: string
  dueTimestamp: number
  reps: number
  lapses: number
  step: number
}

export interface SrsHistory {
  reviewed: number
  learned: number
}

export interface SrsSettings {
  newCardsPerDay: number
  currentPosition: number
  activeTopics: string[]
}

export interface SrsData {
  cards: Record<string, SrsCard>
  settings: SrsSettings
  history: Record<string, SrsHistory>
}

export interface SrsStats {
  todayReviewed: number
  todayLearned: number
  totalWords: number
  totalStarted: number
  unseenWords: number
  totalLearning: number
  totalReview: number
  totalMastered: number
  streak: number
  newCardsPerDay: number
}

export interface DueCount {
  learning: number
  review: number
  new: number
  total: number
}

export interface CardQueue {
  learning: SrsCard[]
  review: SrsCard[]
  new: SrsCard[]
  total: number
}

export type CardState = 'unseen' | 'new' | 'learning' | 'relearning' | 'review' | 'mastered'
export type Rating = 1 | 2 | 3 | 4

export interface DictPhonetic {
  text: string
  audio: string | null
}

export interface DictDefinition {
  definition: string
  example: string | null
}

export interface DictMeaning {
  partOfSpeech: string
  definitions: DictDefinition[]
}

export interface DictEntry {
  word: string
  phonetics: DictPhonetic[]
  meanings: DictMeaning[]
}

export interface AudioSettings {
  autoPlay: boolean
}
