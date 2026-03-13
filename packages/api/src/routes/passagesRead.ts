import { Hono } from 'hono'
import type { Env } from '../env'

const passagesRead = new Hono<{ Bindings: Env }>()

// GET /api/user/passages-read
passagesRead.get('/', async (c) => {
  const userId = c.get('userId')
  const { results } = await c.env.DB
    .prepare('SELECT passage_id FROM passages_read WHERE user_id = ?')
    .bind(userId)
    .all<{ passage_id: number }>()
  const ids = (results ?? []).map(r => r.passage_id)
  return c.json({ items: ids })
})

// POST /api/user/passages-read/:id
passagesRead.post('/:id', async (c) => {
  const userId = c.get('userId')
  const passageId = parseInt(c.req.param('id'), 10)
  if (isNaN(passageId)) return c.json({ error: 'Invalid passage ID', code: 'INVALID_PARAM' }, 400)

  await c.env.DB
    .prepare('INSERT OR IGNORE INTO passages_read (user_id, passage_id) VALUES (?, ?)')
    .bind(userId, passageId)
    .run()
  return c.json({ ok: true })
})

export default passagesRead
