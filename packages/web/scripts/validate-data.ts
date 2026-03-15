/**
 * Validates word, translation, and passage JSON files:
 * 1. Word files in packages/api/scripts/data/words/ — id, word, pos, phonetic, examples, level, topics
 * 2. Translation files in packages/api/scripts/data/translations/ — wordId references, translation field
 * 3. Passage files in packages/api/scripts/data/passages/ — id, title, text, genre, level, topic, wordIds
 * 4. Cross-reference: passage wordIds must exist in word data
 * 5. Duplicate words (word+pos combination, case-insensitive)
 * 6. Duplicate IDs (words and passages)
 * 7. Invalid CEFR levels
 * 8. Invalid topic/genre references
 * 9. Example count (must be exactly 2)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

import { isValidLevel, VALID_TOPIC_IDS, VALID_GENRES } from '@english-learning/shared'

const VALID_TOPICS = new Set<string>(VALID_TOPIC_IDS)
const VALID_GENRE_SET = new Set<string>(VALID_GENRES)
const REQUIRED_WORD_FIELDS = ['id', 'word', 'pos', 'phonetic', 'examples', 'level'] as const
const REQUIRED_PASSAGE_FIELDS = ['id', 'title', 'text', 'genre', 'level', 'topic', 'wordIds'] as const

interface WordEntry {
  id: number
  word: string
  pos: string
  phonetic: string
  examples: string[]
  level: string
  topics?: string[]
}

interface TranslationEntry {
  wordId: number
  translation: string
}

interface PassageEntry {
  id: number
  title: string
  text: string
  genre: string
  level: string
  topic: string
  wordIds: number[]
}

let errors = 0

function error(msg: string) {
  console.error(`ERROR: ${msg}`)
  errors++
}

// ---------------------------------------------------------------------------
// 1. Load and validate word files from packages/api/scripts/data/words/
// ---------------------------------------------------------------------------

// Resolve from packages/web/scripts/ up to repo root, then into packages/api/scripts/data/
const apiDataDir = join(import.meta.dirname, '..', '..', 'api', 'scripts', 'data')
const wordsDir = join(apiDataDir, 'words')

if (!existsSync(wordsDir)) {
  console.error(`ERROR: Words directory not found: ${wordsDir}`)
  process.exit(1)
}

const wordFiles = readdirSync(wordsDir).filter(f => f.endsWith('.json')).sort()

if (wordFiles.length === 0) {
  console.error('ERROR: No JSON word files found in packages/api/scripts/data/words/')
  process.exit(1)
}

const allWords: WordEntry[] = []
for (const file of wordFiles) {
  const filePath = join(wordsDir, file)
  const words: WordEntry[] = JSON.parse(readFileSync(filePath, 'utf-8'))
  console.log(`  Loaded words/${file}: ${words.length} words`)
  allWords.push(...words)
}

// Check required fields (no zh/en — those are in translation files now)
for (const w of allWords) {
  for (const field of REQUIRED_WORD_FIELDS) {
    if (w[field] === undefined || w[field] === null) {
      error(`Word ID ${w.id} ("${w.word}"): missing required field "${field}"`)
    }
  }
}

// Duplicate IDs
const idMap = new Map<number, WordEntry>()
for (const w of allWords) {
  if (idMap.has(w.id)) {
    error(`Duplicate ID ${w.id}: "${w.word}" and "${idMap.get(w.id)!.word}"`)
  }
  idMap.set(w.id, w)
}

// Duplicate word+pos (case-insensitive)
const wordPosMap = new Map<string, WordEntry>()
for (const w of allWords) {
  const key = `${w.word.toLowerCase()}|${w.pos.toLowerCase()}`
  if (wordPosMap.has(key)) {
    error(`Duplicate word+pos: "${w.word}" (${w.pos}) — IDs ${wordPosMap.get(key)!.id} and ${w.id}`)
  }
  wordPosMap.set(key, w)
}

// Invalid levels
for (const w of allWords) {
  if (!isValidLevel('en', w.level)) {
    error(`Word ID ${w.id} ("${w.word}"): invalid level "${w.level}"`)
  }
}

// Invalid topic references
for (const w of allWords) {
  if (w.topics) {
    for (const t of w.topics) {
      if (!VALID_TOPICS.has(t)) {
        error(`Word ID ${w.id} ("${w.word}"): invalid topic "${t}"`)
      }
    }
  }
}

// Example count (must be exactly 2)
for (const w of allWords) {
  if (!Array.isArray(w.examples) || w.examples.length !== 2) {
    error(`Word ID ${w.id} ("${w.word}"): expected 2 examples, got ${Array.isArray(w.examples) ? w.examples.length : 'non-array'}`)
  }
}

console.log(`\nValidated ${allWords.length} words across ${wordFiles.length} file(s)`)

// ---------------------------------------------------------------------------
// 2. Load and validate translation files from packages/api/scripts/data/translations/
// ---------------------------------------------------------------------------

const translationsDir = join(apiDataDir, 'translations')
let translationCount = 0

if (existsSync(translationsDir)) {
  const localeDirs = readdirSync(translationsDir).filter(d =>
    statSync(join(translationsDir, d)).isDirectory()
  ).sort()

  for (const locale of localeDirs) {
    const localeDir = join(translationsDir, locale)
    const jsonFiles = readdirSync(localeDir).filter(f => f.endsWith('.json')).sort()

    for (const file of jsonFiles) {
      const filePath = join(localeDir, file)
      const entries: TranslationEntry[] = JSON.parse(readFileSync(filePath, 'utf-8'))
      console.log(`  Loaded translations/${locale}/${file}: ${entries.length} entries`)

      for (const entry of entries) {
        // Validate required fields
        if (entry.wordId === undefined || entry.wordId === null) {
          error(`translations/${locale}/${file}: entry missing wordId`)
          continue
        }
        if (!entry.translation) {
          error(`translations/${locale}/${file}: wordId ${entry.wordId} missing translation`)
        }
        // Validate wordId references a known word
        if (!idMap.has(entry.wordId)) {
          error(`translations/${locale}/${file}: wordId ${entry.wordId} does not exist in word data`)
        }
      }

      translationCount += entries.length
    }
  }

  console.log(`\nValidated ${translationCount} translations`)
} else {
  console.warn('WARNING: No translations directory found — skipping translation validation')
}

// ---------------------------------------------------------------------------
// 3. Load and validate passage files from packages/api/scripts/data/passages/
// ---------------------------------------------------------------------------

const passagesDir = join(apiDataDir, 'passages')
let passageCount = 0

if (existsSync(passagesDir)) {
  const passageFiles = readdirSync(passagesDir).filter(f => f.endsWith('.json')).sort()

  if (passageFiles.length === 0) {
    console.warn('WARNING: No JSON passage files found in packages/api/scripts/data/passages/')
  }

  const allPassages: PassageEntry[] = []
  for (const file of passageFiles) {
    const filePath = join(passagesDir, file)
    const passages: PassageEntry[] = JSON.parse(readFileSync(filePath, 'utf-8'))
    console.log(`  Loaded passages/${file}: ${passages.length} passages`)
    allPassages.push(...passages)
  }

  // Check required fields
  for (const p of allPassages) {
    for (const field of REQUIRED_PASSAGE_FIELDS) {
      if (p[field] === undefined || p[field] === null) {
        error(`Passage ID ${p.id} ("${p.title}"): missing required field "${field}"`)
      }
    }
  }

  // Duplicate passage IDs
  const passageIdMap = new Map<number, PassageEntry>()
  for (const p of allPassages) {
    if (passageIdMap.has(p.id)) {
      error(`Duplicate passage ID ${p.id}: "${p.title}" and "${passageIdMap.get(p.id)!.title}"`)
    }
    passageIdMap.set(p.id, p)
  }

  // Validate genre
  for (const p of allPassages) {
    if (!VALID_GENRE_SET.has(p.genre)) {
      error(`Passage ID ${p.id} ("${p.title}"): invalid genre "${p.genre}"`)
    }
  }

  // Validate topic
  for (const p of allPassages) {
    if (!VALID_TOPICS.has(p.topic)) {
      error(`Passage ID ${p.id} ("${p.title}"): invalid topic "${p.topic}"`)
    }
  }

  // Validate level
  for (const p of allPassages) {
    if (!isValidLevel('en', p.level)) {
      error(`Passage ID ${p.id} ("${p.title}"): invalid level "${p.level}"`)
    }
  }

  // Cross-reference: every wordId in passage.wordIds must exist in word data
  for (const p of allPassages) {
    if (Array.isArray(p.wordIds)) {
      for (const wid of p.wordIds) {
        if (!idMap.has(wid)) {
          error(`Passage ID ${p.id} ("${p.title}"): wordId ${wid} does not exist in word data`)
        }
      }
    }
  }

  passageCount = allPassages.length
  console.log(`\nValidated ${passageCount} passages across ${passageFiles.length} file(s)`)
} else {
  console.warn('WARNING: No passages directory found — skipping passage validation')
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nSummary: Validated ${allWords.length} words, ${translationCount} translations, ${passageCount} passages`)

if (errors > 0) {
  console.error(`\n${errors} error(s) found`)
  process.exit(1)
} else {
  console.log('\nAll checks passed!')
}
