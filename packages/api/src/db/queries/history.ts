import type { SrsHistory } from '@english-learning/shared'

interface HistoryRow {
  date: string
  reviewed: number
  learned: number
}

export async function getHistoryByUser(
  db: D1Database, userId: number
): Promise<Record<string, SrsHistory>> {
  const { results } = await db
    .prepare('SELECT date, reviewed, learned FROM srs_history WHERE user_id = ?')
    .bind(userId)
    .all<HistoryRow>()

  const history: Record<string, SrsHistory> = {}
  for (const row of results ?? []) {
    history[row.date] = { reviewed: row.reviewed, learned: row.learned }
  }
  return history
}

export function incrementReviewedStatement(
  db: D1Database, userId: number, date: string
): D1PreparedStatement {
  return db
    .prepare(`INSERT INTO srs_history (user_id, date, reviewed, learned)
      VALUES (?, ?, 1, 0)
      ON CONFLICT (user_id, date) DO UPDATE SET reviewed = reviewed + 1`)
    .bind(userId, date)
}

export function incrementLearnedStatement(
  db: D1Database, userId: number, date: string
): D1PreparedStatement {
  return db
    .prepare(`INSERT INTO srs_history (user_id, date, reviewed, learned)
      VALUES (?, ?, 0, 1)
      ON CONFLICT (user_id, date) DO UPDATE SET learned = learned + 1`)
    .bind(userId, date)
}
