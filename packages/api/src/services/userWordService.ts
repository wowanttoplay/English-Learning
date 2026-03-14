import { createNewCard, today, EASE_MULTIPLIER } from '@english-learning/shared'
import type { Word } from '@english-learning/shared'
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
  const wordResult = await db
    .prepare(`INSERT INTO words (language_id, word, pos, phonetic, definition_native, definition_target, examples, level, topics)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'user', ?)
      RETURNING id`)
    .bind(
      data.languageId,
      data.word,
      data.pos ?? null,
      data.phonetic ?? null,
      data.definitionNative ?? null,
      data.definitionTarget ?? null,
      JSON.stringify(data.examples ?? []),
      JSON.stringify(data.topics ?? [])
    )
    .first<{ id: number }>()

  if (!wordResult) {
    throw new Error('Failed to create word')
  }

  const wordId = wordResult.id

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
    topics: (data.topics ?? []) as any,
    languageId: data.languageId,
  }
}
