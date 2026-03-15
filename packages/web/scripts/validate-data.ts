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
const REQUIRED_PASSAGE_FIELDS = ['id', 'title', 'speakers', 'turns', 'genre', 'level', 'topic', 'newWordIds', 'reviewWordIds'] as const

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
  speakers: Array<{ name: string; voice: string }>
  turns: Array<{ speaker: number; text: string }>
  genre: string
  level: string
  topic: string
  sequence: number | null
  newWordIds: number[]
  reviewWordIds: number[]
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

  // English translation coverage: every word must have an en translation
  const enDir = join(translationsDir, 'en')
  if (existsSync(enDir)) {
    const enWordIds = new Set<number>()
    const enFiles = readdirSync(enDir).filter(f => f.endsWith('.json') && !f.endsWith('.examples.json')).sort()
    for (const file of enFiles) {
      const entries: TranslationEntry[] = JSON.parse(readFileSync(join(enDir, file), 'utf-8'))
      for (const entry of entries) {
        enWordIds.add(entry.wordId)
      }
    }
    for (const w of allWords) {
      if (!enWordIds.has(w.id)) {
        error(`Word ID ${w.id} ("${w.word}"): missing English translation`)
      }
    }
    console.log(`  English translation coverage: ${enWordIds.size}/${allWords.length} words`)
  } else {
    error('Missing English translations directory: translations/en/')
  }
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

  // Validate speakers
  for (const p of allPassages) {
    if (!Array.isArray(p.speakers) || p.speakers.length !== 2) {
      error(`Passage ${p.id} ("${p.title}"): must have exactly 2 speakers`)
      continue
    }
    for (const [i, s] of p.speakers.entries()) {
      if (!s.name) error(`Passage ${p.id}: speaker ${i} missing name`)
      if (!s.voice || !/^en-US-Chirp3-HD-/.test(s.voice)) {
        error(`Passage ${p.id}: speaker ${i} invalid voice "${s.voice}"`)
      }
    }
  }

  // Validate turns
  for (const p of allPassages) {
    if (!Array.isArray(p.turns)) continue
    if (p.turns.length < 8 || p.turns.length > 16) {
      error(`Passage ${p.id} ("${p.title}"): must have 8-16 turns, got ${p.turns.length}`)
    }
    for (const [i, t] of p.turns.entries()) {
      if (t.speaker !== 0 && t.speaker !== 1) {
        error(`Passage ${p.id}: turn ${i} invalid speaker ${t.speaker}`)
      }
      if (!t.text || !t.text.trim()) {
        error(`Passage ${p.id}: turn ${i} has empty text`)
      }
    }
  }

  // Cross-reference: every wordId in passage.newWordIds and reviewWordIds must exist in word data
  for (const p of allPassages) {
    if (Array.isArray(p.newWordIds)) {
      for (const wid of p.newWordIds) {
        if (!idMap.has(wid)) {
          error(`Passage ID ${p.id} ("${p.title}"): newWordId ${wid} does not exist in word data`)
        }
      }
    }
    if (Array.isArray(p.reviewWordIds)) {
      for (const wid of p.reviewWordIds) {
        if (!idMap.has(wid)) {
          error(`Passage ID ${p.id} ("${p.title}"): reviewWordId ${wid} does not exist in word data`)
        }
      }
    }
  }

  // --- Spiral progression validation ---
  // Group curriculum passages (non-null sequence) by level
  const curriculumByLevel = new Map<string, PassageEntry[]>()
  for (const p of allPassages) {
    if (p.sequence != null) {
      const list = curriculumByLevel.get(p.level) ?? []
      list.push(p)
      curriculumByLevel.set(p.level, list)
    }
  }

  for (const [level, passages] of curriculumByLevel) {
    // Sort by sequence
    passages.sort((a, b) => a.sequence! - b.sequence!)

    // Check sequence contiguity (1, 2, 3, ...)
    for (let i = 0; i < passages.length; i++) {
      if (passages[i].sequence !== i + 1) {
        error(`Level ${level}: expected sequence ${i + 1}, got ${passages[i].sequence} (passage ${passages[i].id})`)
      }
    }

    // Track introduced words across the level
    const introducedWordIds = new Set<number>()

    for (let i = 0; i < passages.length; i++) {
      const p = passages[i]

      // Check newWordIds count: 3-5
      if (p.newWordIds.length < 3 || p.newWordIds.length > 5) {
        error(`Passage ${p.id} (${level} seq ${p.sequence}): newWordIds count must be 3-5, got ${p.newWordIds.length}`)
      }

      // Check reviewWordIds count: 2-4 (first passage exempt)
      if (i > 0 && (p.reviewWordIds.length < 2 || p.reviewWordIds.length > 4)) {
        error(`Passage ${p.id} (${level} seq ${p.sequence}): reviewWordIds count must be 2-4, got ${p.reviewWordIds.length}`)
      }

      // Check reviewWordIds reference earlier-introduced words or lower-level words
      if (i > 0) {
        for (const wid of p.reviewWordIds) {
          if (!introducedWordIds.has(wid)) {
            // Could be a lower-level word — check if it exists in word data (that's acceptable)
            // For now, just check it's in introducedWordIds (from earlier passages in same level)
            // Lower-level words are also acceptable
            const word = idMap.get(wid)
            if (!word) {
              error(`Passage ${p.id} (${level} seq ${p.sequence}): reviewWordId ${wid} not found in word data`)
            }
            // If the word is same level but not yet introduced, that's an error
            if (word && word.level === level && !introducedWordIds.has(wid)) {
              error(`Passage ${p.id} (${level} seq ${p.sequence}): reviewWordId ${wid} not yet introduced in earlier passages`)
            }
          }
        }
      }

      // Add new words to introduced set
      for (const wid of p.newWordIds) {
        introducedWordIds.add(wid)
      }
    }

    // Check spiral window: every newWordId must appear in reviewWordIds of at least one of the next 5 passages
    for (let i = 0; i < passages.length; i++) {
      const p = passages[i]
      const windowEnd = Math.min(i + 5, passages.length - 1)
      if (windowEnd === i) continue // last passage — skip

      for (const wid of p.newWordIds) {
        let found = false
        for (let j = i + 1; j <= windowEnd; j++) {
          if (passages[j].reviewWordIds.includes(wid)) {
            found = true
            break
          }
        }
        if (!found) {
          error(`Passage ${p.id} (${level} seq ${p.sequence}): newWordId ${wid} not reviewed in next 5 passages`)
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
