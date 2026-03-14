import { Hono } from 'hono'
import type { Env } from '../env'
import { getUserWords } from '../db/queries/userWords'
import { createUserWord } from '../services/userWordService'
import { AppError } from '../errors'

const userWords = new Hono<{ Bindings: Env }>()

// GET /api/user-words?lang=en
userWords.get('/', async (c) => {
  const userId = c.get('userId')
  const lang = c.req.query('lang') ?? 'en'
  const words = await getUserWords(c.env.DB, userId, lang)
  return c.json({ items: words })
})

// POST /api/user-words
userWords.post('/', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  try {
    const word = await createUserWord(c.env.DB, userId, data)
    return c.json(word, 201)
  } catch (e) {
    if (e instanceof AppError) {
      return c.json({ error: e.message, code: e.code }, e.status as 400 | 500)
    }
    throw e
  }
})

export default userWords
