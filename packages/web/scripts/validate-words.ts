/**
 * Validates all word JSON files in src/data/words/ for:
 * 1. Duplicate words (word+pos combination, case-insensitive)
 * 2. Duplicate IDs
 * 3. Invalid CEFR levels
 * 4. Missing required fields
 * 5. Invalid topic references
 * 6. Example count (must be exactly 2)
 */
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { isValidLevel } from '@english-learning/shared'

// Keep VALID_TOPICS hardcoded — topics.ts uses @/ alias which is unavailable in tsx script context
// Must match SUBTOPICS in src/data/topics.ts (18 topics across 5 domains)
const VALID_TOPICS = new Set([
  'daily-life', 'health', 'travel', 'food', 'sports',
  'work', 'business',
  'society', 'politics', 'law',
  'relationships', 'emotions', 'communication',
  'education', 'science', 'arts', 'technology', 'environment',
])
const REQUIRED_FIELDS = ['id', 'word', 'pos', 'phonetic', 'zh', 'en', 'examples', 'level'] as const

interface WordEntry {
  id: number
  word: string
  pos: string
  phonetic: string
  zh: string
  en: string
  examples: string[]
  level: string
  topics?: string[]
}

// Auto-discover all JSON files in src/data/words/
const wordsDir = join(import.meta.dirname, '..', 'src', 'data', 'words')
const jsonFiles = readdirSync(wordsDir).filter(f => f.endsWith('.json')).sort()

if (jsonFiles.length === 0) {
  console.error('ERROR: No JSON word files found in src/data/words/')
  process.exit(1)
}

const allWords: WordEntry[] = []
for (const file of jsonFiles) {
  const filePath = join(wordsDir, file)
  const words: WordEntry[] = JSON.parse(readFileSync(filePath, 'utf-8'))
  console.log(`  Loaded ${file}: ${words.length} words`)
  allWords.push(...words)
}

let errors = 0

function error(msg: string) {
  console.error(`ERROR: ${msg}`)
  errors++
}

// 1. Check required fields
for (const w of allWords) {
  for (const field of REQUIRED_FIELDS) {
    if (w[field] === undefined || w[field] === null) {
      error(`Word ID ${w.id} ("${w.word}"): missing required field "${field}"`)
    }
  }
}

// 2. Duplicate IDs
const idMap = new Map<number, WordEntry>()
for (const w of allWords) {
  if (idMap.has(w.id)) {
    error(`Duplicate ID ${w.id}: "${w.word}" and "${idMap.get(w.id)!.word}"`)
  }
  idMap.set(w.id, w)
}

// 3. Duplicate word+pos (case-insensitive)
const wordPosMap = new Map<string, WordEntry>()
for (const w of allWords) {
  const key = `${w.word.toLowerCase()}|${w.pos.toLowerCase()}`
  if (wordPosMap.has(key)) {
    error(`Duplicate word+pos: "${w.word}" (${w.pos}) — IDs ${wordPosMap.get(key)!.id} and ${w.id}`)
  }
  wordPosMap.set(key, w)
}

// 4. Invalid levels
for (const w of allWords) {
  if (!isValidLevel('en', w.level)) {
    error(`Word ID ${w.id} ("${w.word}"): invalid level "${w.level}"`)
  }
}

// 5. Invalid topic references
for (const w of allWords) {
  if (w.topics) {
    for (const t of w.topics) {
      if (!VALID_TOPICS.has(t)) {
        error(`Word ID ${w.id} ("${w.word}"): invalid topic "${t}"`)
      }
    }
  }
}

// 6. Example count (must be exactly 2)
for (const w of allWords) {
  if (!Array.isArray(w.examples) || w.examples.length !== 2) {
    error(`Word ID ${w.id} ("${w.word}"): expected 2 examples, got ${Array.isArray(w.examples) ? w.examples.length : 'non-array'}`)
  }
}

// Summary
console.log(`\nValidated ${allWords.length} words across ${jsonFiles.length} file(s)`)
if (errors > 0) {
  console.error(`\n${errors} error(s) found`)
  process.exit(1)
} else {
  console.log('All checks passed!')
}
