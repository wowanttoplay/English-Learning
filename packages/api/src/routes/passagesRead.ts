import { Hono } from 'hono'
import type { Env } from '../env'
import { getPassagesRead, markPassageRead } from '../db/queries/passagesRead'

const passagesRead = new Hono<{ Bindings: Env }>()

// GET /api/user/passages-read
passagesRead.get('/', async (c) => {
  const userId = c.get('userId')
  const ids = await getPassagesRead(c.env.DB, userId)
  return c.json({ items: ids })
})

// POST /api/user/passages-read/:id
passagesRead.post('/:id', async (c) => {
  const userId = c.get('userId')
  const passageId = parseInt(c.req.param('id'), 10)
  if (isNaN(passageId)) return c.json({ error: 'Invalid passage ID', code: 'INVALID_PARAM' }, 400)

  await markPassageRead(c.env.DB, userId, passageId)
  return c.json({ ok: true })
})

export default passagesRead
