# Translation Architecture Design

**Date:** 2026-03-15
**Status:** Reviewed

## Problem

The current system hardcodes two translation fields (`definition_native` for Chinese, `definition_target` for English) directly in the `words` table. This prevents:

- Supporting multiple translation languages (Japanese, Korean, Spanish, etc.)
- Letting users choose which translations to display
- Future multi-language learning (e.g., Japanese courses for Chinese speakers)
- Independent management of translation data per language

## Goals

1. Decouple translations from word data — words and translations stored independently
2. User-configurable translation display — users can check/uncheck which languages to show
3. Default to target language + user's regional language
4. Support example sentence translations with the same flexibility
5. Only show translation languages that have data available
6. Data files organized by language for independent authoring

## Non-Goals

- Machine translation / auto-translate (translations are pre-authored)
- Per-word language override (all words in a language share the same available translations)
- Separate configuration for definition vs example translations (shared setting)

## Design

### 1. Database Schema

#### New Tables

```sql
CREATE TABLE word_translations (
  word_id     INTEGER NOT NULL,
  locale      TEXT NOT NULL,        -- 'en', 'zh-CN', 'ja', 'ko', etc.
  translation TEXT NOT NULL,
  PRIMARY KEY (word_id, locale),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE example_translations (
  word_id       INTEGER NOT NULL,
  locale        TEXT NOT NULL,
  example_index INTEGER NOT NULL,   -- 0-based index into word.examples array
  translation   TEXT NOT NULL,
  PRIMARY KEY (word_id, locale, example_index),  -- locale before index for efficient batch queries
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);
```

#### Words Table Changes

Remove `definition_native` and `definition_target` columns. Since D1/SQLite does not support `DROP COLUMN`, these columns remain in the schema but are no longer read or written by application code.

```sql
-- words table (after change, conceptual — old columns ignored)
CREATE TABLE words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id TEXT NOT NULL,
  word        TEXT NOT NULL,
  pos         TEXT,
  phonetic    TEXT,
  examples    TEXT,           -- JSON array of strings (source language)
  level       TEXT NOT NULL,
  topics      TEXT,           -- JSON array of TopicId
  audio_url   TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);
```

#### user_words Table

Same change: `definition_native` and `definition_target` are no longer used. User word translations go into `word_translations` table.

#### Migration Script: `0002_translations.sql`

```sql
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

-- 2. Migrate existing word translations
INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'en', definition_target FROM words
  WHERE definition_target IS NOT NULL AND definition_target != '';

INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'zh-CN', definition_native FROM words
  WHERE definition_native IS NOT NULL AND definition_native != '';

-- 3. user_words translations: user words already exist in the `words` table
--    with level='user', so they are covered by the migration above.
--    No separate user_words migration needed.

-- 4. Old columns (definition_native, definition_target) left in place
--    but no longer read/written by application code.
```

### 2. Data File Structure

Translation data separated from word data, organized by language:

```
packages/api/scripts/data/
  words/
    b2.json              # Word core data (no translations)
    b1.json
    a1.json
    a2.json
    c1.json
  translations/
    en/
      b2.json            # English definitions for B2 words
      b2.examples.json   # English example translations (optional for English)
    zh-CN/
      b2.json            # Chinese translations for B2 words
      b2.examples.json   # Chinese example sentence translations
```

#### words/b2.json entry:
```json
{
  "id": 1,
  "word": "abandon",
  "pos": "verb",
  "phonetic": "/əˈbændən/",
  "examples": [
    "The crew abandoned the sinking ship.",
    "She abandoned her plans to go abroad."
  ],
  "level": "B2",
  "topics": ["emotions", "daily-life"]
}
```

#### translations/en/b2.json entry:
```json
{ "wordId": 1, "translation": "to leave somebody/something and not return" }
```

#### translations/zh-CN/b2.json entry:
```json
{ "wordId": 1, "translation": "放弃；遗弃" }
```

#### translations/zh-CN/b2.examples.json entry:
```json
{ "wordId": 1, "index": 0, "translation": "船员们弃船逃生。" }
```

### 3. Shared Types

```typescript
// packages/shared/src/types.ts
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
  translations?: Record<string, string>          // locale -> translation
  exampleTranslations?: Record<string, string[]>  // locale -> translations[]
}
```

`translations` and `exampleTranslations` are populated by the API based on the requested locales. They are absent when no locales are requested.

### 4. API Changes

#### Modified: GET /api/words

New query parameter: `locales` (comma-separated locale codes).

```
GET /api/words?lang=en&level=B2&locales=en,zh-CN&page=1&pageSize=50
```

Response includes `translations` and `exampleTranslations` fields on each word, containing only the requested locales.

#### Modified: GET /api/words/:id

Same `locales` parameter support.

```
GET /api/words/1?locales=en,zh-CN
```

#### New: GET /api/translations/locales

Returns available translation languages (those that have data in `word_translations`).

```
GET /api/translations/locales?lang=en
```

Response:
```json
{ "data": [{ "locale": "en", "name": "English" }, { "locale": "zh-CN", "name": "中文" }] }
```

Query: `SELECT DISTINCT locale FROM word_translations wt JOIN words w ON wt.word_id = w.id WHERE w.language_id = ?` — locale display names resolved from shared `LOCALE_NAMES` constant.

No authentication required (public content metadata).

#### New route file: packages/api/src/routes/translations.ts

Handles the `/api/translations/locales` endpoint.

#### Modified: GET /api/passages/:id

The passage endpoint returns embedded words (`data.words`) which are the primary data source for `WordTooltip` in `PassageView`. This endpoint must also accept the `locales` query parameter and populate `translations` + `exampleTranslations` on the embedded word objects.

```
GET /api/passages/101?locales=en,zh-CN
```

The passage query (`db/queries/passages.ts`) must call `getTranslationsForWords()` and `getExampleTranslationsForWords()` after loading passage words, using the same batch-fetch pattern as the words query.

Frontend: `usePassageView.ts` imports `useSettingsStore` to read `selectedLocales` and passes it to `passagesApi.getPassageById()`.

#### DB Query Changes

**packages/api/src/db/queries/words.ts:**
- `getWords(db, opts)`, `getWordById(db, id)`, and `getWordsByIds(db, ids)` gain optional `locales?: string[]` parameter
- After fetching words, batch-query `word_translations` and `example_translations` for the requested locales
- Merge results into `Word.translations` and `Word.exampleTranslations`
- All call sites must pass `locales`: `useStudySession.ts`, `useWordModal.ts`, `useWordTooltip.ts`, word list/search APIs

**New: packages/api/src/db/queries/translations.ts:**
- `getAvailableLocales(db, languageId: string)` → `string[]`
- `getTranslationsForWords(db, wordIds: number[], locales: string[])` → batch fetch
- `getExampleTranslationsForWords(db, wordIds: number[], locales: string[])` → batch fetch
- `insertTranslation(db, wordId, locale, translation)` → single insert
- `insertExampleTranslation(db, wordId, exampleIndex, locale, translation)` → single insert

### 5. Frontend: Settings

#### UserSettings type change

```typescript
interface UserSettings {
  currentLanguage: string
  audioAutoPlay: boolean
  selectedLocales: string[]    // NEW: user's chosen translation languages
}
```

#### SettingsView.vue

New section "Translation Languages" showing checkboxes:
- Fetches available locales from `GET /api/translations/locales`
- Displays as checkbox list with language display names
- User checks/unchecks freely
- Persists to `selectedLocales` in user settings

#### Default initialization

On first use (no settings saved):
1. Detect browser locale via `navigator.language` (e.g., `zh-CN`)
2. Set `selectedLocales` to `[targetLanguage, browserLocale]` (deduplicated)
3. Example: Chinese user learning English → `["en", "zh-CN"]`

#### Locale display names

**New file: `packages/shared/src/locales.ts`** — locale display name registry, consistent with `levels.ts` pattern:

```typescript
export const LOCALE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh-CN': '中文',
  'ja': '日本語',
  'ko': '한국어',
}
```

The `GET /api/translations/locales` endpoint returns locale codes with display names:
```json
{ "data": [{ "locale": "en", "name": "English" }, { "locale": "zh-CN", "name": "中文" }] }
```

Locale display names are stored in a shared constant (`LOCALE_NAMES` in `packages/shared`) and used by both the API response and frontend rendering. When a new translation language is added, only this map needs updating.

### 6. Frontend: Component Changes

All components that display translations change from hardcoded fields to dynamic rendering.

#### Affected components:
- **WordTooltip.vue** — passage word hover/tap
- **WordDetailModal.vue** — word detail modal
- **StudyView.vue** — flashcard back face
- **WordListView.vue** — word list browse

#### Rendering pattern (all components):

```html
<!-- Definitions — only render locales that have data -->
<div v-for="(text, locale) in word.translations" :key="locale" class="definition">
  {{ text }}
</div>

<!-- Examples with translations -->
<div v-for="(example, i) in word.examples" :key="i" class="example">
  <div class="example-source">{{ example }}</div>
  <div v-for="(texts, locale) in word.exampleTranslations" :key="locale"
       class="example-translation">
    {{ texts[i] }}
  </div>
</div>
```

**Component purity note:** Components (`WordTooltip.vue`, `WordDetailModal.vue`) receive the `word` object (with translations already populated) from their composables (`useWordTooltip`, `useWordModal`). Components do not fetch translations themselves. The composables are responsible for passing `locales` to the API and ensuring `word.translations` is filled before passing to the component.

**Empty translations:** If the API returns no translation for a requested locale (data not yet available), the locale key is simply absent from `word.translations`. The `v-for` naturally skips it — no special fallback UI needed.

#### API client changes

`packages/web/src/api/words.ts`: Add `locales?: string[]` to the options interface. The API module remains a pure thin wrapper — it does **not** import any store. Callers (composables, stores) are responsible for reading `selectedLocales` from `useSettingsStore` and passing it explicitly.

```typescript
// Before
getWords({ lang, level, topic, page, pageSize })

// After — locales is an explicit parameter, not read from a store
getWords({ lang, level, topic, page, pageSize, locales })
```

**Locale sourcing convention:** Every composable that calls the words API (`useWordTooltip`, `useWordModal`, `useStudySession`, `usePassageView`) imports `useSettingsStore` internally to read `selectedLocales`. This follows the existing dependency direction: `stores → composables` is allowed, and composables already import stores elsewhere in the codebase. Components never touch settings — they receive the fully-populated `word` object from composables.

### 7. User-Created Words

When a user saves a word from FreeWordTooltip:
1. Insert into `words` table (level = `'user'`)
2. Insert into `word_translations` with locale `'en'` and the English definition from the external dictionary
3. No other locale translations (no data source for them)

The `userWordService.ts` changes to write to `word_translations` instead of `definition_native`/`definition_target` columns.

**Frontend payload change:** `useFreeWordLookup.ts` currently constructs a Word object with `definitionNative`/`definitionTarget` fields. This must change to `translations: { en: firstDef }`. The API endpoint for creating user words must accept the new `translations` format.

**useStudySession.ts breakage:** The `extraDefs` computed in `useStudySession.ts` references `currentWord.value.definitionTarget` for dictionary deduplication. `useStudySession` must import `useSettingsStore` to read `selectedLocales` for two purposes: (1) passing to `wordsApi.getWordById()` calls, and (2) replacing the `definitionTarget` reference with `currentWord.value.translations?.[settings.currentLanguage]` for deduplication (using the target language, not a hardcoded `'en'`).

**user_words query path:** `getUserWords` in `db/queries/userWords.ts` must JOIN `word_translations` to populate translations, same as the `words` query functions. User words and system words use the same translation lookup path.

### 8. migrate-content Script Changes

The `migrate-content.ts` script updates to:
1. Read word files from `data/words/` directory
2. Insert into `words` table (no translation fields)
3. Scan `data/translations/` directory for all locale subdirectories
4. For each locale, read `*.json` files → insert into `word_translations`
5. For each locale, read `*.examples.json` files → insert into `example_translations`

## Files Changed

| File | Change |
|------|--------|
| `packages/api/src/db/migrations/0002_translations.sql` | NEW: migration script |
| `packages/api/src/db/queries/words.ts` | Remove definition fields, add locales join |
| `packages/api/src/db/queries/translations.ts` | NEW: translation query functions |
| `packages/api/src/db/queries/userWords.ts` | Remove definition fields, use translations table |
| `packages/api/src/routes/words.ts` | Add locales parameter handling |
| `packages/api/src/routes/translations.ts` | NEW: available locales endpoint |
| `packages/api/src/routes/index.ts` | Mount translations route |
| `packages/api/src/services/userWordService.ts` | Write to word_translations instead |
| `packages/api/scripts/migrate-content.ts` | New data directory structure |
| `packages/api/scripts/data/words/*.json` | NEW: word data without translations |
| `packages/api/scripts/data/translations/**/*.json` | NEW: per-locale translation files |
| `packages/shared/src/types.ts` | Word type: remove definitionNative/Target, add translations/exampleTranslations |
| `packages/web/src/stores/settings.ts` | Add selectedLocales to UserSettings |
| `packages/web/src/api/words.ts` | Pass locales in all word API calls |
| `packages/web/src/api/translations.ts` | NEW: fetch available locales |
| `packages/web/src/views/SettingsView.vue` | Add translation language checkboxes |
| `packages/web/src/views/StudyView.vue` | Dynamic translation rendering |
| `packages/web/src/views/WordListView.vue` | Dynamic translation rendering |
| `packages/web/src/components/WordTooltip.vue` | Dynamic translation rendering |
| `packages/web/src/components/WordDetailModal.vue` | Dynamic translation rendering |
| `packages/web/src/composables/useFreeWordLookup.ts` | Write to translations table |
| `packages/web/src/composables/useWordTooltip.ts` | Pass locales |
| `packages/web/src/composables/useWordModal.ts` | Pass locales |
| `packages/web/src/composables/usePassageView.ts` | Import settings store, pass locales to passage API |
| `packages/web/src/composables/useStudySession.ts` | Import settings store, replace `definitionTarget` with dynamic locale lookup |
| `packages/web/src/api/passages.ts` | Add locales parameter to getPassageById |
| `packages/api/src/routes/passages.ts` | Accept and forward locales parameter |
| `packages/api/src/db/queries/passages.ts` | Join translations for embedded words |
| `packages/shared/src/locales.ts` | NEW: LOCALE_NAMES registry |
| `packages/web/scripts/validate-words.ts` | Update for new data directory structure (words/ + translations/) |

## Testing Strategy

1. **Migration**: Verify `0002_translations.sql` correctly migrates existing data
2. **API**: Test `/api/words?locales=en,zh-CN` returns correct translations
3. **API**: Test `/api/translations/locales` returns available languages
4. **API**: Test `/api/words` without locales returns no translations
5. **Settings**: Verify selectedLocales persists and loads correctly
6. **Components**: Verify all 4 display components render translations dynamically
7. **User words**: Verify new user word creates translation entry
8. **Default locale**: Verify first-time user gets correct defaults from navigator.language
9. **Typecheck**: `pnpm typecheck` passes across all packages
