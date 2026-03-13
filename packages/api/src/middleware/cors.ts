import { cors } from 'hono/cors'
import type { Env } from '../env'

export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const allowed = (c.env as Env).ALLOWED_ORIGIN
      const origins = allowed.split(',').map((o: string) => o.trim())
      return origins.includes(origin) ? origin : origins[0]
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
}
