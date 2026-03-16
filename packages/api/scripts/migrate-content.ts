/**
 * Content migration script
 * Reads word, translation, and passage data and generates a seed.sql file for the D1 database.
 *
 * Usage:
 *   npx tsx scripts/migrate-content.ts
 *
 * Output:
 *   packages/api/seed.sql
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Types (local, not imported from shared to keep this script self-contained)
// ---------------------------------------------------------------------------

interface Word {
  id: number
  word: string
  pos: string
  phonetic: string
  examples: string[]
  level: string
  topics: string[]
}

interface Translation {
  wordId: number
  translation: string
}

interface ExampleTranslation {
  wordId: number
  exampleIndex: number
  translation: string
}

interface Passage {
  id: number
  title: string
  genre: string
  speakers: Array<{ name: string; voice: string }>
  turns: Array<{ speaker: number; text: string }>
  newWordIds: number[]
  reviewWordIds: number[]
  sequence: number | null
  level: string
  topic: string
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/** Escape single quotes for SQL string literals */
function esc(value: string): string {
  return value.replace(/'/g, "''")
}

/** Wrap a string value in single quotes, or return NULL */
function sqlStr(value: string | null | undefined): string {
  if (value == null) return 'NULL'
  return `'${esc(value)}'`
}

/** Serialize a value as a JSON string stored in TEXT column */
function sqlJson(value: unknown): string {
  if (value == null) return 'NULL'
  return sqlStr(JSON.stringify(value))
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const dataDir = path.join(__dirname, 'data')

// --- Words: read all JSON files from data/words/ ---
const wordsDir = path.join(dataDir, 'words')
if (!fs.existsSync(wordsDir)) {
  console.error(`Missing words directory: ${wordsDir}`)
  process.exit(1)
}

const wordFiles = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json')).sort()
if (wordFiles.length === 0) {
  console.error(`No word JSON files found in ${wordsDir}`)
  process.exit(1)
}

const allWords: Word[] = []
for (const file of wordFiles) {
  const words: Word[] = JSON.parse(fs.readFileSync(path.join(wordsDir, file), 'utf-8'))
  console.log(`  Loaded words/${file}: ${words.length} words`)
  allWords.push(...words)
}

// --- Translations: scan data/translations/ subdirectories ---
const translationsDir = path.join(dataDir, 'translations')
const localeTranslations: { locale: string; translations: Translation[] }[] = []
const localeExampleTranslations: { locale: string; translations: ExampleTranslation[] }[] = []

if (fs.existsSync(translationsDir)) {
  const localeDirs = fs.readdirSync(translationsDir).filter(d =>
    fs.statSync(path.join(translationsDir, d)).isDirectory()
  ).sort()

  for (const locale of localeDirs) {
    const localeDir = path.join(translationsDir, locale)
    const jsonFiles = fs.readdirSync(localeDir).filter(f => f.endsWith('.json') && !f.endsWith('.examples.json')).sort()
    const exampleFiles = fs.readdirSync(localeDir).filter(f => f.endsWith('.examples.json')).sort()

    // Regular translations
    const translations: Translation[] = []
    for (const file of jsonFiles) {
      const entries: Translation[] = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf-8'))
      console.log(`  Loaded translations/${locale}/${file}: ${entries.length} translations`)
      translations.push(...entries)
    }
    if (translations.length > 0) {
      localeTranslations.push({ locale, translations })
    }

    // Example translations
    const exTranslations: ExampleTranslation[] = []
    for (const file of exampleFiles) {
      const entries: ExampleTranslation[] = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf-8'))
      console.log(`  Loaded translations/${locale}/${file}: ${entries.length} example translations`)
      exTranslations.push(...entries)
    }
    if (exTranslations.length > 0) {
      localeExampleTranslations.push({ locale, translations: exTranslations })
    }
  }
} else {
  console.warn(`No translations directory found at ${translationsDir}`)
}

// --- Passages: read all JSON files from data/passages/ ---
const passagesDir = path.join(dataDir, 'passages')
if (!fs.existsSync(passagesDir)) {
  console.error(`Missing passages directory: ${passagesDir}`)
  process.exit(1)
}

const passageFiles = fs.readdirSync(passagesDir).filter(f => f.endsWith('.json')).sort()
if (passageFiles.length === 0) {
  console.error(`No passage JSON files found in ${passagesDir}`)
  process.exit(1)
}

const passages: Passage[] = passageFiles.flatMap(f => {
  const data = JSON.parse(fs.readFileSync(path.join(passagesDir, f), 'utf-8'))
  console.log(`  Loaded passages/${f}: ${data.length} passages`)
  return data
})

// ---------------------------------------------------------------------------
// Build SQL
// ---------------------------------------------------------------------------

const lines: string[] = []

lines.push('-- ============================================================')
lines.push('-- seed.sql — generated by scripts/migrate-content.ts')
lines.push('-- Run with: wrangler d1 execute english-learning --file=seed.sql')
lines.push('-- ============================================================')
lines.push('')

// Language
lines.push('-- Languages')
lines.push(`INSERT OR IGNORE INTO languages (id, name, native_name) VALUES ('en', 'English', 'English');`)
lines.push('')

// Words (without definition_native/definition_target)
lines.push(`-- Words (${allWords.length} entries)`)
for (const w of allWords) {
  const examples = sqlJson(w.examples)
  const topics = sqlJson(w.topics)
  lines.push(
    `INSERT OR IGNORE INTO words (id, language_id, word, pos, phonetic, examples, level, topics) VALUES (${w.id}, 'en', ${sqlStr(w.word)}, ${sqlStr(w.pos)}, ${sqlStr(w.phonetic)}, ${examples}, ${sqlStr(w.level)}, ${topics});`
  )
}
lines.push('')

// Word translations
for (const { locale, translations } of localeTranslations) {
  lines.push(`-- Word translations: ${locale} (${translations.length} entries)`)
  for (const t of translations) {
    lines.push(
      `INSERT OR IGNORE INTO word_translations (word_id, locale, translation) VALUES (${t.wordId}, ${sqlStr(locale)}, ${sqlStr(t.translation)});`
    )
  }
  lines.push('')
}

// Example translations
for (const { locale, translations } of localeExampleTranslations) {
  lines.push(`-- Example translations: ${locale} (${translations.length} entries)`)
  for (const t of translations) {
    lines.push(
      `INSERT OR IGNORE INTO example_translations (word_id, locale, example_index, translation) VALUES (${t.wordId}, ${sqlStr(locale)}, ${t.exampleIndex}, ${sqlStr(t.translation)});`
    )
  }
  lines.push('')
}

// Passages + passage_words
lines.push(`-- Passages (${passages.length} entries)`)
for (const p of passages) {
  const flatText = p.turns
    .map(t => `${p.speakers[t.speaker].name}: ${t.text}`)
    .join('\n')
  lines.push(
    `INSERT OR IGNORE INTO passages (id, language_id, title, text, level, topic, genre, speakers, turns, sequence) VALUES (${p.id}, 'en', ${sqlStr(p.title)}, ${sqlStr(flatText)}, ${sqlStr(p.level)}, ${sqlStr(p.topic)}, ${sqlStr(p.genre)}, ${sqlStr(JSON.stringify(p.speakers))}, ${sqlStr(JSON.stringify(p.turns))}, ${p.sequence ?? 'NULL'});`
  )
}
lines.push('')

lines.push('-- Passage–word associations')
for (const p of passages) {
  for (const wordId of (p.newWordIds ?? [])) {
    lines.push(
      `INSERT OR IGNORE INTO passage_words (passage_id, word_id, role) VALUES (${p.id}, ${wordId}, 'new');`
    )
  }
  for (const wordId of (p.reviewWordIds ?? [])) {
    lines.push(
      `INSERT OR IGNORE INTO passage_words (passage_id, word_id, role) VALUES (${p.id}, ${wordId}, 'review');`
    )
  }
}
lines.push('')

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = path.join(__dirname, '..', 'seed.sql')
fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8')

const wordCount = allWords.length
const translationCount = localeTranslations.reduce((sum, lt) => sum + lt.translations.length, 0)
const exampleTranslationCount = localeExampleTranslations.reduce((sum, lt) => sum + lt.translations.length, 0)
const passageCount = passages.length
const pwCount = passages.reduce((sum, p) => sum + (p.newWordIds?.length ?? 0) + (p.reviewWordIds?.length ?? 0), 0)
console.log(`Generated ${outputPath}`)
console.log(`  ${wordCount} words`)
console.log(`  ${translationCount} word translations`)
console.log(`  ${exampleTranslationCount} example translations`)
console.log(`  ${passageCount} passages`)
console.log(`  ${pwCount} passage–word associations`)
