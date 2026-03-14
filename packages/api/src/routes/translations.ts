import { Hono } from 'hono'
import type { Env } from '../env'
import { getAvailableLocales } from '../db/queries/translations'

const app = new Hono<{ Bindings: Env }>()

app.get('/locales', async (c) => {
  const lang = c.req.query('lang') ?? 'en'
  const db = c.env.DB
  const locales = await getAvailableLocales(db, lang)
  return c.json({ data: locales })
})

export default app
