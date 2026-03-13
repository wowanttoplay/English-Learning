import { Hono } from 'hono'
import type { Env } from '../env'
import { getAllLanguages } from '../db/queries/languages'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const languages = await getAllLanguages(c.env.DB)
  return c.json({ data: languages })
})

export default app
