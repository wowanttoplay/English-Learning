import { Hono } from 'hono'
import type { Env } from '../env'
import type { Rating } from '@english-learning/shared'
import { getAllCardsWithStats, addCard, rateCardAction, markKnownAction } from '../services/cardService'

const cards = new Hono<{ Bindings: Env }>()

// GET /api/cards — all cards, queue, stats, history for user
cards.get('/', async (c) => {
  const userId = c.get('userId')
  // totalWords count for stats — count words in user's current language
  const lang = c.req.query('lang') ?? 'en'
  const countResult = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM words WHERE language_id = ?')
    .bind(lang)
    .first<{ total: number }>()
  const totalWords = countResult?.total ?? 0

  const result = await getAllCardsWithStats(c.env.DB, userId, totalWords)
  return c.json(result)
})

// POST /api/cards/add — add a word to the deck
cards.post('/add', async (c) => {
  const { wordId } = await c.req.json<{ wordId: number }>()
  if (!wordId) return c.json({ error: 'wordId required', code: 'MISSING_FIELD' }, 400)

  const userId = c.get('userId')
  const card = await addCard(c.env.DB, userId, wordId)
  return c.json(card)
})

// POST /api/cards/rate — rate a card
cards.post('/rate', async (c) => {
  const { wordId, rating } = await c.req.json<{ wordId: number; rating: Rating }>()
  if (!wordId || !rating) return c.json({ error: 'wordId and rating required', code: 'MISSING_FIELD' }, 400)

  const userId = c.get('userId')
  try {
    const card = await rateCardAction(c.env.DB, userId, wordId, rating)
    return c.json(card)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('known')) {
      return c.json({ error: msg, code: 'CARD_KNOWN' }, 400)
    }
    if (msg.includes('not found')) {
      return c.json({ error: msg, code: 'NOT_FOUND' }, 404)
    }
    throw e
  }
})

// PATCH /api/cards/:wordId/known — mark/unmark as known
cards.patch('/:wordId/known', async (c) => {
  const wordId = parseInt(c.req.param('wordId'), 10)
  if (isNaN(wordId)) return c.json({ error: 'Invalid wordId', code: 'INVALID_PARAM' }, 400)

  const { known } = await c.req.json<{ known: boolean }>()
  if (typeof known !== 'boolean') return c.json({ error: 'known (boolean) required', code: 'MISSING_FIELD' }, 400)

  const userId = c.get('userId')
  try {
    const result = await markKnownAction(c.env.DB, userId, wordId, known)
    return c.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('not found')) {
      return c.json({ error: msg, code: 'NOT_FOUND' }, 404)
    }
    throw e
  }
})

export default cards
