import type { Word, SubtopicId, CefrLevel } from '@english-learning/shared'

interface UserWordRow {
  id: number
  user_id: number
  language_id: string
  word: string
  pos: string | null
  phonetic: string | null
  definition_native: string | null
  definition_target: string | null
  examples: string | null
  topics: string | null
}

function rowToWord(row: UserWordRow): Word {
  return {
    id: row.id,
    word: row.word,
    pos: row.pos ?? '',
    phonetic: row.phonetic ?? '',
    definitionNative: row.definition_native ?? '',
    definitionTarget: row.definition_target ?? '',
    examples: JSON.parse(row.examples ?? '[]') as string[],
    level: 'user' as CefrLevel,
    topics: JSON.parse(row.topics ?? '[]') as SubtopicId[],
    languageId: row.language_id,
  }
}

export async function getUserWords(
  db: D1Database, userId: number, langId: string
): Promise<Word[]> {
  const { results } = await db
    .prepare('SELECT * FROM user_words WHERE user_id = ? AND language_id = ?')
    .bind(userId, langId)
    .all<UserWordRow>()
  return (results ?? []).map(rowToWord)
}

interface CreateUserWordData {
  languageId: string
  word: string
  pos?: string
  phonetic?: string
  definitionNative?: string
  definitionTarget?: string
  examples?: string[]
  topics?: string[]
}

export function insertUserWordStatement(
  db: D1Database, userId: number, data: CreateUserWordData
): D1PreparedStatement {
  return db
    .prepare(`INSERT INTO user_words (user_id, language_id, word, pos, phonetic, definition_native, definition_target, examples, topics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      userId,
      data.languageId,
      data.word,
      data.pos ?? null,
      data.phonetic ?? null,
      data.definitionNative ?? null,
      data.definitionTarget ?? null,
      JSON.stringify(data.examples ?? []),
      JSON.stringify(data.topics ?? [])
    )
}

export async function getLastInsertedUserWord(
  db: D1Database, userId: number, langId: string, word: string
): Promise<Word | null> {
  const row = await db
    .prepare('SELECT * FROM user_words WHERE user_id = ? AND language_id = ? AND word = ?')
    .bind(userId, langId, word)
    .first<UserWordRow>()
  return row ? rowToWord(row) : null
}
