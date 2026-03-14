// Re-export all shared types
export * from '@english-learning/shared'
import type { DomainId, TopicId } from '@english-learning/shared'

// Web-only types (dictionary API)
export interface DictPhonetic { text: string; audio: string | null }
export interface DictDefinition { definition: string; example: string | null }
export interface DictMeaning { partOfSpeech: string; definitions: DictDefinition[] }
export interface DictEntry { word: string; phonetics: DictPhonetic[]; meanings: DictMeaning[] }
export interface AudioSettings { autoPlay: boolean }

// Web-only display types
export interface Domain { id: DomainId; name: string; emoji: string }
export interface Subtopic { id: TopicId; name: string; emoji: string; domainId: DomainId }
