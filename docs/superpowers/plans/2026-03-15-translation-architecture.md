# Translation Architecture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple translations from word data into independent tables, enabling user-configurable multi-language translation display.

**Architecture:** New `word_translations` and `example_translations` tables store translations keyed by (word_id, locale). The API accepts a `locales` query parameter and returns only requested translations. Frontend reads `selectedLocales` from user settings and passes it through composables to API calls. Components render translations dynamically via `v-for`.

**Tech Stack:** D1/SQLite, Hono, Vue 3/Pinia, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-translation-architecture-design.md`

---

## Chunk 1: Shared Types + DB Schema + Translation Queries

### Task 1: Add LOCALE_NAMES registry

**Files:**
- Create: `packages/shared/src/locales.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create locales.ts**

```typescript
// packages/shared/src/locales.ts
export const LOCALE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh-CN': '中文',
  'ja': '日本語',
  'ko': '한국어',
}
```

- [ ] **Step 2: Re-export from index.ts**

In `packages/shared/src/index.ts`, add:
```typescript
export * from './locales'
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/locales.ts packages/shared/src/index.ts
git commit -m "feat: add LOCALE_NAMES registry in shared package"
```

---

### Task 2: Update Word type in shared types

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Update Word interface**

In `packages/shared/src/types.ts`, replace the `Word` interface. Remove `definitionNative` and `definitionTarget` fields, add `translations` and `exampleTranslations`:

```typescript
export interface Word {
  id: number
  word: string
  pos: string
  phonetic: string
  examples: string[]
  level: Level
  topics: TopicId[]
  languageId: string
  audioUrl?: string
  translations?: Record<string, string>
  exampleTranslations?: Record<string, string[]>
}
```

- [ ] **Step 2: Update UserSettings type**

In the same file, find the `UserSettings` interface and add `selectedLocales`:

```typescript
export interface UserSettings {
  currentLanguage: string
  audioAutoPlay: boolean
  selectedLocales: string[]
}
```

- [ ] **Step 3: Typecheck (expect failures)**

Run: `pnpm typecheck`
Expected: FAIL — many files still reference `definitionNative`/`definitionTarget`. This is expected; we fix them in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat: update Word type — replace definition fields with translations"
```

---

### Task 3: Create DB migration script

**Files:**
- Create: `packages/api/src/db/migrations/0002_translations.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Migration: Add word_translations and example_translations tables
-- Decouples translations from words table for multi-language support

-- 1. Create new tables
CREATE TABLE IF NOT EXISTS word_translations (
  word_id     INTEGER NOT NULL,
  locale      TEXT NOT NULL,
  translation TEXT NOT NULL,
  PRIMARY KEY (word_id, locale),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS example_translations (
  word_id       INTEGER NOT NULL,
  locale        TEXT NOT NULL,
  example_index INTEGER NOT NULL,
  translation   TEXT NOT NULL,
  PRIMARY KEY (word_id, locale, example_index),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- 2. Migrate existing word translations from words table
INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'en', definition_target FROM words
  WHERE definition_target IS NOT NULL AND definition_target != '';

INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'zh-CN', definition_native FROM words
  WHERE definition_native IS NOT NULL AND definition_native != '';

-- 3. Old columns (definition_native, definition_target) left in place
--    D1/SQLite does not support DROP COLUMN.
--    Application code no longer reads/writes these columns.
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/db/migrations/0002_translations.sql
git commit -m "feat: add migration for word_translations and example_translations tables"
```

---

### Task 4: Create translation query functions

**Files:**
- Create: `packages/api/src/db/queries/translations.ts`

- [ ] **Step 1: Write translation queries**

```typescript
// packages/api/src/db/queries/translations.ts
import type { D1Database } from '@cloudflare/workers-types'
import type { Word } from '@english-learning/shared'
import { LOCALE_NAMES } from '@english-learning/shared'

export interface LocaleInfo {
  locale: string
  name: string
}

// Shared helper: merge translations into word arrays. Used by words.ts and userWords.ts.
export async function mergeTranslations(
  db: D1Database,
  words: Word[],
  locales?: string[]
): Promise<Word[]> {
  if (!locales || locales.length === 0 || words.length === 0) return words
  const ids = words.map((w) => w.id)
  const [translations, exampleTranslations] = await Promise.all([
    getTranslationsForWords(db, ids, locales),
    getExampleTranslationsForWords(db, ids, locales),
  ])
  return words.map((w) => ({
    ...w,
    translations: translations[w.id] ?? {},
    exampleTranslations: exampleTranslations[w.id] ?? {},
  }))
}

export async function getAvailableLocales(
  db: D1Database,
  languageId: string
): Promise<LocaleInfo[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT wt.locale
       FROM word_translations wt
       JOIN words w ON wt.word_id = w.id
       WHERE w.language_id = ?`
    )
    .bind(languageId)
    .all<{ locale: string }>()

  return (result.results ?? []).map((r) => ({
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

  const idPlaceholders = wordIds.map(() => '?').join(',')
  const localePlaceholders = locales.map(() => '?').join(',')

  const result = await db
    .prepare(
      `SELECT word_id, locale, translation
       FROM word_translations
       WHERE word_id IN (${idPlaceholders})
         AND locale IN (${localePlaceholders})`
    )
    .bind(...wordIds, ...locales)
    .all<{ word_id: number; locale: string; translation: string }>()

  const map: Record<number, Record<string, string>> = {}
  for (const row of result.results ?? []) {
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

  const idPlaceholders = wordIds.map(() => '?').join(',')
  const localePlaceholders = locales.map(() => '?').join(',')

  const result = await db
    .prepare(
      `SELECT word_id, locale, example_index, translation
       FROM example_translations
       WHERE word_id IN (${idPlaceholders})
         AND locale IN (${localePlaceholders})
       ORDER BY word_id, locale, example_index`
    )
    .bind(...wordIds, ...locales)
    .all<{ word_id: number; locale: string; example_index: number; translation: string }>()

  const map: Record<number, Record<string, string[]>> = {}
  for (const row of result.results ?? []) {
    if (!map[row.word_id]) map[row.word_id] = {}
    if (!map[row.word_id][row.locale]) map[row.word_id][row.locale] = []
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
      `INSERT OR REPLACE INTO word_translations (word_id, locale, translation)
       VALUES (?, ?, ?)`
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
      `INSERT OR REPLACE INTO example_translations (word_id, locale, example_index, translation)
       VALUES (?, ?, ?, ?)`
    )
    .bind(wordId, locale, exampleIndex, translation)
    .run()
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/db/queries/translations.ts
git commit -m "feat: add translation query functions (CRUD + batch fetch)"
```

---

### Task 5: Update words query to merge translations

**Files:**
- Modify: `packages/api/src/db/queries/words.ts`

- [ ] **Step 1: Update rowToWord to remove definition fields**

In `packages/api/src/db/queries/words.ts`, update the `WordRow` interface to remove `definition_native` and `definition_target`. Update `rowToWord()` to remove those mappings:

Remove from `WordRow`:
```typescript
definition_native: string | null
definition_target: string | null
```

In `rowToWord()`, remove:
```typescript
definitionNative: row.definition_native,
definitionTarget: row.definition_target,
```

Also remove `definitionNative` and `definitionTarget` from `InsertWordData` interface and the `insertWord()` function's SQL and bind params. The INSERT should no longer include `definition_native` or `definition_target` columns.

- [ ] **Step 2: Add translation merging to getWords, getWordById, getWordsByIds**

Import translation functions at top:
```typescript
import { getTranslationsForWords, getExampleTranslationsForWords } from './translations'
```

Import the shared `mergeTranslations` helper from `translations.ts`:
```typescript
import { mergeTranslations } from './translations'
```

Update function signatures:
- `getWords(db, opts)` → `getWords(db, opts)` where opts gains `locales?: string[]`. After building the words array, call `mergeTranslations(db, words, opts.locales)` and return the result.
- `getWordById(db, id)` → `getWordById(db, id, locales?: string[])`. After fetching the word, call `mergeTranslations(db, [word], locales)` and return `result[0]`.
- `getWordsByIds(db, ids)` → `getWordsByIds(db, ids, locales?: string[])`. After fetching words, call `mergeTranslations(db, words, locales)` and return.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: Still fails (downstream files not yet updated), but `packages/api` query files should be clean.

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/db/queries/words.ts
git commit -m "feat: words queries merge translations from word_translations table"
```

---

### Task 6: Update userWords query to use translations

**Files:**
- Modify: `packages/api/src/db/queries/userWords.ts`

- [ ] **Step 1: Remove definition fields from UserWordRow and rowToWord**

Remove `definition_native` and `definition_target` from `UserWordRow` interface.
Remove `definitionNative` and `definitionTarget` mappings from `rowToWord()`.
Remove them from `CreateUserWordData` interface and `insertUserWordStatement()` SQL/bind params.

- [ ] **Step 2: Add translation merging to getUserWords**

Import `mergeTranslations` from `./translations`. After fetching user words, call `mergeTranslations(db, words, locales)`. Add `locales?: string[]` parameter to `getUserWords()`.

```typescript
import { mergeTranslations } from './translations'
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/queries/userWords.ts
git commit -m "feat: userWords queries use word_translations table"
```

---

### Task 7: Update userWordService

**Files:**
- Modify: `packages/api/src/services/userWordService.ts`

- [ ] **Step 1: Update CreateUserWordInput**

Replace `definitionNative`/`definitionTarget` with `translations`:

```typescript
export interface CreateUserWordInput {
  word: string
  languageId: string
  pos?: string
  phonetic?: string
  translations?: Record<string, string>  // locale -> translation
  examples?: string[]
  topics?: string[]
}
```

- [ ] **Step 2: Update createUserWord function**

After calling `insertWord()` to get `wordId`, insert translations:

```typescript
// Insert translations
if (data.translations) {
  for (const [locale, translation] of Object.entries(data.translations)) {
    await insertTranslation(db, wordId, locale, translation)
  }
}
```

Import `insertTranslation` from `./db/queries/translations` (adjust path as needed).

Remove `definitionNative`/`definitionTarget` from the `insertWord()` call data.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/services/userWordService.ts
git commit -m "feat: userWordService writes translations to word_translations table"
```

---

## Chunk 2: API Routes

### Task 8: Update words route for locales parameter

**Files:**
- Modify: `packages/api/src/routes/words.ts`

- [ ] **Step 1: Parse locales from query params**

In the GET `/` handler, parse `locales` from query string:

```typescript
const localesParam = c.req.query('locales')
const locales = localesParam ? localesParam.split(',').filter(Boolean) : undefined
```

Pass `locales` into `getWords(db, { ...opts, locales })`.

- [ ] **Step 2: Same for GET /:id**

```typescript
const localesParam = c.req.query('locales')
const locales = localesParam ? localesParam.split(',').filter(Boolean) : undefined
const word = await getWordById(db, id, locales)
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/routes/words.ts
git commit -m "feat: words routes accept locales query parameter"
```

---

### Task 9: Create translations route

**Files:**
- Create: `packages/api/src/routes/translations.ts`
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Create translations route**

```typescript
// packages/api/src/routes/translations.ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getAvailableLocales } from '../db/queries/translations'

const app = new Hono<{ Bindings: Env }>()

app.get('/locales', async (c) => {
  const lang = c.req.query('lang') ?? 'en'
  const db = c.env.DB
  const locales = await getAvailableLocales(db, lang)
  return c.json({ data: locales })
})

export default app
```

- [ ] **Step 2: Mount in index.ts**

In `packages/api/src/index.ts`, import and mount:

```typescript
import translations from './routes/translations'
```

Add alongside other public routes (before auth middleware):
```typescript
app.route('/api/translations', translations)
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/routes/translations.ts packages/api/src/index.ts
git commit -m "feat: add /api/translations/locales endpoint"
```

---

### Task 10: Update passages route for locales

**Files:**
- Modify: `packages/api/src/routes/passages.ts`
- Modify: `packages/api/src/db/queries/passages.ts`

- [ ] **Step 1: Update passages route GET /:id**

In `packages/api/src/routes/passages.ts`, the GET `/:id` handler currently calls `getWordsByIds(db, wordIds)`. Add locales parsing and pass through:

```typescript
const localesParam = c.req.query('locales')
const locales = localesParam ? localesParam.split(',').filter(Boolean) : undefined
const words = wordIds.length > 0 ? await getWordsByIds(db, wordIds, locales) : []
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/routes/passages.ts
git commit -m "feat: passages route passes locales to word queries"
```

---

### Task 11: Update user-words route

**Files:**
- Modify: `packages/api/src/routes/userWords.ts` (if it exists, or wherever user word creation is routed)

- [ ] **Step 1: Update create endpoint payload**

The POST handler for creating user words should accept `translations` in the request body instead of `definitionNative`/`definitionTarget`. Pass `translations` to `createUserWord()`.

- [ ] **Step 2: Update GET endpoint**

Parse `locales` from query params and pass to `getUserWords()`:
```typescript
const localesParam = c.req.query('locales')
const locales = localesParam ? localesParam.split(',').filter(Boolean) : undefined
const words = await getUserWords(db, userId, langId, locales)
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/routes/userWords.ts
git commit -m "feat: user-words route uses translations format"
```

---

## Chunk 3: Frontend API + Stores

### Task 12: Create translations API client

**Files:**
- Create: `packages/web/src/api/translations.ts`

- [ ] **Step 1: Write API client**

Note: `apiFetch` auto-unwraps `json.data`, so the return type is the inner data directly.

```typescript
// packages/web/src/api/translations.ts
import { apiFetch } from './client'

export interface LocaleInfo {
  locale: string
  name: string
}

export async function getAvailableLocales(lang: string): Promise<LocaleInfo[]> {
  return apiFetch<LocaleInfo[]>(`/api/translations/locales?lang=${lang}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/api/translations.ts
git commit -m "feat: add translations API client"
```

---

### Task 13: Update words API client with locales

**Files:**
- Modify: `packages/web/src/api/words.ts`

- [ ] **Step 1: Add locales to GetWordsOpts and functions**

Add `locales?: string[]` to `GetWordsOpts`. In `getWords()`, serialize to query string:

```typescript
if (opts.locales?.length) params.set('locales', opts.locales.join(','))
```

Update `getWordById()` to accept optional `locales` parameter (note: `apiFetch` auto-unwraps `json.data`):

```typescript
export async function getWordById(id: number, locales?: string[]): Promise<Word> {
  const params = locales?.length ? `?locales=${locales.join(',')}` : ''
  return apiFetch(`/api/words/${id}${params}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/api/words.ts
git commit -m "feat: words API client supports locales parameter"
```

---

### Task 14: Update passages API client with locales

**Files:**
- Modify: `packages/web/src/api/passages.ts`

- [ ] **Step 1: Add locales to getPassageById**

Note: `apiFetch` auto-unwraps `json.data`.

```typescript
export async function getPassageById(id: number, locales?: string[]): Promise<{ passage: Passage; words: Word[] }> {
  const params = locales?.length ? `?locales=${locales.join(',')}` : ''
  return apiFetch(`/api/passages/${id}${params}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/api/passages.ts
git commit -m "feat: passages API client supports locales parameter"
```

---

### Task 15: Update userWords API client

**Files:**
- Modify: `packages/web/src/api/userWords.ts`

- [ ] **Step 1: Update createUserWord payload**

Replace `definitionNative`/`definitionTarget` fields with `translations`:

```typescript
export async function createUserWord(data: {
  languageId: string
  word: string
  pos?: string
  phonetic?: string
  translations?: Record<string, string>
  examples?: string[]
  topics?: string[]
}) {
  return apiFetch('/api/user-words', { method: 'POST', body: JSON.stringify(data) })
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/api/userWords.ts
git commit -m "feat: userWords API client uses translations format"
```

---

### Task 16: Update settings store

**Files:**
- Modify: `packages/web/src/stores/settings.ts`

- [ ] **Step 1: Update default settings**

Add `selectedLocales` to the default settings object. The default should be computed on first load:

```typescript
function getDefaultLocales(): string[] {
  const browserLocale = navigator.language  // e.g. 'zh-CN'
  const target = settings.value.currentLanguage || 'en'
  const locales = [target]
  if (browserLocale && !locales.includes(browserLocale)) {
    locales.push(browserLocale)
  }
  return locales
}
```

In `loadSettings()`, after loading from API, if `selectedLocales` is empty or undefined, set it to `getDefaultLocales()`.

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/stores/settings.ts
git commit -m "feat: settings store supports selectedLocales with browser locale default"
```

---

### Task 17: Update srs store (addUserWordFromFreeTooltip)

**Files:**
- Modify: `packages/web/src/stores/srs.ts`

- [ ] **Step 1: Update addUserWordFromFreeTooltip**

The function currently passes `definitionNative` and `definitionTarget` to `userWordsApi.createUserWord()`. Change to pass `translations`:

Note: the existing parameter type is `Omit<Word, 'id'>`, keep it as-is.

```typescript
async function addUserWordFromFreeTooltip(wordData: Omit<Word, 'id'>) {
  await userWordsApi.createUserWord({
    languageId: wordData.languageId,
    word: wordData.word,
    pos: wordData.pos,
    phonetic: wordData.phonetic,
    translations: wordData.translations,
    examples: wordData.examples,
    topics: wordData.topics as string[],
  })
  await loadCards()
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/stores/srs.ts
git commit -m "feat: srs store passes translations format to user word API"
```

---

## Chunk 4: Frontend Composables

### Task 18: Update useStudySession

**Files:**
- Modify: `packages/web/src/composables/useStudySession.ts`

- [ ] **Step 1: Import settings store and pass locales**

```typescript
import { useSettingsStore } from '@/stores/settings'
```

In `loadWord()`, pass locales to API:
```typescript
const settingsStore = useSettingsStore()
const res = await wordsApi.getWordById(wordId, settingsStore.settings.selectedLocales)
```

- [ ] **Step 2: Clear word cache when locales change**

The module-level `wordCache` Map caches words without translations awareness. Clear it when study session starts to ensure fresh translations:
```typescript
wordCache.clear()  // at the start of session initialization
```

- [ ] **Step 3: Fix definitionTarget reference**

In the `extraDefs` computed, replace:
```typescript
if (d.definition !== currentWord.value.definitionTarget && defs.length < 2) {
```
with:
```typescript
const settingsStore = useSettingsStore()
const targetDef = currentWord.value.translations?.[settingsStore.settings.currentLanguage]
if (d.definition !== targetDef && defs.length < 2) {
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/composables/useStudySession.ts
git commit -m "feat: useStudySession passes locales and uses dynamic translation lookup"
```

---

### Task 19: Update useWordTooltip

**Files:**
- Modify: `packages/web/src/composables/useWordTooltip.ts`

- [ ] **Step 1: No API calls here**

`useWordTooltip` receives `words` as a ref (pre-fetched by `usePassageView` which already includes translations). The composable just looks up the word from the array by ID. No changes needed for locale passing — translations are already on the word object.

Verify that the composable does not reference `definitionNative`/`definitionTarget` directly. If it does, remove those references.

- [ ] **Step 2: Commit (if changes needed)**

```bash
git add packages/web/src/composables/useWordTooltip.ts
git commit -m "fix: useWordTooltip works with new Word type"
```

---

### Task 20: Update useWordModal

**Files:**
- Modify: `packages/web/src/composables/useWordModal.ts`

- [ ] **Step 1: Import settings store and pass locales**

```typescript
import { useSettingsStore } from '@/stores/settings'
```

In the `watch(wordId)` handler where it calls `wordsApi.getWordById()`:
```typescript
const settingsStore = useSettingsStore()
const res = await wordsApi.getWordById(newId, settingsStore.settings.selectedLocales)
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/composables/useWordModal.ts
git commit -m "feat: useWordModal passes locales to word API"
```

---

### Task 21: Update usePassageView

**Files:**
- Modify: `packages/web/src/composables/usePassageView.ts`

- [ ] **Step 1: Import settings store and pass locales to passage API**

```typescript
import { useSettingsStore } from '@/stores/settings'
```

In the passage loading logic where `getPassageById()` is called:
```typescript
const settingsStore = useSettingsStore()
const data = await passagesApi.getPassageById(Number(id), settingsStore.settings.selectedLocales)
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/composables/usePassageView.ts
git commit -m "feat: usePassageView passes locales to passage API"
```

---

### Task 22: Update useFreeWordLookup

**Files:**
- Modify: `packages/web/src/composables/useFreeWordLookup.ts`

- [ ] **Step 1: Update saveToDeck word construction**

In `saveToDeck()`, replace the Word object construction. Change:
```typescript
definitionNative: '',
definitionTarget: firstDef,
```
to:
```typescript
translations: { en: firstDef },
```

Remove any other references to `definitionNative`/`definitionTarget`.

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/composables/useFreeWordLookup.ts
git commit -m "feat: useFreeWordLookup constructs Word with translations format"
```

---

## Chunk 5: Frontend Views + Components

### Task 23: Update WordTooltip.vue

**Files:**
- Modify: `packages/web/src/components/WordTooltip.vue`

- [ ] **Step 1: Replace hardcoded definition divs**

Replace:
```html
<div class="reading-tooltip-zh">{{ word.definitionNative }}</div>
<div class="reading-tooltip-en">{{ word.definitionTarget }}</div>
```

With:
```html
<div v-for="(text, locale) in word.translations" :key="locale" class="reading-tooltip-def">
  {{ text }}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/WordTooltip.vue
git commit -m "feat: WordTooltip renders translations dynamically"
```

---

### Task 24: Update WordDetailModal.vue

**Files:**
- Modify: `packages/web/src/components/WordDetailModal.vue`

- [ ] **Step 1: Replace hardcoded definition divs**

Replace:
```html
<div class="card-zh" style="font-size:20px">{{ word.definitionNative }}</div>
<div class="card-en" style="margin-top:8px">{{ word.definitionTarget }}</div>
```

With:
```html
<div v-for="(text, locale) in word.translations" :key="locale" class="card-def" style="margin-top:8px">
  {{ text }}
</div>
```

- [ ] **Step 2: Update examples section**

If examples are shown with translations, add:
```html
<div v-for="(example, i) in word.examples" :key="i" class="example">
  <div class="example-text">{{ example }}</div>
  <div v-for="(texts, locale) in word.exampleTranslations" :key="locale" class="example-translation">
    {{ texts[i] }}
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/WordDetailModal.vue
git commit -m "feat: WordDetailModal renders translations dynamically"
```

---

### Task 25: Update StudyView.vue

**Files:**
- Modify: `packages/web/src/views/StudyView.vue`

- [ ] **Step 1: Replace hardcoded definition divs on card back**

Replace:
```html
<div class="card-zh">{{ currentWord.definitionNative }}</div>
<div class="card-en">{{ currentWord.definitionTarget }}</div>
```

With:
```html
<div v-for="(text, locale) in currentWord.translations" :key="locale" class="card-def">
  {{ text }}
</div>
```

- [ ] **Step 2: Update examples rendering**

If examples are displayed with translations, apply the same pattern as Task 24.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/views/StudyView.vue
git commit -m "feat: StudyView renders translations dynamically"
```

---

### Task 26a: Update wordListQuery store to pass locales

**Files:**
- Modify: `packages/web/src/stores/wordListQuery.ts`

The actual API call is in `wordListQuery.ts` store (`loadWords()` at line 26), not in WordListView.

- [ ] **Step 1: Import settings store and pass locales**

```typescript
import { useSettingsStore } from './settings'
```

In `loadWords()`, add locales to the API call:
```typescript
const settingsStore = useSettingsStore()
const result = await wordsApi.getWords({
  lang,
  page: page.value,
  pageSize: pageSize.value,
  level: level.value === 'all' ? undefined : level.value,
  topic: topic.value === 'all' ? undefined : topic.value,
  locales: settingsStore.settings.selectedLocales,
})
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/stores/wordListQuery.ts
git commit -m "feat: wordListQuery store passes locales to words API"
```

---

### Task 26b: Update WordListView.vue template

**Files:**
- Modify: `packages/web/src/views/WordListView.vue`

- [ ] **Step 1: Replace definition display**

Replace:
```html
<div v-if="w.definitionNative" class="word-item-zh">{{ w.definitionNative }}</div>
```

With:
```html
<div v-for="(text, locale) in w.translations" :key="locale" class="word-item-def">
  {{ text }}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/views/WordListView.vue
git commit -m "feat: WordListView renders translations dynamically"
```

---

### Task 27: Update SettingsView.vue

**Files:**
- Modify: `packages/web/src/views/SettingsView.vue`

- [ ] **Step 1: Add translation language checkboxes**

Import the translations API and settings store. Fetch available locales on mount:

```typescript
import { getAvailableLocales } from '@/api/translations'
import type { LocaleInfo } from '@/api/translations'

const availableLocales = ref<LocaleInfo[]>([])

onMounted(async () => {
  const lang = settingsStore.settings.currentLanguage || 'en'
  availableLocales.value = await getAvailableLocales(lang)
})
```

Add checkbox section in template:
```html
<section class="settings-section">
  <h3>Translation Languages</h3>
  <div v-for="loc in availableLocales" :key="loc.locale" class="setting-row">
    <label>
      <input
        type="checkbox"
        :value="loc.locale"
        :checked="settingsStore.settings.selectedLocales?.includes(loc.locale)"
        @change="toggleLocale(loc.locale)"
      />
      {{ loc.name }}
    </label>
  </div>
</section>
```

Add toggle handler:
```typescript
function toggleLocale(locale: string) {
  const current = settingsStore.settings.selectedLocales ?? []
  const updated = current.includes(locale)
    ? current.filter((l) => l !== locale)
    : [...current, locale]
  settingsStore.saveSettings({ selectedLocales: updated })
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/views/SettingsView.vue
git commit -m "feat: SettingsView adds translation language checkboxes"
```

---

## Chunk 6: Data Migration + Validation

### Task 28: Restructure word data files

**Files:**
- Create: `packages/api/scripts/data/words/b2.json`
- Create: `packages/api/scripts/data/translations/en/b2.json`
- Create: `packages/api/scripts/data/translations/zh-CN/b2.json`

- [ ] **Step 1: Write a one-time conversion script**

Write a temporary Node script to split existing `b2.json` into three files:

```javascript
// scripts/split-b2.js (temporary, delete after use)
const data = require('../packages/api/scripts/data/b2.json')

const words = data.map(({ zh, en, ...rest }) => rest)
const enTranslations = data.map((w) => ({ wordId: w.id, translation: w.en }))
const zhTranslations = data.map((w) => ({ wordId: w.id, translation: w.zh }))

const fs = require('fs')
const path = require('path')

fs.mkdirSync('packages/api/scripts/data/words', { recursive: true })
fs.mkdirSync('packages/api/scripts/data/translations/en', { recursive: true })
fs.mkdirSync('packages/api/scripts/data/translations/zh-CN', { recursive: true })

fs.writeFileSync('packages/api/scripts/data/words/b2.json', JSON.stringify(words, null, 2))
fs.writeFileSync('packages/api/scripts/data/translations/en/b2.json', JSON.stringify(enTranslations, null, 2))
fs.writeFileSync('packages/api/scripts/data/translations/zh-CN/b2.json', JSON.stringify(zhTranslations, null, 2))

console.log(`Split ${data.length} words into words/, translations/en/, translations/zh-CN/`)
```

- [ ] **Step 2: Run the script**

Run: `node scripts/split-b2.js`
Expected: Three new files created.

- [ ] **Step 3: Delete temporary script and old b2.json**

```bash
rm scripts/split-b2.js
rm packages/api/scripts/data/b2.json
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/scripts/data/
git commit -m "feat: restructure word data — separate words from translations"
```

---

### Task 29: Update migrate-content.ts

**Files:**
- Modify: `packages/api/scripts/migrate-content.ts`

- [ ] **Step 1: Rewrite to read new directory structure**

Update the script to:
1. Read all JSON files from `data/words/` (word core data)
2. Generate INSERT INTO words (without definition columns)
3. Scan `data/translations/` subdirectories
4. For each locale dir, read `*.json` → generate INSERT INTO word_translations
5. For each locale dir, read `*.examples.json` → generate INSERT INTO example_translations
6. Keep passage migration unchanged

The key change is replacing the single `b2.json` read with a directory scan, and generating `word_translations` INSERTs from the separate translation files.

- [ ] **Step 2: Test migration**

Run: `pnpm --filter @english-learning/api migrate:content`
Expected: Generates seed.sql with words + word_translations INSERTs.

- [ ] **Step 3: Commit**

```bash
git add packages/api/scripts/migrate-content.ts
git commit -m "feat: migrate-content reads separated word/translation data files"
```

---

### Task 30: Update validate-words.ts

**Files:**
- Modify: `packages/web/scripts/validate-words.ts`

- [ ] **Step 1: Update validation for new structure**

The script currently validates `b2.json` with fields `zh`, `en`. Update to:
1. Read word files from `packages/api/scripts/data/words/` — validate `id`, `word`, `pos`, `phonetic`, `examples`, `level`, `topics` (no `zh`/`en`)
2. Read translation files from `packages/api/scripts/data/translations/` — validate each entry has `wordId` and `translation`, and that `wordId` exists in word data
3. Remove `zh`/`en` from required fields

- [ ] **Step 2: Run validation**

Run: `pnpm --filter @english-learning/web validate:words`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/scripts/validate-words.ts
git commit -m "feat: validate-words supports separated word/translation file structure"
```

---

## Chunk 7: Typecheck + Integration Verification

### Task 31: Fix remaining type errors and verify

**Files:**
- Any files with remaining `definitionNative`/`definitionTarget` references

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck`
Expected: Identify any remaining references to old fields.

- [ ] **Step 2: Fix all remaining type errors**

Search across the codebase for any remaining `definitionNative`, `definitionTarget`, `definition_native`, `definition_target` references in TypeScript/Vue files that haven't been updated. Fix each one.

Common places to check:
- CSS class names referencing `-zh`/`-en` (cosmetic, not type errors — update if needed)
- Any test files

- [ ] **Step 3: Run typecheck again**

Run: `pnpm typecheck`
Expected: PASS across all packages.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: resolve all type errors from translation architecture migration"
```

---

### Task 32: Manual integration test

- [ ] **Step 1: Start dev server**

Run: `pnpm dev` (with API pointing to updated D1 instance or local)

- [ ] **Step 2: Verify word list shows translations**

Navigate to `/words`. Words should display translations based on settings.

- [ ] **Step 3: Verify passage tooltips**

Navigate to a passage. Tap a highlighted word — tooltip should show translations.

- [ ] **Step 4: Verify study flashcards**

Start a study session. Card back should show translations dynamically.

- [ ] **Step 5: Verify settings**

Navigate to `/settings`. Translation language checkboxes should appear. Toggle a language and verify word displays update.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: translation architecture migration complete"
```
