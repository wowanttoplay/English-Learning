import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import type { Env } from '../env'
import { getOrCreateUser } from '../db/queries/users'

declare module 'hono' {
  interface ContextVariableMap {
    userId: number
    clerkId: string
  }
}

export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }

    const token = authHeader.slice(7)
    try {
      const payload = await verifyToken(token, {
        secretKey: c.env.CLERK_SECRET_KEY,
      })
      const clerkId = payload.sub
      if (!clerkId) throw new Error('No sub in token')

      const userId = await getOrCreateUser(c.env.DB, clerkId)
      c.set('userId', userId)
      c.set('clerkId', clerkId)
      await next()
    } catch {
      return c.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, 401)
    }
  }
)
