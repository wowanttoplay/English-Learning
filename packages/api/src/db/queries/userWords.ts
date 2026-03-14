import type { Word, TopicId, Level } from '@english-learning/shared'
import { mergeTranslations } from './translations'

interface UserWordRow {
  id: number
  user_id: number
  language_id: string
  word: string
  pos: string | null
  phonetic: string | null
  examples: string | null
  topics: string | null
}

function rowToWord(row: UserWordRow): Word {
  return {
    id: row.id,
    word: row.word,
    pos: row.pos ?? '',
    phonetic: row.phonetic ?? '',
    examples: JSON.parse(row.examples ?? '[]') as string[],
    level: 'user' as Level,
    topics: JSON.parse(row.topics ?? '[]') as TopicId[],
    languageId: row.language_id,
  }
}

export async function getUserWords(
  db: D1Database, userId: number, langId: string, locales?: string[]
): Promise<Word[]> {
  const { results } = await db
    .prepare('SELECT * FROM user_words WHERE user_id = ? AND language_id = ?')
    .bind(userId, langId)
    .all<UserWordRow>()
  const words = (results ?? []).map(rowToWord)
  return mergeTranslations(db, words, locales)
}

interface CreateUserWordData {
  languageId: string
  word: string
  pos?: string
  phonetic?: string
  examples?: string[]
  topics?: string[]
}

export function insertUserWordStatement(
  db: D1Database, userId: number, data: CreateUserWordData
): D1PreparedStatement {
  return db
    .prepare(`INSERT INTO user_words (user_id, language_id, word, pos, phonetic, examples, topics)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      userId,
      data.languageId,
      data.word,
      data.pos ?? null,
      data.phonetic ?? null,
      JSON.stringify(data.examples ?? []),
      JSON.stringify(data.topics ?? [])
    )
}
