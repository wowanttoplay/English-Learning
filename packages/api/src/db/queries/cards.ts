import type { SrsCard } from '@english-learning/shared'

interface CardRow {
  user_id: number
  word_id: number
  state: string
  ease: number        // integer in DB (2500 = 2.5)
  interval: number
  due: string
  due_timestamp: number
  reps: number
  lapses: number
  step: number
  previous_state: string | null
}

export function cardRowToSrsCard(row: CardRow): SrsCard {
  return {
    wordId: row.word_id,
    state: row.state as SrsCard['state'],
    ease: row.ease,     // still raw int here — cardService converts
    interval: row.interval,
    due: row.due,
    dueTimestamp: row.due_timestamp,
    reps: row.reps,
    lapses: row.lapses,
    step: row.step,
    ...(row.previous_state ? { previousState: row.previous_state as SrsCard['previousState'] } : {}),
  }
}

export async function getCardsByUser(db: D1Database, userId: number): Promise<SrsCard[]> {
  const { results } = await db
    .prepare('SELECT * FROM srs_cards WHERE user_id = ?')
    .bind(userId)
    .all<CardRow>()
  return (results ?? []).map(cardRowToSrsCard)
}

export async function getCardByUserAndWord(
  db: D1Database, userId: number, wordId: number
): Promise<SrsCard | null> {
  const row = await db
    .prepare('SELECT * FROM srs_cards WHERE user_id = ? AND word_id = ?')
    .bind(userId, wordId)
    .first<CardRow>()
  return row ? cardRowToSrsCard(row) : null
}

export function upsertCardStatement(
  db: D1Database, userId: number, card: SrsCard
): D1PreparedStatement {
  return db
    .prepare(`INSERT INTO srs_cards (user_id, word_id, state, ease, interval, due, due_timestamp, reps, lapses, step, previous_state, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT (user_id, word_id) DO UPDATE SET
        state = excluded.state,
        ease = excluded.ease,
        interval = excluded.interval,
        due = excluded.due,
        due_timestamp = excluded.due_timestamp,
        reps = excluded.reps,
        lapses = excluded.lapses,
        step = excluded.step,
        previous_state = excluded.previous_state,
        updated_at = excluded.updated_at`)
    .bind(userId, card.wordId, card.state, card.ease, card.interval, card.due, card.dueTimestamp, card.reps, card.lapses, card.step, card.previousState ?? null)
}

export function insertReviewLogStatement(
  db: D1Database, userId: number, wordId: number, rating: number, state: string, ease: number, interval: number
): D1PreparedStatement {
  return db
    .prepare('INSERT INTO review_log (user_id, word_id, rating, state, ease, interval) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(userId, wordId, rating, state, ease, interval)
}

export async function deleteCard(db: D1Database, userId: number, wordId: number): Promise<void> {
  await db.prepare('DELETE FROM srs_cards WHERE user_id = ? AND word_id = ?').bind(userId, wordId).run()
}
