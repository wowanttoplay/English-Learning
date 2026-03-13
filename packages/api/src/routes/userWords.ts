import { Hono } from 'hono'
import type { Env } from '../env'
import { getUserWords, insertUserWordStatement, getLastInsertedUserWord } from '../db/queries/userWords'
import { upsertCardStatement } from '../db/queries/cards'
import { incrementLearnedStatement } from '../db/queries/history'
import { createNewCard, today } from '@english-learning/shared'

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

  // Insert user word, then look it up to get the auto-assigned ID
  await c.env.DB.batch([
    insertUserWordStatement(c.env.DB, userId, data),
  ])

  const created = await getLastInsertedUserWord(c.env.DB, userId, data.languageId, data.word)
  if (!created) return c.json({ error: 'Failed to create word', code: 'CREATE_FAILED' }, 500)

  // Now create the SRS card for this user word
  const EASE_MULTIPLIER = 1000
  const card = createNewCard(created.id)
  const dbCard = { ...card, ease: Math.round(card.ease * EASE_MULTIPLIER) }
  const dateStr = today()

  await c.env.DB.batch([
    upsertCardStatement(c.env.DB, userId, dbCard),
    incrementLearnedStatement(c.env.DB, userId, dateStr),
  ])

  return c.json(created, 201)
})

export default userWords
