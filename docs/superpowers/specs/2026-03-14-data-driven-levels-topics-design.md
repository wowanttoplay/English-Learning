# Data-Driven Levels and Topics

## Goal

Decouple the level system and topic system from hardcoded TypeScript union types to data-driven registries, so different languages can use different difficulty systems (CEFR for English, JLPT for Japanese, TOPIK for Korean) without touching type definitions, views, or components.

## Non-Goals

- Moving `web/data/topics.ts` to shared (API never imports it; emoji is a UI concern)
- Full multi-language UI implementation
- Changing the `'user'` level architecture (it stays as-is — a special sentinel value)

## Changes

### 1. Type widening in `packages/shared/src/types.ts`

Delete:
- `CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`
- `CefrLevel = CefrCoreLevel | 'user'`
- `SubtopicId = 'work' | 'education' | ...` (16 literal values)
- `DomainId = 'life' | 'work' | 'society' | 'people' | 'knowledge'`

Replace with:
```ts
export type Level = string
export type TopicId = string
export type DomainId = string
```

Update interfaces:
- `Word.level: Level` (was `CefrLevel`)
- `Word.topics: TopicId[]` (was `SubtopicId[]`)
- `Passage.level: Level` (was `CefrCoreLevel`)
- `Passage.topic: TopicId` (was `SubtopicId`)

### 2. New file: `packages/shared/src/levels.ts`

Per-language level registry with color for UI rendering:

```ts
export interface LevelDef {
  id: string
  name: string
  order: number
  color: string
}

export const LEVELS: Record<string, LevelDef[]> = {
  en: [
    { id: 'A1', name: 'A1', order: 1, color: '#4caf50' },
    { id: 'A2', name: 'A2', order: 2, color: '#8bc34a' },
    { id: 'B1', name: 'B1', order: 3, color: '#2196f3' },
    { id: 'B2', name: 'B2', order: 4, color: '#1565c0' },
    { id: 'C1', name: 'C1', order: 5, color: '#9c27b0' },
    { id: 'C2', name: 'C2', order: 6, color: '#6a1b9a' },
  ],
  ja: [
    { id: 'N5', name: 'N5', order: 1, color: '#4caf50' },
    { id: 'N4', name: 'N4', order: 2, color: '#8bc34a' },
    { id: 'N3', name: 'N3', order: 3, color: '#2196f3' },
    { id: 'N2', name: 'N2', order: 4, color: '#1565c0' },
    { id: 'N1', name: 'N1', order: 5, color: '#9c27b0' },
  ],
}

export function getLevels(lang: string): LevelDef[] {
  return LEVELS[lang] ?? []
}

export function isValidLevel(lang: string, level: string): boolean {
  if (level === 'user') return true
  return getLevels(lang).some(l => l.id === level)
}

export function getLevelDef(lang: string, level: string): LevelDef | undefined {
  return getLevels(lang).find(l => l.id === level)
}
```

Export from `packages/shared/src/index.ts`.

### 3. Update `packages/web/src/data/topics.ts` types

Stay in web/data/. Change imported types:
- `DomainId` → `string` (via the widened type alias)
- `SubtopicId` → `TopicId` (via the widened type alias)

Helper function signatures:
- `getSubtopicsByDomain(domainId: string)` (was `DomainId`)
- `getDomainBySubtopic(subtopicId: string)` (was `SubtopicId`)

### 4. Update `packages/web/src/types/index.ts`

Web-specific display interfaces:
- `Domain.id: DomainId` (already string via alias)
- `Subtopic.id: TopicId` (was `SubtopicId`)
- `Subtopic.domainId: DomainId` (already string via alias)

### 5. Update `LevelBadge.vue`

Props: `level: string` (was `CefrLevel`).

Color logic: Use registry color via inline style, with CSS class fallback:

```ts
import { getLevelDef } from '@english-learning/shared'

const levelColor = computed(() => {
  // 'user' level has its own CSS class
  if (props.level === 'user') return null
  const def = getLevelDef(lang, props.level)
  return def?.color ?? null
})
```

Template: `<span :class="levelClass" :style="levelColor ? { background: levelColor } : {}">`

Keep existing `.level-*` CSS classes as fallback. New level systems (JLPT etc.) get color from registry inline style.

LevelBadge accepts an optional prop `lang` with default `'en'`. This avoids changing all 7 call sites.

### 6. Update `WordListView.vue`

Replace hardcoded array:
```ts
// Before: const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
// After:
import { getLevels } from '@english-learning/shared'
const levels = computed(() => getLevels(currentLang.value))
```

"My Words" button stays separate (not from registry).

Filter type: `level: ref<'all' | string>` (was `'all' | CefrLevel`).

### 7. Update `ReadingView.vue`

Same as WordListView — replace hardcoded `cefrLevels` array with `getLevels(lang)`.

All three filter types must widen:
- `levelFilter: ref<'all' | string>` (was `'all' | CefrCoreLevel`)
- `topicFilter: ref<'all' | string>` (was `'all' | SubtopicId`)
- `domainFilter: ref<'all' | string>` (was `'all' | DomainId`)

### 8. Update `wordListQuery.ts`

```ts
// Before: level = ref<'all' | CefrLevel>('all')
// After:  level = ref<'all' | string>('all')
// Same for domain and topic refs
```

### 9. Update DB query files

All `as CefrLevel`, `as CefrCoreLevel`, `as SubtopicId` casts → remove or change to `as Level`, `as TopicId`.

Files:
- `packages/api/src/db/queries/words.ts`: `row.level as Level`, `... as TopicId[]`
- `packages/api/src/db/queries/passages.ts`: `row.level as Level`, `row.topic as TopicId`. Also update the `PassageSummary` interface field declarations: `level: Level`, `topic: TopicId`
- `packages/api/src/db/queries/userWords.ts`: `'user' as Level`, `... as TopicId[]`
- `packages/api/src/services/userWordService.ts`: `... as TopicId[]`

### 10. Update `validate-words.ts`

Replace hardcoded sets:
```ts
// Before: const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
// After:
import { isValidLevel } from '@english-learning/shared'
// Use: isValidLevel('en', word.level) — hardcode 'en' since current dataset is English-only
```

Same for topics — import from `web/data/topics.ts` to get valid topic IDs instead of hardcoded set.

### 11. Update CLAUDE.md

- Document `Level = string`, `TopicId = string`, `DomainId = string`
- Document `shared/levels.ts` as the level registry
- Document the `'user'` level convention (sentinel value, not in registry)
- Update Type System section

## Execution Order

All changes are committed together as one atomic change (type widening breaks all downstream until all consumers are updated). Order within the commit:

1. **types.ts** — widen types
2. **levels.ts** — create registry + export from index.ts
3. **DB queries** — update casts and interfaces
4. **web/types/index.ts** — update import names (`SubtopicId` → `TopicId`)
5. **topics.ts** — update helper signatures
6. **wordListQuery.ts** — update filter types
7. **LevelBadge.vue** — update props + color logic (optional `lang` prop, default `'en'`)
8. **WordListView.vue** — use registry for filter tabs
9. **ReadingView.vue** — use registry for filter tabs + widen all three filter types
10. **validate-words.ts** — use `isValidLevel('en', ...)`
11. **CLAUDE.md** — document new patterns
12. **Typecheck + build** — verify everything

## Verification

- `pnpm typecheck` must pass after all changes (not per-step — this is an atomic commit)
- `pnpm build` must pass
- `pnpm --filter @english-learning/web validate:words` must pass

## What We Explicitly Decided

| Decision | Reason |
|----------|--------|
| `'user'` stays as-is | It's a word origin sentinel, not a difficulty level. Already handled separately in UI. |
| topics.ts stays in web/data/ | API never imports it. emoji is a UI concern, doesn't belong in shared. |
| LevelDef includes `color` | Avoids needing CSS rules for every new level system. Inline style from registry. |
| No DB migration needed | `level TEXT NOT NULL` already accepts any string. |
| Accept runtime-only validation | `validate-words.ts` catches invalid levels. Flexibility > compile-time checks for this use case. |
