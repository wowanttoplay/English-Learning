# Data-Driven Levels and Topics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded TypeScript union types for levels and topics with string aliases and a per-language level registry, enabling different difficulty systems per language.

**Architecture:** Widen `CefrLevel`/`SubtopicId`/`DomainId` union types to `string` aliases. Create a shared level registry (`levels.ts`) with per-language entries. Update all consumers (views, components, stores, DB queries, validation script) to use the registry instead of hardcoded values. Single atomic commit since type deletion breaks all downstream simultaneously.

**Tech Stack:** TypeScript, Vue 3, Pinia, Hono, Cloudflare Workers D1

---

## Task 1: Create level registry in shared package

**Files:**
- Create: `packages/shared/src/levels.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `packages/shared/src/levels.ts`**

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

- [ ] **Step 2: Add export to `packages/shared/src/index.ts`**

Add line:
```ts
export * from './levels'
```

(After the existing `export * from './date-utils'` line.)

---

## Task 2: Widen types in shared package

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Replace type definitions**

Replace lines 1-11 of `packages/shared/src/types.ts`:

```ts
// === CEFR Levels ===
export type CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type CefrLevel = CefrCoreLevel | 'user'

// === Topic Hierarchy ===
export type DomainId = 'life' | 'work' | 'society' | 'people' | 'knowledge'

export type SubtopicId =
  | 'work' | 'education' | 'technology' | 'health' | 'environment' | 'society'
  | 'emotions' | 'business' | 'travel' | 'communication' | 'science' | 'law'
  | 'arts' | 'daily-life' | 'relationships' | 'politics'
```

With:

```ts
// === Levels (per-language, see levels.ts for registry) ===
export type Level = string

// Backward-compatible aliases — will be removed in a future cleanup
export type CefrCoreLevel = Level
export type CefrLevel = Level

// === Topic Hierarchy ===
export type DomainId = string
export type TopicId = string

// Backward-compatible alias
export type SubtopicId = TopicId
```

- [ ] **Step 2: Update Word and Passage interfaces**

In the same file, update:

Line 29: `level: CefrLevel` → `level: Level`
Line 30: `topics: SubtopicId[]` → `topics: TopicId[]`
Line 40: `level: CefrCoreLevel` → `level: Level`
Line 41: `topic: SubtopicId` → `topic: TopicId`

Note: The backward-compatible aliases (`CefrLevel = Level`, `SubtopicId = TopicId`) mean downstream consumers won't break immediately. This allows us to update consumers file by file.

---

## Task 3: Update API DB queries

**Files:**
- Modify: `packages/api/src/db/queries/words.ts`
- Modify: `packages/api/src/db/queries/passages.ts`
- Modify: `packages/api/src/db/queries/userWords.ts`
- Modify: `packages/api/src/services/userWordService.ts`

- [ ] **Step 1: Update `words.ts`**

Line 1: Change import to use new type names:
```ts
import type { Word, Level, TopicId } from '@english-learning/shared'
```

Line 26: `row.level as CefrLevel` → `row.level as Level`
Line 27: `... as SubtopicId[]` → `... as TopicId[]`

- [ ] **Step 2: Update `passages.ts`**

Line 1: Change import:
```ts
import type { Passage, SentenceTimestamp, Level, TopicId } from '@english-learning/shared'
```

Lines 28-29 in `PassageSummary` interface:
```ts
  level: Level
  topic: TopicId
```

Line 39: `row.level as CefrCoreLevel` → `row.level as Level`
Line 40: `row.topic as SubtopicId` → `row.topic as TopicId`
Line 52: same as 39
Line 53: same as 40

- [ ] **Step 3: Update `userWords.ts`**

Line 1: Change import:
```ts
import type { Word, TopicId, Level } from '@english-learning/shared'
```

Line 25: `'user' as CefrLevel` → `'user' as Level`
Line 26: `... as SubtopicId[]` → `... as TopicId[]`

- [ ] **Step 4: Update `userWordService.ts`**

Line 1: Change import:
```ts
import type { TopicId } from '@english-learning/shared'
```

Line 55: `... as SubtopicId[]` → `... as TopicId[]`

---

## Task 4: Update web types and topics data

**Files:**
- Modify: `packages/web/src/types/index.ts`
- Modify: `packages/web/src/data/topics.ts`

- [ ] **Step 1: Update `web/src/types/index.ts`**

Line 3: Change import:
```ts
import type { DomainId, TopicId } from '@english-learning/shared'
```

Line 13: `Domain` interface stays — `DomainId` is already `string`
Line 14: Change `Subtopic` interface:
```ts
export interface Subtopic { id: TopicId; name: string; emoji: string; domainId: DomainId }
```

- [ ] **Step 2: Replace `web/src/data/topics.ts` entirely**

Replace the entire file. Changes: import types updated, topics reorganized (added `food` and `sports`, moved `technology` to knowledge, moved `environment` to knowledge), helper signatures widened.

```ts
import type { Domain, Subtopic, DomainId, TopicId } from '@/types'

export const DOMAINS: readonly Domain[] = [
  { id: 'life', name: 'Life & Daily', emoji: '🏠' },
  { id: 'work', name: 'Work & Career', emoji: '💼' },
  { id: 'society', name: 'Society & World', emoji: '🌍' },
  { id: 'people', name: 'People & Mind', emoji: '👥' },
  { id: 'knowledge', name: 'Knowledge & Culture', emoji: '📚' },
]

export const SUBTOPICS: readonly Subtopic[] = [
  // Life (5)
  { id: 'daily-life', name: 'Daily Life', emoji: '🏠', domainId: 'life' },
  { id: 'health', name: 'Health & Body', emoji: '🏥', domainId: 'life' },
  { id: 'travel', name: 'Travel & Places', emoji: '✈️', domainId: 'life' },
  { id: 'food', name: 'Food & Dining', emoji: '🍽️', domainId: 'life' },
  { id: 'sports', name: 'Sports & Leisure', emoji: '⚽', domainId: 'life' },
  // Work (2)
  { id: 'work', name: 'Work & Career', emoji: '💼', domainId: 'work' },
  { id: 'business', name: 'Business & Finance', emoji: '📊', domainId: 'work' },
  // Society (3)
  { id: 'society', name: 'Society & Culture', emoji: '🏘️', domainId: 'society' },
  { id: 'politics', name: 'Politics & Government', emoji: '🏛️', domainId: 'society' },
  { id: 'law', name: 'Law & Justice', emoji: '⚖️', domainId: 'society' },
  // People (3)
  { id: 'relationships', name: 'Relationships & People', emoji: '👥', domainId: 'people' },
  { id: 'emotions', name: 'Emotions & Mind', emoji: '🧠', domainId: 'people' },
  { id: 'communication', name: 'Communication & Media', emoji: '📡', domainId: 'people' },
  // Knowledge (5)
  { id: 'education', name: 'Education & Learning', emoji: '📚', domainId: 'knowledge' },
  { id: 'science', name: 'Science & Research', emoji: '🔬', domainId: 'knowledge' },
  { id: 'arts', name: 'Arts & Entertainment', emoji: '🎨', domainId: 'knowledge' },
  { id: 'technology', name: 'Technology & Innovation', emoji: '💻', domainId: 'knowledge' },
  { id: 'environment', name: 'Environment & Nature', emoji: '🌿', domainId: 'knowledge' },
]

// Helper functions
export function getSubtopicsByDomain(domainId: DomainId): readonly Subtopic[] {
  return SUBTOPICS.filter(s => s.domainId === domainId)
}

export function getDomainBySubtopic(subtopicId: TopicId): Domain | undefined {
  const sub = SUBTOPICS.find(s => s.id === subtopicId)
  return sub ? DOMAINS.find(d => d.id === sub.domainId) : undefined
}

// Backward compatibility
export const TOPIC_REGISTRY = SUBTOPICS
```

---

## Task 5: Update stores

**Files:**
- Modify: `packages/web/src/stores/wordListQuery.ts`

- [ ] **Step 1: Update imports and ref types**

Line 3: Change import:
```ts
import type { Word, DomainId, TopicId, Level } from '@/types'
```

Line 12: `ref<'all' | SubtopicId>('all')` → `ref<'all' | TopicId>('all')`
Line 13: `ref<'all' | DomainId>('all')` → stays (DomainId is already string)
Line 14: `ref<'all' | CefrLevel>('all')` → `ref<'all' | Level>('all')`

---

## Task 6: Update LevelBadge component

**Files:**
- Modify: `packages/web/src/components/LevelBadge.vue`

- [ ] **Step 1: Replace entire script block**

Replace the `<script setup>` in `LevelBadge.vue` with:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { getLevelDef } from '@english-learning/shared'

const props = withDefaults(defineProps<{ level: string; lang?: string }>(), {
  lang: 'en',
})

const levelClass = computed(() => 'level-' + props.level.toLowerCase())
const label = computed(() => props.level === 'user' ? 'MY' : props.level)
const levelColor = computed(() => {
  if (props.level === 'user') return null
  const def = getLevelDef(props.lang, props.level)
  return def?.color ?? null
})
</script>
```

- [ ] **Step 2: Update template**

Change line 2 from:
```html
  <span class="level-badge" :class="levelClass">{{ label }}</span>
```
to:
```html
  <span class="level-badge" :class="levelClass" :style="levelColor ? { background: levelColor } : {}">{{ label }}</span>
```

---

## Task 7: Update WordListView

**Files:**
- Modify: `packages/web/src/views/WordListView.vue`

- [ ] **Step 1: Update imports**

Line 118: Change:
```ts
import type { DomainId } from '@/types'
```
(Remove `CefrLevel` from import — no longer needed.)

Add import:
```ts
import { getLevels } from '@english-learning/shared'
import { useLanguageStore } from '@/stores/language'
```

- [ ] **Step 2: Replace hardcoded level array**

Replace line 125:
```ts
const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
```
with:
```ts
const langStore = useLanguageStore()
const levels = computed(() => getLevels(langStore.currentLanguage))
```

- [ ] **Step 3: Update setLevel signature**

Line 145: Change:
```ts
function setLevel(lv: 'all' | CefrLevel) {
```
to:
```ts
function setLevel(lv: 'all' | string) {
```

- [ ] **Step 4: Update template level loop**

In the template, find the `v-for` that iterates `cefrLevels` and change it to iterate `levels`. Each item is now a `LevelDef` object, so the button text should use `lv.id` and `lv.name`:

Change from iterating plain strings to iterating `LevelDef` objects:
- `:key="lv"` → `:key="lv.id"`
- `@click="setLevel(lv)"` → `@click="setLevel(lv.id)"`
- `{{ lv }}` → `{{ lv.name }}`
- Active check: `query.level === lv` → `query.level === lv.id`

---

## Task 8: Update ReadingView

**Files:**
- Modify: `packages/web/src/views/ReadingView.vue`

- [ ] **Step 1: Update imports**

Line 127: Change:
```ts
import type { CefrCoreLevel, DomainId, SubtopicId } from '@/types'
```
to:
```ts
import type { DomainId, TopicId } from '@/types'
```

Add imports:
```ts
import { getLevels } from '@english-learning/shared'
import { useLanguageStore } from '@/stores/language'
```

- [ ] **Step 2: Replace hardcoded levels and widen filter types**

Replace lines 140-143:
```ts
const cefrLevels: CefrCoreLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const levelFilter = ref<'all' | CefrCoreLevel>('all')
const domainFilter = ref<'all' | DomainId>('all')
const topicFilter = ref<'all' | SubtopicId>('all')
```
with:
```ts
const langStore = useLanguageStore()
const levels = computed(() => getLevels(langStore.currentLanguage))
const levelFilter = ref<'all' | string>('all')
const domainFilter = ref<'all' | string>('all')
const topicFilter = ref<'all' | string>('all')
```

- [ ] **Step 3: Update setDomain signature**

Line 145: Change:
```ts
function setDomain(d: 'all' | DomainId) {
```
to:
```ts
function setDomain(d: 'all' | string) {
```

- [ ] **Step 4: Update template level loop**

Same pattern as Task 7 Step 4 — change `cefrLevels` iteration to `levels`, access `.id` and `.name` on each item.

---

## Task 9: Update validate-words script

**Files:**
- Modify: `packages/web/scripts/validate-words.ts`

- [ ] **Step 1: Replace hardcoded validation sets**

Replace lines 13-19:
```ts
const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
// Must match SubtopicId union in src/types/index.ts
const VALID_TOPICS = new Set([
  'work', 'education', 'technology', 'health', 'environment', 'society',
  'emotions', 'business', 'travel', 'communication', 'science', 'law',
  'arts', 'daily-life', 'relationships', 'politics'
])
```
with:
```ts
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
```

- [ ] **Step 2: Update level validation check**

Replace lines 87-91 (the level check loop):
```ts
// 4. Invalid CEFR levels
for (const w of allWords) {
  if (!VALID_LEVELS.has(w.level)) {
    error(`Word ID ${w.id} ("${w.word}"): invalid level "${w.level}"`)
  }
}
```
with:
```ts
// 4. Invalid levels
for (const w of allWords) {
  if (!isValidLevel('en', w.level)) {
    error(`Word ID ${w.id} ("${w.word}"): invalid level "${w.level}"`)
  }
}
```

---

## Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Type System section**

Replace the CEFR Levels subsection with:

```markdown
### Levels

- `Level = string` — language-specific difficulty level (e.g., 'A1'-'C2' for English, 'N5'-'N1' for Japanese)
- `'user'` is a special sentinel level for user-created words (not in the level registry)
- Level definitions live in `packages/shared/src/levels.ts` — per-language registry with `{ id, name, order, color }`
- To add a new language's levels, add an entry to the `LEVELS` record in `levels.ts`
- `Word.level` uses `Level`; `Passage.level` uses `Level`
```

- [ ] **Step 2: Update Topic Hierarchy subsection**

Replace `SubtopicId` references with `TopicId`:

```markdown
### Topic Hierarchy (Domain → Subtopic)

Words are tagged with 1-3 topics (`TopicId[]`). Types `DomainId` and `TopicId` are `string` aliases.
```

- [ ] **Step 3: Add to Architecture Patterns section**

Add:
```markdown
- **Level registry:** Per-language level definitions in `packages/shared/src/levels.ts`. UI components (`LevelBadge`, filter tabs) read from the registry via `getLevels(lang)`. Colors come from the registry's `color` field (inline style), with CSS class fallback for existing levels. Adding a new language's levels requires only adding a registry entry — no type, component, or view changes needed.
```

---

## Task 11: Verify and commit

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit all changes atomically**

```bash
git add -A
git commit -m "refactor: data-driven levels and topics — replace hardcoded union types with string aliases and per-language level registry"
```

---

## Task 12: Remove backward-compatible aliases (cleanup)

After verifying everything works, remove the aliases from `types.ts`:

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Remove aliases**

Delete these lines from `types.ts`:
```ts
// Backward-compatible aliases — will be removed in a future cleanup
export type CefrCoreLevel = Level
export type CefrLevel = Level
// Backward-compatible alias
export type SubtopicId = TopicId
```

- [ ] **Step 2: Update all remaining imports**

Search for any remaining imports of `CefrLevel`, `CefrCoreLevel`, `SubtopicId` across the codebase and replace with `Level` or `TopicId`.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove backward-compatible type aliases (CefrLevel, SubtopicId)"
```
