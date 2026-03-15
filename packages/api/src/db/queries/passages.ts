import type { Passage, PassageSummary, Level, TopicId } from '@english-learning/shared'

interface PassageRow {
  id: number
  language_id: string
  title: string
  level: string
  topic: string
  genre: string
  speakers: string | null
  turns: string | null
  sequence: number | null
}

interface PassageSummaryRow {
  id: number
  language_id: string
  title: string
  level: string
  topic: string
  genre: string
  speakers: string | null
  sequence: number | null
}

function rowToPassageSummary(row: PassageSummaryRow): PassageSummary {
  return {
    id: row.id,
    title: row.title,
    level: row.level as Level,
    topic: row.topic as TopicId,
    genre: row.genre || '',
    languageId: row.language_id,
    speakers: row.speakers
      ? JSON.parse(row.speakers).map((s: { name: string }) => ({ name: s.name }))
      : [],
    sequence: row.sequence ?? null,
  }
}

function rowToPassage(row: PassageRow): Omit<Passage, 'newWordIds' | 'reviewWordIds'> {
  return {
    id: row.id,
    title: row.title,
    level: row.level as Level,
    topic: row.topic as TopicId,
    genre: row.genre || '',
    languageId: row.language_id,
    speakers: row.speakers ? JSON.parse(row.speakers) : [],
    turns: row.turns ? JSON.parse(row.turns) : [],
    sequence: row.sequence ?? null,
  }
}

interface GetPassagesOpts {
  lang: string
  level?: string
  topic?: string
  page?: number
  pageSize?: number
}

export async function getPassages(
  db: D1Database,
  opts: GetPassagesOpts
): Promise<{ items: PassageSummary[]; total: number }> {
  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 50
  const offset = (page - 1) * pageSize

  const conditions: string[] = ['language_id = ?']
  const params: (string | number)[] = [opts.lang]

  if (opts.level) {
    conditions.push('level = ?')
    params.push(opts.level)
  }
  if (opts.topic) {
    conditions.push('topic = ?')
    params.push(opts.topic)
  }

  const where = conditions.join(' AND ')

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM passages WHERE ${where}`)
    .bind(...params)
    .first<{ total: number }>()
  const total = countResult?.total ?? 0

  const { results } = await db
    .prepare(
      `SELECT id, language_id, title, level, topic, genre, speakers, sequence FROM passages WHERE ${where} ORDER BY sequence NULLS LAST, id LIMIT ? OFFSET ?`
    )
    .bind(...params, pageSize, offset)
    .all<PassageSummaryRow>()

  return { items: (results ?? []).map(rowToPassageSummary), total }
}

export async function getPassageById(
  db: D1Database,
  id: number
): Promise<Omit<Passage, 'newWordIds' | 'reviewWordIds'> | null> {
  const row = await db
    .prepare(
      'SELECT id, language_id, title, level, topic, genre, speakers, turns, sequence FROM passages WHERE id = ?'
    )
    .bind(id)
    .first<PassageRow>()
  return row ? rowToPassage(row) : null
}

export async function getPassageWordIds(
  db: D1Database,
  passageId: number
): Promise<{ wordId: number; role: 'new' | 'review' }[]> {
  const { results } = await db
    .prepare('SELECT word_id, role FROM passage_words WHERE passage_id = ? ORDER BY word_id')
    .bind(passageId)
    .all<{ word_id: number; role: 'new' | 'review' }>()
  return (results ?? []).map((r) => ({ wordId: r.word_id, role: r.role }))
}
