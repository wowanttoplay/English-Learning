// === CEFR Levels ===
export type CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type CefrLevel = CefrCoreLevel | 'user'

// === Topic Hierarchy ===
export type DomainId = 'life' | 'work' | 'society' | 'people' | 'knowledge'

export type SubtopicId =
  | 'work' | 'education' | 'technology' | 'health' | 'environment' | 'society'
  | 'emotions' | 'business' | 'travel' | 'communication' | 'science' | 'law'
  | 'arts' | 'daily-life' | 'relationships' | 'politics'

// === Language ===
export interface Language {
  id: string
  name: string
  nativeName: string
}

// === Word (multi-language) ===
export interface Word {
  id: number
  word: string
  pos: string
  phonetic: string
  definitionNative: string
  definitionTarget: string
  examples: string[]
  level: CefrLevel
  topics: SubtopicId[]
  languageId: string
  audioUrl?: string
}

// === Passage (multi-language) ===
export interface Passage {
  id: number
  title: string
  text: string
  level: CefrCoreLevel
  topic: SubtopicId
  genre: string
  languageId: string
  audioUrl?: string
  timestamps?: SentenceTimestamp[]
}

// === Sentence Timestamps ===
export interface SentenceTimestamp {
  index: number
  start: number
  end: number
  text: string
}

// === SRS Types ===
export interface SrsCard {
  wordId: number
  state: 'learning' | 'review' | 'relearning' | 'known'
  previousState?: 'learning' | 'review' | 'relearning'
  ease: number
  interval: number
  due: string
  dueTimestamp: number
  reps: number
  lapses: number
  step: number
}

export type CardState = 'unseen' | 'learning' | 'relearning' | 'review' | 'mastered' | 'known'
export type Rating = 1 | 2 | 3 | 4

export interface SrsHistory {
  reviewed: number
  learned: number
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
  totalKnown: number
  streak: number
  deckSize: number
}

export interface DueCount {
  learning: number
  review: number
  total: number
}

export interface CardQueue {
  learning: SrsCard[]
  review: SrsCard[]
  total: number
}

// === User Settings ===
export interface UserSettings {
  currentLanguage: string
  audioAutoPlay: boolean
}

// === API Response Types ===
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  code: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
