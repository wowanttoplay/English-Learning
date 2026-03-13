import { Hono } from 'hono'
import type { Env } from './env'
import { corsMiddleware } from './middleware/cors'
import languagesRoutes from './routes/languages'
import wordsRoutes from './routes/words'
import passagesRoutes from './routes/passages'

const app = new Hono<{ Bindings: Env }>()

app.use('*', corsMiddleware())

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Content routes
app.route('/api/languages', languagesRoutes)
app.route('/api/words', wordsRoutes)
app.route('/api/passages', passagesRoutes)

// User data routes will be added in Tasks 9-10

export default app
