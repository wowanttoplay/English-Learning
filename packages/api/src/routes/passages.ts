import { Hono } from 'hono'
import type { Env } from '../env'
import { getPassages, getPassageById, getPassageWordIds } from '../db/queries/passages'
import { getWordsByIds } from '../db/queries/words'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const lang = c.req.query('lang')
  if (!lang) {
    return c.json({ error: 'Missing required query parameter: lang', code: 'MISSING_PARAM' }, 400)
  }

  const level = c.req.query('level')
  const topic = c.req.query('topic')
  const page = c.req.query('page') ? Number(c.req.query('page')) : 1
  const pageSize = c.req.query('pageSize') ? Number(c.req.query('pageSize')) : 50

  if (isNaN(page) || page < 1) {
    return c.json({ error: 'Invalid page parameter', code: 'INVALID_PARAM' }, 400)
  }
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    return c.json({ error: 'Invalid pageSize parameter (1-100)', code: 'INVALID_PARAM' }, 400)
  }

  const result = await getPassages(c.env.DB, { lang, level, topic, page, pageSize })
  return c.json({ data: { ...result, page, pageSize } })
})

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) {
    return c.json({ error: 'Invalid passage ID', code: 'INVALID_PARAM' }, 400)
  }

  const passage = await getPassageById(c.env.DB, id)
  if (!passage) {
    return c.json({ error: 'Passage not found', code: 'NOT_FOUND' }, 404)
  }

  const wordIds = await getPassageWordIds(c.env.DB, id)
  const words = await getWordsByIds(c.env.DB, wordIds)

  return c.json({ data: { passage, words } })
})

export default app
