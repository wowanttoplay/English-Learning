import { Hono } from 'hono'
import type { Env } from '../env'
import { getSettings, saveSettings } from '../db/queries/settings'

const settings = new Hono<{ Bindings: Env }>()

// GET /api/settings
settings.get('/', async (c) => {
  const userId = c.get('userId')
  const data = await getSettings(c.env.DB, userId)
  return c.json(data)
})

// PUT /api/settings
settings.put('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  await saveSettings(c.env.DB, userId, body)
  return c.json({ ok: true })
})

export default settings
