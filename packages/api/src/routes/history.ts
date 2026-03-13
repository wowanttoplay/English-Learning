import { Hono } from 'hono'
import type { Env } from '../env'
import { getHistoryByUser } from '../db/queries/history'

const history = new Hono<{ Bindings: Env }>()

// GET /api/history
history.get('/', async (c) => {
  const userId = c.get('userId')
  const data = await getHistoryByUser(c.env.DB, userId)
  return c.json(data)
})

export default history
