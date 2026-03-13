import { Hono } from 'hono'
import type { Env } from './env'
import { corsMiddleware } from './middleware/cors'
import languagesRoutes from './routes/languages'
import wordsRoutes from './routes/words'
import passagesRoutes from './routes/passages'
import { authMiddleware } from './middleware/auth'
import cardsRoutes from './routes/cards'
import userWordsRoutes from './routes/userWords'
import passagesReadRoutes from './routes/passagesRead'
import historyRoutes from './routes/history'
import settingsRoutes from './routes/settings'

const app = new Hono<{ Bindings: Env }>()

app.use('*', corsMiddleware())

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Content routes (no auth required)
app.route('/api/languages', languagesRoutes)
app.route('/api/words', wordsRoutes)
app.route('/api/passages', passagesRoutes)

// Auth-protected routes
const authApp = new Hono<{ Bindings: Env }>()
authApp.use('*', authMiddleware)
authApp.route('/cards', cardsRoutes)
authApp.route('/user-words', userWordsRoutes)
authApp.route('/user/passages-read', passagesReadRoutes)
authApp.route('/history', historyRoutes)
authApp.route('/settings', settingsRoutes)

app.route('/api', authApp)

export default app
