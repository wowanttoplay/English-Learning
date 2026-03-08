export type CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type CefrLevel = CefrCoreLevel | 'user'

export type DomainId = 'life' | 'work' | 'society' | 'people' | 'knowledge'

export type SubtopicId =
  | 'work' | 'education' | 'technology' | 'health' | 'environment' | 'society'
  | 'emotions' | 'business' | 'travel' | 'communication' | 'science' | 'law'
  | 'arts' | 'daily-life' | 'relationships' | 'politics'

export interface Domain {
  id: DomainId
  name: string
  emoji: string
}

export interface Subtopic {
  id: SubtopicId
  name: string
  emoji: string
  domainId: DomainId
}

export interface Word {
  id: number
  word: string
  pos: string
  phonetic: string
  zh: string
  en: string
  examples: string[]
  level: CefrLevel
  topics?: SubtopicId[]
}

// Backward compatibility alias
export type TopicEntry = Subtopic

export interface Passage {
  id: number
  title: string
  text: string
  wordIds: number[]
  level: CefrCoreLevel
  topic: SubtopicId
  genre?: 'news' | 'essay' | 'travel' | 'opinion' | 'story' | 'interview' | 'explainer'
}

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

export interface SrsHistory {
  reviewed: number
  learned: number
  passagesRead?: number
}

export interface SrsSettings {
  userAddedWords?: number[]
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

export type CardState = 'unseen' | 'learning' | 'relearning' | 'review' | 'mastered' | 'known'
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
