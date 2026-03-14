# Architecture Normalization for AI-Friendly Development

## Goal

Refactor the codebase to be optimally structured for AI-assisted development: small focused files, consistent patterns, clear layer boundaries, single responsibility per file. Additionally, prepare the architecture for multi-language expansion.

## Non-Goals

- Splitting stores that don't have clean boundaries (`useSrsStore`, `useWordListQueryStore`, `useStudySession`)
- Unifying API response format (risk outweighs benefit due to dual-path unwrap in `apiFetch`)
- Full multi-language implementation (only structural preparation)

## Changes

### 1. Unify `EASE_MULTIPLIER` to shared package

**File:** `packages/shared/src/srs-engine.ts`

Export `EASE_MULTIPLIER = 1000` from the shared SRS engine. Remove duplicate definitions from:
- `packages/api/src/routes/userWords.ts` (line 8)
- `packages/api/src/services/cardService.ts` (line 10)

Both files import from `@english-learning/shared` already.

### 2. Typed error classes for API layer

**New file:** `packages/api/src/errors.ts`

```ts
export class AppError extends Error {
  constructor(public code: string, message: string, public status: number = 400) {
    super(message)
  }
}

export class CardKnownError extends AppError {
  constructor() { super('CARD_KNOWN', 'Card is already known', 409) }
}

export class NotFoundError extends AppError {
  constructor(entity: string) { super('NOT_FOUND', `${entity} not found`, 404) }
}

export class MissingFieldError extends AppError {
  constructor(field: string) { super('MISSING_FIELD', `Missing required field: ${field}`, 400) }
}
```

Update `packages/api/src/services/cardService.ts` to throw these instead of plain `Error`.
Update `packages/api/src/routes/cards.ts` to catch `AppError` and use `.code` / `.status` instead of string matching on `.message`. Both the `/rate` handler (lines 39-51) and the `/:wordId/known` handler (lines 63-72) need updating.

### 3. Extract `userWordService.ts`

**New file:** `packages/api/src/services/userWordService.ts`

Move from `packages/api/src/routes/userWords.ts`:
- Word INSERT + user_word INSERT + SRS card creation logic
- Use `EASE_MULTIPLIER` from shared package
- Use typed error classes
- Clean up unused `getLastInsertedUserWord` import in route

Route becomes a thin HTTP handler that calls the service and returns the result.

### 4. Create `db/queries/passagesRead.ts`

**New file:** `packages/api/src/db/queries/passagesRead.ts`

Extract raw SQL from `packages/api/src/routes/passagesRead.ts`:
- `getPassagesRead(db, userId)` — SELECT query
- `markPassageRead(db, userId, passageId)` — INSERT OR IGNORE

Route becomes a thin handler calling query functions.

### 5. Extract `useInflectionMatcher` with language strategy pattern

**New file:** `packages/web/src/composables/useInflectionMatcher.ts`

Extract from `packages/web/src/composables/usePassageView.ts` (lines ~26-65):

```ts
type InflectionStrategy = (words: Word[]) => Map<string, Word>

const englishInflections: InflectionStrategy = (words) => {
  // Current suffix logic: s, es, ed, ing, ly, er, est, ment, tion, ness
  // Plus special rules: -e drop, -y to -ies, -is to -ize
}

const strategies: Record<string, InflectionStrategy> = {
  en: englishInflections,
  // Future: ja, es, fr, etc.
}

export function useInflectionMatcher(words: Ref<Word[]>, lang: string) {
  return computed(() => {
    const strategy = strategies[lang] ?? strategies.en
    return strategy(words.value)
  })
}
```

`usePassageView.ts` imports and uses this composable, reducing its size by ~40 lines.

Comment in the file: `// English-specific suffix table — add per-language strategies as needed`

### 6. Create `useWordTooltip` composable

**New file:** `packages/web/src/composables/useWordTooltip.ts`

Extract from `packages/web/src/components/WordTooltip.vue`:
- `useSrsStore` access (getCardState, addWordFromReading, markAsKnown)
- Computed card state logic

Component receives reactive values and callbacks from the composable. Template stays in the `.vue` file.

### 7. Create `useWordModal` composable

**New file:** `packages/web/src/composables/useWordModal.ts`

Extract from `packages/web/src/components/WordDetailModal.vue`:
- `useSrsStore` access (getCardState, getCard)
- `wordsApi.getWordById()` call
- Word loading + dictionary fetch logic

Component becomes a pure presenter receiving reactive state.

### 8. Parameterize `dict-api.ts` by language

**File:** `packages/web/src/lib/dict-api.ts`

Change:
- `lookup(word)` → `lookup(word, lang = 'en')`
- Cache key: `dict_cache` → `dict_cache_${lang}`
- API base URL selected by language (default: dictionaryapi.dev for English)
- Expose a `registerDictProvider(lang, baseUrl)` or strategy map for future languages

Update consumers:
- `useDictionary.ts` — pass language through
- `useFreeWordLookup.ts` — pass language through
- `clearCache()` — must clear all language-specific keys or accept a `lang` param
- `SettingsView.vue` — calls `dict.clearCache()`, may need updating

### 9. Add language strategy to sentence splitter

**File:** `packages/web/src/lib/sentence-splitter.ts`

Current tokenizer regex `[a-zA-Z'-]+` is English-only.

Change:
- Extract tokenizer regex to a language-keyed map
- Default Latin-script regex extended for accented characters: `[a-zA-ZÀ-ÿ'-]+`
- `splitSentences(text, lang?)` — optional lang parameter, defaults to 'en'
- Add comment: `// CJK languages will need morphological analysis (e.g., kuromoji for Japanese)`

Update consumers:
- `usePassageView.ts` — pass language through (still imports `splitSentences` directly after inflection extraction)
- `packages/web/scripts/generate-timestamps.ts` — update the dynamic import type cast on line 53 to include optional `lang` param

### 10. Update CLAUDE.md

Reflect all structural changes:
- New files added (errors.ts, userWordService.ts, queries/passagesRead.ts, composables)
- Updated dependency direction documentation
- Document language strategy pattern for inflections, dict-api, sentence-splitter
- Document typed error pattern for API layer

## Execution Order

The order matters due to dependencies:

1. **EASE_MULTIPLIER** — no dependencies, unblocks items 2-3
2. **Typed error classes** — unblocks item 3
3. **userWordService.ts** — depends on 1 + 2
4. **queries/passagesRead.ts** — independent
5. **useInflectionMatcher** — independent
6. **useWordTooltip** — independent
7. **useWordModal** — independent
8. **dict-api parameterization** — independent
9. **sentence-splitter language strategy** — independent
10. **CLAUDE.md** — last, after all changes verified

Items 4-9 are independent and can be done in parallel.

## Verification

After each change:
- `pnpm typecheck` must pass
- `pnpm build` must pass
- No new imports violating dependency direction (api → stores → composables → components → views)
- After item 9, verify `splitSentences` type cast in `packages/web/scripts/generate-timestamps.ts` (line 53) — TypeScript won't catch signature drift in dynamic imports

## What We Explicitly Decided NOT To Do

| Decision | Reason |
|----------|--------|
| Don't split `useSrsStore` | 7/8 consumers need card store; cross-store `loadCards()` coupling makes boundary dirty |
| Don't split `useWordListQueryStore` | Single consumer uses full surface; 63 lines is not a size problem |
| Don't split `useStudySession` | 109 lines of orchestration logic is appropriate for a composable |
| Don't unify API response format | `apiFetch` dual-path unwrap makes gradual migration silently break; typed API client functions are the correct abstraction |
