import { Hono } from 'hono'
import type { Env } from './env'
import { corsMiddleware } from './middleware/cors'
import languagesRoutes from './routes/languages'
import wordsRoutes from './routes/words'
import passagesRoutes from './routes/passages'
import { authMiddleware } from './middleware/auth'
import cardsRoutes from './routes/cards'

const app = new Hono<{ Bindings: Env }>()

app.use('*', corsMiddleware())

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Content routes
app.route('/api/languages', languagesRoutes)
app.route('/api/words', wordsRoutes)
app.route('/api/passages', passagesRoutes)

// User data routes
app.use('/api/cards/*', authMiddleware)
app.route('/api/cards', cardsRoutes)

export default app
