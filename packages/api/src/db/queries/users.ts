export async function getOrCreateUser(db: D1Database, clerkId: string): Promise<number> {
  const existing = await db.prepare(
    'SELECT id FROM users WHERE clerk_id = ?'
  ).bind(clerkId).first<{ id: number }>()

  if (existing) return existing.id

  const result = await db.prepare(
    'INSERT INTO users (clerk_id) VALUES (?) RETURNING id'
  ).bind(clerkId).first<{ id: number }>()

  if (!result) throw new Error('Failed to create user')
  return result.id
}
