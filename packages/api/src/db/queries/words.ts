import type { Word, Level, TopicId } from '@english-learning/shared'

interface WordRow {
  id: number
  language_id: string
  word: string
  pos: string
  phonetic: string
  definition_native: string
  definition_target: string
  examples: string
  level: string
  topics: string
  audio_url: string | null
}

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    word: row.word,
    pos: row.pos,
    phonetic: row.phonetic,
    definitionNative: row.definition_native,
    definitionTarget: row.definition_target,
    examples: JSON.parse(row.examples ?? '[]') as string[],
    level: row.level as Level,
    topics: JSON.parse(row.topics ?? '[]') as TopicId[],
    languageId: row.language_id,
    ...(row.audio_url ? { audioUrl: row.audio_url } : {}),
  }
}

interface GetWordsOpts {
  lang: string
  level?: string
  topic?: string
  page?: number
  pageSize?: number
}

export async function getWords(
  db: D1Database,
  opts: GetWordsOpts
): Promise<{ items: Word[]; total: number }> {
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
    conditions.push('topics LIKE ?')
    params.push(`%"${opts.topic}"%`)
  }

  const where = conditions.join(' AND ')

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM words WHERE ${where}`)
    .bind(...params)
    .first<{ total: number }>()
  const total = countResult?.total ?? 0

  const { results } = await db
    .prepare(
      `SELECT id, language_id, word, pos, phonetic, definition_native, definition_target, examples, level, topics, audio_url FROM words WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`
    )
    .bind(...params, pageSize, offset)
    .all<WordRow>()

  return { items: (results ?? []).map(rowToWord), total }
}

export async function getWordById(
  db: D1Database,
  id: number
): Promise<Word | null> {
  const row = await db
    .prepare(
      'SELECT id, language_id, word, pos, phonetic, definition_native, definition_target, examples, level, topics, audio_url FROM words WHERE id = ?'
    )
    .bind(id)
    .first<WordRow>()
  return row ? rowToWord(row) : null
}

export async function getWordCount(
  db: D1Database,
  lang: string
): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) as total FROM words WHERE language_id = ?')
    .bind(lang)
    .first<{ total: number }>()
  return result?.total ?? 0
}

export interface InsertWordData {
  languageId: string
  word: string
  pos?: string | null
  phonetic?: string | null
  definitionNative?: string | null
  definitionTarget?: string | null
  examples?: string[]
  topics?: string[]
}

export async function insertWord(
  db: D1Database,
  data: InsertWordData
): Promise<number> {
  const result = await db
    .prepare(`INSERT INTO words (language_id, word, pos, phonetic, definition_native, definition_target, examples, level, topics)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'user', ?)
      RETURNING id`)
    .bind(
      data.languageId,
      data.word,
      data.pos ?? null,
      data.phonetic ?? null,
      data.definitionNative ?? null,
      data.definitionTarget ?? null,
      JSON.stringify(data.examples ?? []),
      JSON.stringify(data.topics ?? [])
    )
    .first<{ id: number }>()
  if (!result) throw new Error('Failed to insert word')
  return result.id
}

export async function getWordsByIds(
  db: D1Database,
  ids: number[]
): Promise<Word[]> {
  if (ids.length === 0) return []

  const placeholders = ids.map(() => '?').join(', ')
  const { results } = await db
    .prepare(
      `SELECT id, language_id, word, pos, phonetic, definition_native, definition_target, examples, level, topics, audio_url FROM words WHERE id IN (${placeholders}) ORDER BY id`
    )
    .bind(...ids)
    .all<WordRow>()

  return (results ?? []).map(rowToWord)
}
