import type { Passage, SentenceTimestamp, CefrCoreLevel, SubtopicId } from '@english-learning/shared'

interface PassageRow {
  id: number
  language_id: string
  title: string
  text: string
  level: string
  topic: string
  genre: string
  audio_url: string | null
  timestamps: string | null
}

interface PassageSummaryRow {
  id: number
  language_id: string
  title: string
  level: string
  topic: string
  genre: string
  audio_url: string | null
}

export interface PassageSummary {
  id: number
  title: string
  level: CefrCoreLevel
  topic: SubtopicId
  genre: string
  languageId: string
  audioUrl?: string
}

function rowToPassageSummary(row: PassageSummaryRow): PassageSummary {
  return {
    id: row.id,
    title: row.title,
    level: row.level as CefrCoreLevel,
    topic: row.topic as SubtopicId,
    genre: row.genre,
    languageId: row.language_id,
    ...(row.audio_url ? { audioUrl: row.audio_url } : {}),
  }
}

function rowToPassage(row: PassageRow): Passage {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    level: row.level as CefrCoreLevel,
    topic: row.topic as SubtopicId,
    genre: row.genre,
    languageId: row.language_id,
    ...(row.audio_url ? { audioUrl: row.audio_url } : {}),
    ...(row.timestamps
      ? { timestamps: JSON.parse(row.timestamps) as SentenceTimestamp[] }
      : {}),
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
      `SELECT id, language_id, title, level, topic, genre, audio_url FROM passages WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`
    )
    .bind(...params, pageSize, offset)
    .all<PassageSummaryRow>()

  return { items: (results ?? []).map(rowToPassageSummary), total }
}

export async function getPassageById(
  db: D1Database,
  id: number
): Promise<Passage | null> {
  const row = await db
    .prepare(
      'SELECT id, language_id, title, text, level, topic, genre, audio_url, timestamps FROM passages WHERE id = ?'
    )
    .bind(id)
    .first<PassageRow>()
  return row ? rowToPassage(row) : null
}

export async function getPassageWordIds(
  db: D1Database,
  passageId: number
): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT word_id FROM passage_words WHERE passage_id = ? ORDER BY word_id')
    .bind(passageId)
    .all<{ word_id: number }>()
  return (results ?? []).map((r) => r.word_id)
}
