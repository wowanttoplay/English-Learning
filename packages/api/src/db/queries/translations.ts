import type { Word } from '@english-learning/shared'
import { LOCALE_NAMES } from '@english-learning/shared'

export interface LocaleInfo {
  locale: string
  name: string
}

export async function mergeTranslations(
  db: D1Database,
  words: Word[],
  locales?: string[]
): Promise<Word[]> {
  if (!locales || locales.length === 0 || words.length === 0) return words

  const wordIds = words.map((w) => w.id)
  const translations = await getTranslationsForWords(db, wordIds, locales)
  const exampleTranslations = await getExampleTranslationsForWords(db, wordIds, locales)

  return words.map((w) => ({
    ...w,
    ...(translations[w.id] ? { translations: translations[w.id] } : {}),
    ...(exampleTranslations[w.id] ? { exampleTranslations: exampleTranslations[w.id] } : {}),
  }))
}

export async function getAvailableLocales(
  db: D1Database,
  languageId: string
): Promise<LocaleInfo[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT wt.locale FROM word_translations wt
       JOIN words w ON w.id = wt.word_id
       WHERE w.language_id = ?
       ORDER BY wt.locale`
    )
    .bind(languageId)
    .all<{ locale: string }>()

  return (results ?? []).map((r) => ({
    locale: r.locale,
    name: LOCALE_NAMES[r.locale] ?? r.locale,
  }))
}

export async function getTranslationsForWords(
  db: D1Database,
  wordIds: number[],
  locales: string[]
): Promise<Record<number, Record<string, string>>> {
  if (wordIds.length === 0 || locales.length === 0) return {}

  const idPlaceholders = wordIds.map(() => '?').join(', ')
  const localePlaceholders = locales.map(() => '?').join(', ')

  const { results } = await db
    .prepare(
      `SELECT word_id, locale, translation FROM word_translations
       WHERE word_id IN (${idPlaceholders}) AND locale IN (${localePlaceholders})`
    )
    .bind(...wordIds, ...locales)
    .all<{ word_id: number; locale: string; translation: string }>()

  const map: Record<number, Record<string, string>> = {}
  for (const row of results ?? []) {
    if (!map[row.word_id]) map[row.word_id] = {}
    map[row.word_id][row.locale] = row.translation
  }
  return map
}

export async function getExampleTranslationsForWords(
  db: D1Database,
  wordIds: number[],
  locales: string[]
): Promise<Record<number, Record<string, string[]>>> {
  if (wordIds.length === 0 || locales.length === 0) return {}

  const idPlaceholders = wordIds.map(() => '?').join(', ')
  const localePlaceholders = locales.map(() => '?').join(', ')

  const { results } = await db
    .prepare(
      `SELECT word_id, locale, example_index, translation FROM example_translations
       WHERE word_id IN (${idPlaceholders}) AND locale IN (${localePlaceholders})
       ORDER BY word_id, locale, example_index`
    )
    .bind(...wordIds, ...locales)
    .all<{ word_id: number; locale: string; example_index: number; translation: string }>()

  const map: Record<number, Record<string, string[]>> = {}
  for (const row of results ?? []) {
    if (!map[row.word_id]) map[row.word_id] = {}
    if (!map[row.word_id][row.locale]) map[row.word_id][row.locale] = []
    // Ensure correct index placement
    map[row.word_id][row.locale][row.example_index] = row.translation
  }
  return map
}

export async function insertTranslation(
  db: D1Database,
  wordId: number,
  locale: string,
  translation: string
): Promise<void> {
  await db
    .prepare(
      'INSERT OR REPLACE INTO word_translations (word_id, locale, translation) VALUES (?, ?, ?)'
    )
    .bind(wordId, locale, translation)
    .run()
}

export async function insertExampleTranslation(
  db: D1Database,
  wordId: number,
  locale: string,
  exampleIndex: number,
  translation: string
): Promise<void> {
  await db
    .prepare(
      'INSERT OR REPLACE INTO example_translations (word_id, locale, example_index, translation) VALUES (?, ?, ?, ?)'
    )
    .bind(wordId, locale, exampleIndex, translation)
    .run()
}
