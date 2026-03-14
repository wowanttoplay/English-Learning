import type { TopicId } from '@english-learning/shared'
import { createNewCard, today, EASE_MULTIPLIER } from '@english-learning/shared'
import type { Word } from '@english-learning/shared'
import { insertWord } from '../db/queries/words'
import { insertUserWordStatement } from '../db/queries/userWords'
import { upsertCardStatement } from '../db/queries/cards'
import { incrementLearnedStatement } from '../db/queries/history'
import { MissingFieldError } from '../errors'

export interface CreateUserWordInput {
  word: string
  languageId: string
  pos?: string
  phonetic?: string
  definitionNative?: string
  definitionTarget?: string
  examples?: string[]
  topics?: string[]
}

export async function createUserWord(
  db: D1Database, userId: number, data: CreateUserWordInput
): Promise<Word> {
  if (!data.word || !data.languageId) {
    throw new MissingFieldError('word and languageId')
  }

  // Insert into main words table (level='user') so ID doesn't collide
  const wordId = await insertWord(db, data)

  // Track in user_words for per-user ownership
  await db.batch([
    insertUserWordStatement(db, userId, data),
  ])

  // Create SRS card
  const card = createNewCard(wordId)
  const dbCard = { ...card, ease: Math.round(card.ease * EASE_MULTIPLIER) }
  const dateStr = today()

  await db.batch([
    upsertCardStatement(db, userId, dbCard),
    incrementLearnedStatement(db, userId, dateStr),
  ])

  return {
    id: wordId,
    word: data.word,
    pos: data.pos ?? '',
    phonetic: data.phonetic ?? '',
    definitionNative: data.definitionNative ?? '',
    definitionTarget: data.definitionTarget ?? '',
    examples: data.examples ?? [],
    level: 'user',
    topics: (data.topics ?? []) as TopicId[],
    languageId: data.languageId,
  }
}
