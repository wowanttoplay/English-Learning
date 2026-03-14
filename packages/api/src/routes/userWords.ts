import { Hono } from 'hono'
import type { Env } from '../env'
import { getUserWords, insertUserWordStatement, getLastInsertedUserWord } from '../db/queries/userWords'
import { upsertCardStatement } from '../db/queries/cards'
import { incrementLearnedStatement } from '../db/queries/history'
import { createNewCard, today } from '@english-learning/shared'

const EASE_MULTIPLIER = 1000

const userWords = new Hono<{ Bindings: Env }>()

// GET /api/user-words?lang=en
userWords.get('/', async (c) => {
  const userId = c.get('userId')
  const lang = c.req.query('lang') ?? 'en'
  const words = await getUserWords(c.env.DB, userId, lang)
  return c.json({ items: words })
})

// POST /api/user-words — create user word + SRS card atomically
userWords.post('/', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  if (!data.word || !data.languageId) {
    return c.json({ error: 'word and languageId required', code: 'MISSING_FIELD' }, 400)
  }

  // Insert into the main words table (level='user') so the ID doesn't collide
  // with user_words table IDs. This way the SRS card word_id correctly references words.id.
  const wordResult = await c.env.DB
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

  if (!wordResult) return c.json({ error: 'Failed to create word', code: 'CREATE_FAILED' }, 500)

  const wordId = wordResult.id

  // Also track in user_words for per-user ownership
  await c.env.DB.batch([
    insertUserWordStatement(c.env.DB, userId, data),
  ])

  // Create SRS card with the words table ID (no collision)
  const card = createNewCard(wordId)
  const dbCard = { ...card, ease: Math.round(card.ease * EASE_MULTIPLIER) }
  const dateStr = today()

  await c.env.DB.batch([
    upsertCardStatement(c.env.DB, userId, dbCard),
    incrementLearnedStatement(c.env.DB, userId, dateStr),
  ])

  return c.json({
    id: wordId,
    word: data.word,
    pos: data.pos ?? '',
    phonetic: data.phonetic ?? '',
    definitionNative: data.definitionNative ?? '',
    definitionTarget: data.definitionTarget ?? '',
    examples: data.examples ?? [],
    level: 'user',
    topics: data.topics ?? [],
    languageId: data.languageId,
  }, 201)
})

export default userWords
