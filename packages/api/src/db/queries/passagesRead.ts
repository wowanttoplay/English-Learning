export async function getPassagesRead(
  db: D1Database, userId: number
): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT passage_id FROM passages_read WHERE user_id = ?')
    .bind(userId)
    .all<{ passage_id: number }>()
  return (results ?? []).map(r => r.passage_id)
}

export async function markPassageRead(
  db: D1Database, userId: number, passageId: number
): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO passages_read (user_id, passage_id) VALUES (?, ?)')
    .bind(userId, passageId)
    .run()
}
