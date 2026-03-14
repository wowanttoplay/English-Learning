# Architecture Normalization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the codebase for AI-friendly development — small focused files, consistent patterns, clear layer boundaries — and prepare multi-language architecture.

**Architecture:** Extract business logic from routes into services, create query abstractions for raw SQL, extract composables from components that directly import stores, and add language strategy patterns to English-specific code (inflections, dictionary, tokenizer).

**Tech Stack:** Vue 3, TypeScript, Pinia, Hono, Cloudflare Workers D1

---

## Chunk 1: API Layer Cleanup (Tasks 1-4)

### Task 1: Export EASE_MULTIPLIER from shared package

**Files:**
- Modify: `packages/shared/src/srs-engine.ts:4-11`
- Modify: `packages/api/src/services/cardService.ts:10`
- Modify: `packages/api/src/routes/userWords.ts:8`

- [ ] **Step 1: Add export to shared srs-engine.ts**

In `packages/shared/src/srs-engine.ts`, add after line 11 (`export const MASTERED_INTERVAL = 21`):

```ts
export const EASE_MULTIPLIER = 1000
```

- [ ] **Step 2: Update cardService.ts to import from shared**

In `packages/api/src/services/cardService.ts`, change line 1-6 imports to include `EASE_MULTIPLIER`:

```ts
import {
  createNewCard, createKnownCard, rateCard as engineRateCard,
  markKnown as engineMarkKnown, unmarkKnown as engineUnmarkKnown,
  computeStats, buildQueue, today, EASE_MULTIPLIER
} from '@english-learning/shared'
```

Remove line 10:
```ts
const EASE_MULTIPLIER = 1000
```

- [ ] **Step 3: Update userWords.ts to import from shared**

In `packages/api/src/routes/userWords.ts`, change line 6:

```ts
import { createNewCard, today, EASE_MULTIPLIER } from '@english-learning/shared'
```

Remove line 8:
```ts
const EASE_MULTIPLIER = 1000
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck`
Expected: PASS — no type errors

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/srs-engine.ts packages/api/src/services/cardService.ts packages/api/src/routes/userWords.ts
git commit -m "refactor: unify EASE_MULTIPLIER to shared srs-engine"
```

---

### Task 2: Create typed error classes for API layer

**Files:**
- Create: `packages/api/src/errors.ts`
- Modify: `packages/api/src/services/cardService.ts:66,71`
- Modify: `packages/api/src/routes/cards.ts:42-51,66-72`

- [ ] **Step 1: Create errors.ts**

Create `packages/api/src/errors.ts`:

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class CardKnownError extends AppError {
  constructor() {
    super('CARD_KNOWN', 'Cannot rate a known card', 409)
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super('NOT_FOUND', `${entity} not found`, 404)
  }
}

export class MissingFieldError extends AppError {
  constructor(field: string) {
    super('MISSING_FIELD', `Missing required field: ${field}`, 400)
  }
}
```

- [ ] **Step 2: Update cardService.ts to throw typed errors**

In `packages/api/src/services/cardService.ts`, add import:

```ts
import { CardKnownError, NotFoundError } from '../errors'
```

Replace line 66:
```ts
  if (!raw) throw new Error('Card not found')
```
with:
```ts
  if (!raw) throw new NotFoundError('Card')
```

Replace line 71:
```ts
    throw new Error('Cannot rate a known card')
```
with:
```ts
    throw new CardKnownError()
```

Replace line 103:
```ts
    if (!existing) throw new Error('Card not found')
```
with:
```ts
    if (!existing) throw new NotFoundError('Card')
```

- [ ] **Step 3: Update cards.ts route — /rate handler**

In `packages/api/src/routes/cards.ts`, add import:

```ts
import { AppError } from '../errors'
```

Replace the catch block in `/rate` (lines 42-51):

```ts
  } catch (e) {
    if (e instanceof AppError) {
      return c.json({ error: e.message, code: e.code }, e.status as 400 | 404 | 409)
    }
    throw e
  }
```

- [ ] **Step 4: Update cards.ts route — /:wordId/known handler**

Replace the catch block in `/:wordId/known` (lines 66-72):

```ts
  } catch (e) {
    if (e instanceof AppError) {
      return c.json({ error: e.message, code: e.code }, e.status as 400 | 404 | 409)
    }
    throw e
  }
```

- [ ] **Step 5: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/errors.ts packages/api/src/services/cardService.ts packages/api/src/routes/cards.ts
git commit -m "refactor: introduce typed error classes for API layer"
```

---

### Task 3: Extract userWordService.ts

**Files:**
- Create: `packages/api/src/services/userWordService.ts`
- Modify: `packages/api/src/routes/userWords.ts`

- [ ] **Step 1: Create userWordService.ts**

Create `packages/api/src/services/userWordService.ts`:

```ts
import { createNewCard, today, EASE_MULTIPLIER } from '@english-learning/shared'
import type { Word } from '@english-learning/shared'
import { insertUserWordStatement } from '../db/queries/userWords'
import { upsertCardStatement } from '../db/queries/cards'
import { incrementLearnedStatement } from '../db/queries/history'
import { MissingFieldError } from '../errors'

export interface CreateUserWordInput {
  word: string
  languageId: string
  pos?: string
  phonetic?: string
  definitionNative?: string
  definitionTarget?: string
  examples?: string[]
  topics?: string[]
}

export async function createUserWord(
  db: D1Database, userId: number, data: CreateUserWordInput
): Promise<Word> {
  if (!data.word || !data.languageId) {
    throw new MissingFieldError('word and languageId')
  }

  // Insert into main words table (level='user') so ID doesn't collide
  const wordResult = await db
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

  if (!wordResult) {
    throw new Error('Failed to create word')
  }

  const wordId = wordResult.id

  // Track in user_words for per-user ownership
  await db.batch([
    insertUserWordStatement(db, userId, data),
  ])

  // Create SRS card
  const card = createNewCard(wordId)
  const dbCard = { ...card, ease: Math.round(card.ease * EASE_MULTIPLIER) }
  const dateStr = today()

  await db.batch([
    upsertCardStatement(db, userId, dbCard),
    incrementLearnedStatement(db, userId, dateStr),
  ])

  return {
    id: wordId,
    word: data.word,
    pos: data.pos ?? '',
    phonetic: data.phonetic ?? '',
    definitionNative: data.definitionNative ?? '',
    definitionTarget: data.definitionTarget ?? '',
    examples: data.examples ?? [],
    level: 'user',
    topics: (data.topics ?? []) as any,
    languageId: data.languageId,
  }
}
```

- [ ] **Step 2: Simplify userWords.ts route**

Replace `packages/api/src/routes/userWords.ts` entirely:

```ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getUserWords } from '../db/queries/userWords'
import { createUserWord } from '../services/userWordService'
import { AppError } from '../errors'

const userWords = new Hono<{ Bindings: Env }>()

// GET /api/user-words?lang=en
userWords.get('/', async (c) => {
  const userId = c.get('userId')
  const lang = c.req.query('lang') ?? 'en'
  const words = await getUserWords(c.env.DB, userId, lang)
  return c.json({ items: words })
})

// POST /api/user-words
userWords.post('/', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  try {
    const word = await createUserWord(c.env.DB, userId, data)
    return c.json(word, 201)
  } catch (e) {
    if (e instanceof AppError) {
      return c.json({ error: e.message, code: e.code }, e.status as 400 | 500)
    }
    throw e
  }
})

export default userWords
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/services/userWordService.ts packages/api/src/routes/userWords.ts
git commit -m "refactor: extract userWordService from route handler"
```

---

### Task 4: Create db/queries/passagesRead.ts

**Files:**
- Create: `packages/api/src/db/queries/passagesRead.ts`
- Modify: `packages/api/src/routes/passagesRead.ts`

- [ ] **Step 1: Create query file**

Create `packages/api/src/db/queries/passagesRead.ts`:

```ts
export async function getPassagesRead(
  db: D1Database, userId: number
): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT passage_id FROM passages_read WHERE user_id = ?')
    .bind(userId)
    .all<{ passage_id: number }>()
  return (results ?? []).map(r => r.passage_id)
}

export async function markPassageRead(
  db: D1Database, userId: number, passageId: number
): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO passages_read (user_id, passage_id) VALUES (?, ?)')
    .bind(userId, passageId)
    .run()
}
```

- [ ] **Step 2: Simplify route**

Replace `packages/api/src/routes/passagesRead.ts`:

```ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getPassagesRead, markPassageRead } from '../db/queries/passagesRead'

const passagesRead = new Hono<{ Bindings: Env }>()

// GET /api/user/passages-read
passagesRead.get('/', async (c) => {
  const userId = c.get('userId')
  const ids = await getPassagesRead(c.env.DB, userId)
  return c.json({ items: ids })
})

// POST /api/user/passages-read/:id
passagesRead.post('/:id', async (c) => {
  const userId = c.get('userId')
  const passageId = parseInt(c.req.param('id'), 10)
  if (isNaN(passageId)) return c.json({ error: 'Invalid passage ID', code: 'INVALID_PARAM' }, 400)

  await markPassageRead(c.env.DB, userId, passageId)
  return c.json({ ok: true })
})

export default passagesRead
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/db/queries/passagesRead.ts packages/api/src/routes/passagesRead.ts
git commit -m "refactor: extract passagesRead queries from route"
```

---

## Chunk 2: Composable Extractions (Tasks 5-7)

### Task 5: Extract useInflectionMatcher with language strategy

**Files:**
- Create: `packages/web/src/composables/useInflectionMatcher.ts`
- Modify: `packages/web/src/composables/usePassageView.ts:1-7,26-65`

- [ ] **Step 1: Create useInflectionMatcher.ts**

Create `packages/web/src/composables/useInflectionMatcher.ts`:

```ts
import { computed, type Ref } from 'vue'
import type { Word } from '@/types'

// English-specific suffix table — add per-language strategies as needed
// CJK languages will need morphological analysis (e.g., kuromoji for Japanese)

type InflectionStrategy = (words: Word[]) => Map<string, Word>

const englishInflections: InflectionStrategy = (words) => {
  const map = new Map<string, Word>()
  for (const w of words) {
    const base = w.word.toLowerCase()
    map.set(base, w)
    // Regular inflections
    map.set(base + 's', w)
    map.set(base + 'es', w)
    map.set(base + 'ed', w)
    map.set(base + 'ing', w)
    map.set(base + 'ly', w)
    map.set(base + 'er', w)
    map.set(base + 'est', w)
    map.set(base + 'ment', w)
    map.set(base + 'tion', w)
    map.set(base + 'ness', w)
    // -e drop: integrate → integrating, integrated, integration
    if (base.endsWith('e')) {
      map.set(base.slice(0, -1) + 'ing', w)
      map.set(base.slice(0, -1) + 'ed', w)
      map.set(base.slice(0, -1) + 'ion', w)
    }
    // -y to -ies/-ied: strategy → strategies, modify → modified
    if (base.endsWith('y')) {
      map.set(base.slice(0, -1) + 'ies', w)
      map.set(base.slice(0, -1) + 'ied', w)
    }
    // -is to -ize: emphasis → emphasize/emphasizes/emphasized/emphasizing
    if (base.endsWith('is')) {
      map.set(base.slice(0, -2) + 'ize', w)
      map.set(base.slice(0, -2) + 'izes', w)
      map.set(base.slice(0, -2) + 'ized', w)
      map.set(base.slice(0, -2) + 'izing', w)
    }
    // -le to -les: obstacle → obstacles
    if (base.endsWith('le')) {
      map.set(base.slice(0, -1) + 'es', w)
    }
    // -or/-er plurals: indicator → indicators
    if (base.endsWith('or') || base.endsWith('er')) {
      map.set(base + 's', w)
    }
  }
  return map
}

const strategies: Record<string, InflectionStrategy> = {
  en: englishInflections,
  // Future: ja, es, fr, de, etc.
}

export function useInflectionMatcher(words: Ref<Word[]>, lang: string = 'en') {
  return computed(() => {
    const strategy = strategies[lang] ?? strategies.en
    return strategy(words.value)
  })
}
```

- [ ] **Step 2: Update usePassageView.ts to use the new composable**

In `packages/web/src/composables/usePassageView.ts`, add import after line 7:

```ts
import { useInflectionMatcher } from '@/composables/useInflectionMatcher'
```

Replace lines 24-65 (the entire `wordsByText` computed block):

```ts
  // Build inflection map using language-aware strategy
  const wordsByText = useInflectionMatcher(passageWords)
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/composables/useInflectionMatcher.ts packages/web/src/composables/usePassageView.ts
git commit -m "refactor: extract useInflectionMatcher with language strategy pattern"
```

---

### Task 6: Create useWordTooltip composable

**Files:**
- Create: `packages/web/src/composables/useWordTooltip.ts`
- Modify: `packages/web/src/components/WordTooltip.vue:46-99`

- [ ] **Step 1: Create useWordTooltip.ts**

Create `packages/web/src/composables/useWordTooltip.ts`:

```ts
import { computed, type Ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import type { Word } from '@/types'

export function useWordTooltip(
  wordId: Ref<number | null>,
  words: Ref<Word[] | undefined>
) {
  const srsStore = useSrsStore()

  const word = computed(() => {
    if (wordId.value === null) return null
    return (words.value ?? []).find(w => w.id === wordId.value) ?? null
  })

  const cardState = computed(() => {
    if (wordId.value === null) return 'unseen'
    return srsStore.getCardState(wordId.value)
  })

  const stateLabel = computed(() => {
    switch (cardState.value) {
      case 'unseen': return 'Not in deck'
      case 'learning': return 'Learning'
      case 'relearning': return 'Relearning'
      case 'review': return 'Review'
      case 'mastered': return 'Mastered'
      case 'known': return 'Known'
      default: return ''
    }
  })

  function addToDeck() {
    if (wordId.value !== null) {
      srsStore.addWordFromReading(wordId.value)
    }
  }

  function markKnown() {
    if (wordId.value !== null) {
      srsStore.markAsKnown(wordId.value)
    }
  }

  function unmarkKnown() {
    if (wordId.value !== null) {
      srsStore.unmarkKnown(wordId.value)
    }
  }

  return {
    word,
    cardState,
    stateLabel,
    addToDeck,
    markKnown,
    unmarkKnown,
  }
}
```

- [ ] **Step 2: Update WordTooltip.vue to use composable**

Replace the `<script setup>` block in `packages/web/src/components/WordTooltip.vue` (lines 46-99):

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useWordTooltip } from '@/composables/useWordTooltip'
import type { Word } from '@/types'
import LevelBadge from '@/components/LevelBadge.vue'

const props = defineProps<{ wordId: number | null; words?: Word[] }>()
const emit = defineEmits<{ close: [] }>()
const audio = useAudio()

const { word, cardState, stateLabel, addToDeck, markKnown: doMarkKnown, unmarkKnown: doUnmarkKnown } = useWordTooltip(
  toRef(props, 'wordId'),
  toRef(props, 'words')
)

function markKnown() {
  doMarkKnown()
  emit('close')
}

function unmarkKnown() {
  doUnmarkKnown()
  emit('close')
}
</script>
```

Note: The template references `addToDeck`, `markKnown`, `unmarkKnown` — the template stays unchanged.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/composables/useWordTooltip.ts packages/web/src/components/WordTooltip.vue
git commit -m "refactor: extract useWordTooltip composable from WordTooltip component"
```

---

### Task 7: Create useWordModal composable

**Files:**
- Create: `packages/web/src/composables/useWordModal.ts`
- Modify: `packages/web/src/components/WordDetailModal.vue:52-102`

- [ ] **Step 1: Create useWordModal.ts**

Create `packages/web/src/composables/useWordModal.ts`:

```ts
import { computed, watch, ref, type Ref } from 'vue'
import { useSrsStore } from '@/stores/srs'
import { useDictionary } from '@/composables/useDictionary'
import * as wordsApi from '@/api/words'
import type { DictEntry, Word } from '@/types'

export function useWordModal(wordId: Ref<number | null>) {
  const srsStore = useSrsStore()
  const dict = useDictionary()

  const word = ref<Word | null>(null)
  const dictData = ref<DictEntry | null>(null)

  const state = computed(() => {
    if (wordId.value === null) return 'unseen'
    return srsStore.getCardState(wordId.value)
  })

  const card = computed(() => {
    if (wordId.value === null) return null
    return srsStore.getCard(wordId.value)
  })

  watch(wordId, async (newId) => {
    if (newId === null) {
      word.value = null
      dictData.value = null
      return
    }
    try {
      word.value = await wordsApi.getWordById(newId)
    } catch {
      word.value = null
      return
    }
    if (word.value) {
      dictData.value = dict.getDictCached(word.value.word)
      if (!dictData.value) {
        await dict.fetchDictData(word.value.word)
        dictData.value = dict.getDictCached(word.value.word)
      }
    }
  }, { immediate: true })

  return {
    word,
    state,
    card,
    dictData,
  }
}
```

- [ ] **Step 2: Update WordDetailModal.vue to use composable**

Replace the `<script setup>` block in `packages/web/src/components/WordDetailModal.vue` (lines 52-102):

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useWordModal } from '@/composables/useWordModal'
import LevelBadge from '@/components/LevelBadge.vue'

const props = defineProps<{ wordId: number | null }>()
const emit = defineEmits<{ close: [] }>()

const audio = useAudio()
const { word, state, card, dictData } = useWordModal(toRef(props, 'wordId'))
</script>
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/composables/useWordModal.ts packages/web/src/components/WordDetailModal.vue
git commit -m "refactor: extract useWordModal composable from WordDetailModal component"
```

---

## Chunk 3: Multi-Language Preparation (Tasks 8-9)

### Task 8: Parameterize dict-api.ts by language

**Files:**
- Modify: `packages/web/src/lib/dict-api.ts`
- Modify: `packages/web/src/composables/useDictionary.ts`
- Modify: `packages/web/src/composables/useFreeWordLookup.ts:81,93`

- [ ] **Step 1: Update dict-api.ts**

Replace `packages/web/src/lib/dict-api.ts` entirely:

```ts
import type { DictEntry } from '@/types'

// Per-language dictionary API base URLs
// Add new providers here as languages are added
const DICT_PROVIDERS: Record<string, string> = {
  en: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  // Future: ja, es, fr, etc.
}

const DICT_CACHE_PREFIX = 'dict_cache_'
const DICT_CACHE_MAX = 500
const MIN_REQUEST_INTERVAL = 100
const memCache = new Map<string, DictEntry>()
let lastRequestTime = 0

function cacheKey(lang: string): string {
  return `${DICT_CACHE_PREFIX}${lang}`
}

function memCacheKey(word: string, lang: string): string {
  return `${lang}:${word}`
}

function loadDictCache(lang: string): Record<string, DictEntry> {
  try {
    const raw = localStorage.getItem(cacheKey(lang))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

function saveDictCache(lang: string, cache: Record<string, DictEntry>): void {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(cache))
  } catch {
    // ignore quota errors
  }
}

function rateLimitDelay(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed >= MIN_REQUEST_INTERVAL) {
    lastRequestTime = now
    return Promise.resolve()
  }
  const delay = MIN_REQUEST_INTERVAL - elapsed
  return new Promise(resolve => {
    setTimeout(() => {
      lastRequestTime = Date.now()
      resolve()
    }, delay)
  })
}

async function lookup(word: string, lang: string = 'en'): Promise<DictEntry | null> {
  const mk = memCacheKey(word, lang)
  const mem = memCache.get(mk)
  if (mem) return mem

  const cache = loadDictCache(lang)
  if (cache[word]) {
    memCache.set(mk, cache[word])
    return cache[word]
  }

  const apiBase = DICT_PROVIDERS[lang]
  if (!apiBase) return null

  try {
    await rateLimitDelay()
    const response = await fetch(apiBase + encodeURIComponent(word))
    if (!response.ok) return null

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const result: DictEntry = {
      word: entry.word,
      phonetics: [],
      meanings: []
    }

    if (entry.phonetics) {
      for (const p of entry.phonetics) {
        if (p.text) {
          result.phonetics.push({
            text: p.text,
            audio: p.audio || null
          })
        }
      }
    }

    if (entry.meanings) {
      for (const m of entry.meanings) {
        const meaning = {
          partOfSpeech: m.partOfSpeech,
          definitions: [] as { definition: string; example: string | null }[]
        }
        if (m.definitions) {
          for (const d of m.definitions.slice(0, 3)) {
            meaning.definitions.push({
              definition: d.definition,
              example: d.example || null
            })
          }
        }
        result.meanings.push(meaning)
      }
    }

    cache[word] = result
    const keys = Object.keys(cache)
    if (keys.length > DICT_CACHE_MAX) {
      const removeCount = keys.length - DICT_CACHE_MAX
      for (let i = 0; i < removeCount; i++) {
        delete cache[keys[i]]
      }
    }
    saveDictCache(lang, cache)
    memCache.set(mk, result)
    return result
  } catch (e) {
    console.warn('Dict API lookup failed for:', word, e)
    return null
  }
}

function getCached(word: string, lang: string = 'en'): DictEntry | null {
  const mk = memCacheKey(word, lang)
  const mem = memCache.get(mk)
  if (mem) return mem

  const cache = loadDictCache(lang)
  if (cache[word]) {
    memCache.set(mk, cache[word])
    return cache[word]
  }
  return null
}

function clearCache(lang?: string): void {
  if (lang) {
    // Clear specific language cache
    for (const [key] of memCache) {
      if (key.startsWith(`${lang}:`)) memCache.delete(key)
    }
    localStorage.removeItem(cacheKey(lang))
  } else {
    // Clear all language caches
    memCache.clear()
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(DICT_CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    // Also remove legacy key for migration
    localStorage.removeItem('dict_cache')
  }
}

export const DictAPI = {
  lookup,
  getCached,
  clearCache
}
```

- [ ] **Step 2: Update useDictionary.ts to pass language**

Replace `packages/web/src/composables/useDictionary.ts`:

```ts
import { DictAPI } from '@/lib/dict-api'

export function useDictionary() {
  function fetchDictData(word: string, lang: string = 'en'): Promise<void> {
    if (!DictAPI.getCached(word, lang)) {
      return DictAPI.lookup(word, lang).then(() => {})
    }
    return Promise.resolve()
  }

  function getDictCached(word: string, lang: string = 'en') {
    return DictAPI.getCached(word, lang)
  }

  function clearCache(lang?: string): void {
    DictAPI.clearCache(lang)
  }

  return {
    fetchDictData,
    getDictCached,
    clearCache
  }
}
```

- [ ] **Step 3: Update useFreeWordLookup.ts**

In `packages/web/src/composables/useFreeWordLookup.ts`, update the `DictAPI` calls to pass language.

Replace line 81:
```ts
      const cached = DictAPI.getCached(newWord)
```
with:
```ts
      const cached = DictAPI.getCached(newWord, 'en')
```

Replace line 93:
```ts
      const result = await DictAPI.lookup(newWord)
```
with:
```ts
      const result = await DictAPI.lookup(newWord, 'en')
```

Note: `useFreeWordLookup` hardcodes `'en'` for now. When multi-language UI is built, it will accept a `lang` parameter.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/dict-api.ts packages/web/src/composables/useDictionary.ts packages/web/src/composables/useFreeWordLookup.ts
git commit -m "refactor: parameterize dict-api by language for multi-language support"
```

---

### Task 9: Add language strategy to sentence splitter

**Files:**
- Modify: `packages/web/src/lib/sentence-splitter.ts:37`
- Modify: `packages/web/src/composables/usePassageView.ts` (line referencing `splitSentences`)
- Modify: `packages/web/scripts/generate-timestamps.ts:53`

- [ ] **Step 1: Update splitSentences signature**

In `packages/web/src/lib/sentence-splitter.ts`, change the function signature on line 37:

```ts
export function splitSentences(text: string, _lang: string = 'en'): Sentence[] {
```

Note: `_lang` is prefixed with underscore because `noUnusedParameters: true` is set in tsconfig. The parameter is reserved for future per-language sentence boundary rules.

Add a comment and constant before the function:

```ts
// Tokenizer patterns per language
// Latin-script languages share a base pattern; CJK will need morphological analysis
const WORD_PATTERNS: Record<string, RegExp> = {
  en: /([a-zA-ZÀ-ÿ'-]+)/,
  // Future: ja (needs kuromoji/mecab), zh (needs jieba), etc.
}
```

- [ ] **Step 2: Export WORD_PATTERNS for use by usePassageView**

Add this export at the bottom of `sentence-splitter.ts`:

```ts
export function getWordPattern(lang: string = 'en'): RegExp {
  return WORD_PATTERNS[lang] ?? WORD_PATTERNS.en
}
```

- [ ] **Step 3: Update usePassageView.ts tokenizer**

In `packages/web/src/composables/usePassageView.ts`, add import:

```ts
import { splitSentences, getWordPattern } from '@/lib/sentence-splitter'
```

(Replace the existing `import { splitSentences }` line.)

Replace line 89 (the tokenizer split):
```ts
      const tokens = sentenceText.split(/([a-zA-Z'-]+)/)
```
with:
```ts
      const tokens = sentenceText.split(getWordPattern())
```

And replace line 91 (the token test):
```ts
        if (/^[a-zA-Z'-]+$/.test(token)) {
```
with:
```ts
        if (/^[a-zA-ZÀ-ÿ'-]+$/.test(token)) {
```

- [ ] **Step 4: Update generate-timestamps.ts type cast**

In `packages/web/scripts/generate-timestamps.ts`, replace line 53:

```ts
  return mod.splitSentences as (text: string, _lang?: string) => Array<{ index: number; text: string; start: number; end: number }>
```

- [ ] **Step 5: Verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/lib/sentence-splitter.ts packages/web/src/composables/usePassageView.ts packages/web/scripts/generate-timestamps.ts
git commit -m "refactor: add language strategy to sentence splitter for multi-language prep"
```

---

## Chunk 4: Documentation Update (Task 10)

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update directory structure section**

Add new files to the directory structure in CLAUDE.md:

Under `packages/api/src/`:
```
    errors.ts                  # Typed error classes (AppError, NotFoundError, CardKnownError, MissingFieldError)
    services/
      cardService.ts           # Card business logic
      userWordService.ts       # User word creation + SRS card atomically
```

Under `db/queries/`:
```
        passagesRead.ts        # Passage read state queries
```

Under `packages/web/src/composables/`:
```
      useInflectionMatcher.ts  # Language-aware word inflection matching (strategy pattern)
      useWordTooltip.ts        # WordTooltip business logic (SRS state, actions)
      useWordModal.ts          # WordDetailModal data loading (word, dict, SRS)
```

- [ ] **Step 2: Add architecture patterns section**

Add a new section after "Key conventions":

```markdown
### Architecture Patterns

- **Typed errors (API):** Services throw `AppError` subclasses (`NotFoundError`, `CardKnownError`, `MissingFieldError`). Routes catch `AppError` and return `{ error, code }` with appropriate HTTP status. Never match on error message strings.
- **Route → Service → Query:** Routes are thin HTTP handlers. Business logic lives in `services/`. Raw SQL lives in `db/queries/`. Routes never construct SQL directly.
- **Language strategy pattern:** English-specific logic is isolated behind strategy maps keyed by language code. Files using this pattern: `useInflectionMatcher.ts` (word inflections), `dict-api.ts` (dictionary providers), `sentence-splitter.ts` (word tokenization patterns). To add a new language, add an entry to each strategy map.
- **Component purity:** Components (`components/`) must not import stores or API modules directly. Business logic lives in composables (`useWordTooltip`, `useWordModal`). Components receive reactive state and callbacks from composables.
```

- [ ] **Step 3: Update EASE_MULTIPLIER documentation**

In the "Key conventions" section, add:
```markdown
- **EASE_MULTIPLIER:** Defined once in `packages/shared/src/srs-engine.ts`. Used by `cardService.ts` and `userWordService.ts` to convert between float ease (domain) and integer ease (DB storage). Never define locally.
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new architecture patterns and file structure"
```
