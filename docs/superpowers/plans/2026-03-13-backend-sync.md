# Backend Sync & Multi-Language Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app from a localStorage-based SPA into a server-driven multi-language platform with Cloudflare Workers + D1 + Clerk auth.

**Architecture:** Monorepo with 3 packages: `shared` (types + pure SRS engine), `api` (Hono Worker + D1), `web` (Vue 3 SPA calling API). Frontend is a pure display layer. Server is source of truth.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite, Hono, Cloudflare Workers, D1, R2, Clerk

**Spec:** `docs/superpowers/specs/2026-03-13-backend-sync-design.md`

---

## Chunk 1: Monorepo + Shared Package

### Task 1: Set up monorepo workspace

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/web/package.json` (move from root)
- Modify: root `package.json`
- Create: `pnpm-workspace.yaml`

**Context:** The current project is a single Vue app at the root. We need to restructure into a pnpm monorepo with 3 packages while preserving git history.

- [ ] **Step 1: Install pnpm if needed**

Run: `npm install -g pnpm`

- [ ] **Step 2: Create pnpm workspace config**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 3: Create packages directories**

Run: `mkdir -p packages/shared/src packages/api/src packages/web`

- [ ] **Step 4: Move current app into packages/web**

Move all current app files (`src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `scripts/`) into `packages/web/`. Keep root-level config files (`package.json`, `.gitignore`, `CLAUDE.md`, `docs/`).

Run:
```bash
# Move app files to packages/web
mv src packages/web/
mv public packages/web/
mv index.html packages/web/
mv vite.config.ts packages/web/
mv tsconfig.json packages/web/
mv tsconfig.app.json packages/web/
mv tsconfig.node.json packages/web/
mv scripts packages/web/
```

- [ ] **Step 5: Create root package.json for workspace**

The root `package.json` becomes a workspace root. Remove all dependencies (they belong in `packages/web/package.json`).

```json
{
  "name": "english-learning",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @english-learning/web dev",
    "build": "pnpm --filter @english-learning/web build",
    "typecheck": "pnpm -r typecheck",
    "build:api": "pnpm --filter @english-learning/api build"
  }
}
```

- [ ] **Step 6: Create packages/web/package.json**

Copy the current root `package.json` contents, change `name` to `@english-learning/web`, add dependency on `@english-learning/shared`:

```json
{
  "name": "@english-learning/web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsx scripts/validate-words.ts && vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit",
    "validate:words": "tsx scripts/validate-words.ts"
  },
  "dependencies": {
    "@english-learning/shared": "workspace:*",
    "pinia": "^2.3.1",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.3",
    "tsx": "^4.21.0",
    "typescript": "~5.7.3",
    "vite": "^6.2.0",
    "vitest": "^2.0.0",
    "vue-tsc": "^2.2.8"
  }
}
```

- [ ] **Step 7: Create packages/shared/package.json**

```json
{
  "name": "@english-learning/shared",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~5.7.3"
  }
}
```

- [ ] **Step 8: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 9: Create packages/api/package.json**

```json
{
  "name": "@english-learning/api",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@english-learning/shared": "workspace:*",
    "hono": "^4.7.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250312.0",
    "typescript": "~5.7.3",
    "wrangler": "^3.112.0"
  }
}
```

- [ ] **Step 10: Create packages/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

- [ ] **Step 11: Update packages/web/vite.config.ts path aliases**

The `@` alias needs to point to `packages/web/src` now. Also add an alias for the shared package.

- [ ] **Step 12: Install dependencies**

Run: `pnpm install`

- [ ] **Step 13: Verify web package still works**

Run: `pnpm --filter @english-learning/web typecheck`
Expected: PASS (no errors)

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "refactor: restructure into pnpm monorepo with shared/api/web packages"
```

---

### Task 2: Create shared types package

**Files:**
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`
- Modify: `packages/web/src/types/index.ts` (re-export from shared)

**Context:** Move all domain types that both api and web need into the shared package. The web package re-exports them so existing imports in components/views don't break.

- [ ] **Step 1: Create packages/shared/src/types.ts**

Port all domain types from `packages/web/src/types/index.ts`. Changes from current types:
- `Word.zh` → `Word.definitionNative` (supports any native language)
- `Word.en` → `Word.definitionTarget` (supports any target language)
- `Word.topics` type stays `SubtopicId[]` but becomes required (not optional)
- Add `Word.audioUrl?: string`
- `Passage` adds `audioUrl?: string` and `timestamps?: SentenceTimestamp[]`
- Remove `DictEntry`, `DictPhonetic`, `DictDefinition`, `DictMeaning` (these stay web-only, used by dict-api)
- Add `Language` type
- Add API request/response types

```typescript
// packages/shared/src/types.ts

// --- CEFR Levels ---
export type CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type CefrLevel = CefrCoreLevel | 'user'

// --- Topic Hierarchy ---
export type DomainId = 'life' | 'work' | 'society' | 'people' | 'knowledge'
export type SubtopicId =
  | 'work' | 'education' | 'technology' | 'health' | 'environment' | 'society'
  | 'emotions' | 'business' | 'travel' | 'communication' | 'science' | 'law'
  | 'arts' | 'daily-life' | 'relationships' | 'politics'

// --- Language ---
export interface Language {
  id: string            // 'en', 'ja', 'zh'
  name: string          // 'English'
  nativeName: string    // 'English', '日本語'
}

// --- Word ---
export interface Word {
  id: number
  languageId: string
  word: string
  pos: string
  phonetic: string
  definitionNative: string   // e.g. Chinese translation
  definitionTarget: string   // e.g. English definition
  examples: string[]
  level: CefrLevel
  topics: SubtopicId[]
  audioUrl?: string
}

// --- Passage ---
export interface Passage {
  id: number
  languageId: string
  title: string
  text: string
  level: CefrCoreLevel
  topic: SubtopicId
  genre?: string
  audioUrl?: string
  timestamps?: SentenceTimestamp[]
}

export interface SentenceTimestamp {
  index: number
  start: number
  end: number
  text: string
}

// --- SRS ---
export interface SrsCard {
  wordId: number
  state: 'learning' | 'review' | 'relearning' | 'known'
  previousState?: 'learning' | 'review' | 'relearning'
  ease: number        // float: 2.5 (NOT the DB integer)
  interval: number
  due: string         // YYYY-MM-DD
  dueTimestamp: number
  reps: number
  lapses: number
  step: number
}

export type Rating = 1 | 2 | 3 | 4

export type CardState = 'unseen' | 'learning' | 'relearning' | 'review' | 'mastered' | 'known'

export interface SrsHistory {
  reviewed: number
  learned: number
}

export interface SrsStats {
  todayReviewed: number
  todayLearned: number
  totalWords: number
  totalStarted: number
  unseenWords: number
  totalLearning: number
  totalReview: number
  totalMastered: number
  totalKnown: number
  streak: number
  deckSize: number
}

export interface DueCount {
  learning: number
  review: number
  total: number
}

export interface CardQueue {
  learning: SrsCard[]
  review: SrsCard[]
  total: number
}

// --- Settings ---
export interface UserSettings {
  currentLanguage: string
  audioAutoPlay: boolean
}

// --- API Response Envelope ---
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  code: string
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

- [ ] **Step 2: Create packages/shared/src/index.ts**

```typescript
export * from './types'
export * from './srs-engine'
export * from './date-utils'
```

(srs-engine and date-utils will be created in the next task)

- [ ] **Step 3: Update packages/web/src/types/index.ts to re-export**

Replace the contents with re-exports from shared, plus web-only types (dict-related):

```typescript
// Re-export all shared types
export * from '@english-learning/shared'

// Web-only types (used by dict-api.ts)
export interface DictPhonetic { text: string; audio: string | null }
export interface DictDefinition { definition: string; example: string | null }
export interface DictMeaning { partOfSpeech: string; definitions: DictDefinition[] }
export interface DictEntry { word: string; phonetics: DictPhonetic[]; meanings: DictMeaning[] }
export interface AudioSettings { autoPlay: boolean }

// Domain/Subtopic display types (used by topics.ts)
export interface Domain { id: import('@english-learning/shared').DomainId; name: string; emoji: string }
export interface Subtopic { id: import('@english-learning/shared').SubtopicId; name: string; emoji: string; domainId: import('@english-learning/shared').DomainId }
export type TopicEntry = Subtopic
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm --filter @english-learning/shared typecheck`
Expected: PASS

Note: `packages/web` will have type errors at this point because `Word` shape changed (`zh`→`definitionNative`, `en`→`definitionTarget`). That's expected and will be fixed in later tasks when we rewrite the web data layer.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/index.ts packages/web/src/types/index.ts
git commit -m "feat(shared): create shared types package with domain types"
```

---

### Task 3: Move SRS engine to shared package

**Files:**
- Create: `packages/shared/src/date-utils.ts`
- Create: `packages/shared/src/srs-engine.ts`

**Context:** The current `srs-engine.ts` mutates card objects in-place. We must refactor all functions to return new `SrsCard` objects instead, so both the API's `cardService` and the web's stores can use them without side effects.

- [ ] **Step 1: Create packages/shared/src/date-utils.ts**

Extract date helpers from the current `srs-engine.ts`:

```typescript
// packages/shared/src/date-utils.ts

export function formatDate(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function today(): string {
  return formatDate(new Date())
}

export function now(): number {
  return Date.now()
}

export function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000)
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return formatDate(d)
}
```

- [ ] **Step 2: Create packages/shared/src/srs-engine.ts**

Refactored to return new objects instead of mutating. Every function takes a card and returns a new card.

```typescript
// packages/shared/src/srs-engine.ts
import type { SrsCard, Rating } from './types'
import { today, now, addMinutes, addDays, formatDate } from './date-utils'

// --- Constants ---
export const LEARNING_STEPS = [1, 10] // minutes
export const GRADUATING_INTERVAL = 1 // days
export const EASY_INTERVAL = 4 // days
export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MASTERED_INTERVAL = 21 // days

// --- Helpers ---

export function isDue(card: SrsCard): boolean {
  if (card.state === 'learning' || card.state === 'relearning') {
    return now() >= card.dueTimestamp
  }
  return card.due <= today()
}

function graduated(card: SrsCard, interval: number): SrsCard {
  return {
    ...card,
    state: 'review',
    interval,
    due: addDays(today(), interval),
    dueTimestamp: new Date(addDays(today(), interval) + 'T00:00:00').getTime(),
    step: 0,
  }
}

// --- Rating Functions (pure — return new card, never mutate) ---

export function rateLearningCard(card: SrsCard, rating: Rating): SrsCard {
  if (rating === 1) {
    return {
      ...card,
      step: 0,
      dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[0]).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  }
  if (rating === 2) {
    const stepMinutes = LEARNING_STEPS[card.step] || LEARNING_STEPS[LEARNING_STEPS.length - 1]
    return {
      ...card,
      dueTimestamp: addMinutes(new Date(), stepMinutes).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  }
  if (rating === 3) {
    const nextStep = card.step + 1
    if (nextStep >= LEARNING_STEPS.length) {
      return { ...graduated(card, GRADUATING_INTERVAL), reps: card.reps + 1 }
    }
    return {
      ...card,
      step: nextStep,
      dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[nextStep]).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  }
  // rating === 4
  const grad = graduated(card, EASY_INTERVAL)
  return { ...grad, ease: card.ease + 0.15, reps: card.reps + 1 }
}

export function rateReviewCard(card: SrsCard, rating: Rating): SrsCard {
  if (rating === 1) {
    const newInterval = Math.max(1, Math.round(card.interval * 0.5))
    return {
      ...card,
      lapses: card.lapses + 1,
      state: 'relearning',
      step: 0,
      interval: newInterval,
      ease: Math.max(MIN_EASE, card.ease - 0.20),
      dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[0]).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  }
  if (rating === 2) {
    const newInterval = Math.max(1, Math.round(card.interval * 1.2))
    return {
      ...card,
      interval: newInterval,
      ease: Math.max(MIN_EASE, card.ease - 0.15),
      due: addDays(today(), newInterval),
      dueTimestamp: new Date(addDays(today(), newInterval) + 'T00:00:00').getTime(),
      reps: card.reps + 1,
    }
  }
  if (rating === 3) {
    const newInterval = Math.max(1, Math.round(card.interval * card.ease))
    return {
      ...card,
      interval: newInterval,
      due: addDays(today(), newInterval),
      dueTimestamp: new Date(addDays(today(), newInterval) + 'T00:00:00').getTime(),
      reps: card.reps + 1,
    }
  }
  // rating === 4
  const newInterval = Math.max(1, Math.round(card.interval * card.ease * 1.3))
  return {
    ...card,
    interval: newInterval,
    ease: card.ease + 0.15,
    due: addDays(today(), newInterval),
    dueTimestamp: new Date(addDays(today(), newInterval) + 'T00:00:00').getTime(),
    reps: card.reps + 1,
  }
}

/** Rate any card based on its current state. Returns a new card. */
export function rateCard(card: SrsCard, rating: Rating): SrsCard {
  switch (card.state) {
    case 'learning':
    case 'relearning':
      return rateLearningCard(card, rating)
    case 'review':
      return rateReviewCard(card, rating)
    default:
      throw new Error(`Cannot rate card in state: ${card.state}`)
  }
}

/** Create a new card for a word being added to the deck. */
export function createNewCard(wordId: number): SrsCard {
  return {
    wordId,
    state: 'learning',
    ease: DEFAULT_EASE,
    interval: 0,
    due: today(),
    dueTimestamp: now(),
    reps: 0,
    lapses: 0,
    step: 0,
  }
}

/** Mark a card as known, preserving previousState for undo. */
export function markKnown(card: SrsCard): SrsCard {
  return {
    ...card,
    state: 'known',
    previousState: card.state === 'known' ? card.previousState : card.state,
  }
}

/** Create a "known" card for a word that has no existing card. */
export function createKnownCard(wordId: number): SrsCard {
  return {
    ...createNewCard(wordId),
    state: 'known',
  }
}

/** Unmark a known card — restore to previousState or return null (delete). */
export function unmarkKnown(card: SrsCard): SrsCard | null {
  if (card.state !== 'known') return card
  if (card.previousState) {
    const { previousState, ...rest } = card
    return { ...rest, state: previousState }
  }
  return null // card should be deleted
}

/** Compute stats from a list of cards. */
export function computeStats(
  cards: SrsCard[],
  totalWords: number,
  history: Record<string, { reviewed: number; learned: number }>
): import('./types').SrsStats {
  const todayStr = today()
  const todayHistory = history[todayStr] || { reviewed: 0, learned: 0 }

  let totalLearning = 0, totalReview = 0, totalMastered = 0, totalKnown = 0
  for (const card of cards) {
    switch (card.state) {
      case 'known': totalKnown++; break
      case 'learning': case 'relearning': totalLearning++; break
      case 'review':
        if (card.interval >= MASTERED_INTERVAL) totalMastered++
        else totalReview++
        break
    }
  }

  const totalStarted = cards.length - totalKnown
  let streak = 0
  const d = new Date()
  while (true) {
    const dateStr = formatDate(d)
    if (history[dateStr] && history[dateStr].reviewed > 0) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }

  return {
    todayReviewed: todayHistory.reviewed,
    todayLearned: todayHistory.learned,
    totalWords,
    totalStarted,
    unseenWords: totalWords - totalStarted - totalKnown,
    totalLearning,
    totalReview,
    totalMastered,
    totalKnown,
    streak,
    deckSize: cards.length - totalKnown,
  }
}

/** Build the study queue from a list of cards. */
export function buildQueue(cards: SrsCard[]): import('./types').CardQueue {
  const learning: SrsCard[] = []
  const review: SrsCard[] = []

  for (const card of cards) {
    if (card.state === 'known') continue
    if (!isDue(card)) continue
    if (card.state === 'review') review.push(card)
    else learning.push(card) // learning or relearning
  }

  learning.sort((a, b) => a.dueTimestamp - b.dueTimestamp)
  review.sort((a, b) => (a.due > b.due ? 1 : -1))

  return { learning, review, total: learning.length + review.length }
}
```

Note: `formatDate` is imported from `date-utils` — add `import { formatDate } from './date-utils'` at the top.

- [ ] **Step 3: Update packages/shared/src/index.ts**

Ensure it exports everything:
```typescript
export * from './types'
export * from './srs-engine'
export * from './date-utils'
```

- [ ] **Step 4: Verify shared package compiles**

Run: `pnpm --filter @english-learning/shared typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add pure SRS engine and date utils (immutable, no side effects)"
```

---

## Chunk 2: API — Database + Content Routes

### Task 4: D1 schema and migration

**Files:**
- Create: `packages/api/src/db/migrations/0001_initial.sql`

- [ ] **Step 1: Write the migration SQL**

Copy the complete schema from the spec (`docs/superpowers/specs/2026-03-13-backend-sync-design.md` lines 122-275) verbatim into `0001_initial.sql`. Include all CREATE TABLE, CREATE INDEX, and FOREIGN KEY statements. Note: Do NOT add `PRAGMA foreign_keys = ON` — D1 does not persist PRAGMA across connections, so FK enforcement must be handled at the application layer in query code.

- [ ] **Step 2: Create wrangler.toml**

Create `packages/api/wrangler.toml`:

```toml
name = "english-learning-api"
main = "src/index.ts"
compatibility_date = "2025-03-01"

[vars]
ALLOWED_ORIGIN = "http://localhost:5173"

[[d1_databases]]
binding = "DB"
database_name = "english-learning"
database_id = "placeholder-replace-after-create"
```

- [ ] **Step 3: Create local D1 database and apply migration**

Run from `packages/api/`:
```bash
pnpm wrangler d1 create english-learning
# Copy the database_id from the output into wrangler.toml
pnpm wrangler d1 migrations apply english-learning --local
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/
git commit -m "feat(api): add D1 schema migration with all tables and indexes"
```

---

### Task 5: Worker entry + CORS middleware

**Files:**
- Create: `packages/api/src/index.ts`
- Create: `packages/api/src/env.ts`
- Create: `packages/api/src/middleware/cors.ts`

- [ ] **Step 1: Create env.ts (Worker bindings type)**

```typescript
// packages/api/src/env.ts
export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
}
```

- [ ] **Step 2: Create CORS middleware**

```typescript
// packages/api/src/middleware/cors.ts
import { cors } from 'hono/cors'
import type { Env } from '../env'

export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const allowed = c.env.ALLOWED_ORIGIN
      // Allow comma-separated origins
      const origins = allowed.split(',').map(o => o.trim())
      return origins.includes(origin) ? origin : origins[0]
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
}
```

- [ ] **Step 3: Create index.ts (Hono app entry)**

```typescript
// packages/api/src/index.ts
import { Hono } from 'hono'
import type { Env } from './env'
import { corsMiddleware } from './middleware/cors'

const app = new Hono<{ Bindings: Env }>()

app.use('*', corsMiddleware())

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Routes will be added in subsequent tasks

export default app
```

- [ ] **Step 4: Test locally**

Run from `packages/api/`:
```bash
pnpm wrangler dev
```
Then: `curl http://localhost:8787/api/health`
Expected: `{"ok":true}`

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/
git commit -m "feat(api): add Hono worker entry with CORS middleware and health check"
```

---

### Task 6: Content query functions

**Files:**
- Create: `packages/api/src/db/queries/languages.ts`
- Create: `packages/api/src/db/queries/words.ts`
- Create: `packages/api/src/db/queries/passages.ts`

**Context:** Each query file exports typed functions that take a `D1Database` and return typed results. No business logic — just SQL.

- [ ] **Step 1: Create languages queries**

```typescript
// packages/api/src/db/queries/languages.ts
import type { Language } from '@english-learning/shared'

export async function getAllLanguages(db: D1Database): Promise<Language[]> {
  const { results } = await db.prepare(
    'SELECT id, name, native_name as nativeName FROM languages ORDER BY name'
  ).all<Language>()
  return results ?? []
}
```

- [ ] **Step 2: Create words queries**

```typescript
// packages/api/src/db/queries/words.ts
import type { Word } from '@english-learning/shared'

interface WordRow {
  id: number; language_id: string; word: string; pos: string;
  phonetic: string; definition_native: string; definition_target: string;
  examples: string; level: string; topics: string; audio_url: string | null;
}

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    languageId: row.language_id,
    word: row.word,
    pos: row.pos,
    phonetic: row.phonetic,
    definitionNative: row.definition_native,
    definitionTarget: row.definition_target,
    examples: JSON.parse(row.examples || '[]'),
    level: row.level as Word['level'],
    topics: JSON.parse(row.topics || '[]'),
    audioUrl: row.audio_url ?? undefined,
  }
}

export async function getWords(
  db: D1Database,
  opts: { lang: string; level?: string; topic?: string; page?: number; pageSize?: number }
): Promise<{ items: Word[]; total: number }> {
  const { lang, level, topic, page = 1, pageSize = 50 } = opts
  const conditions = ['language_id = ?']
  const params: unknown[] = [lang]

  if (level) { conditions.push('level = ?'); params.push(level) }
  if (topic) { conditions.push('topics LIKE ?'); params.push(`%"${topic}"%`) }

  const where = conditions.join(' AND ')

  const countResult = await db.prepare(
    `SELECT COUNT(*) as count FROM words WHERE ${where}`
  ).bind(...params).first<{ count: number }>()
  const total = countResult?.count ?? 0

  const offset = (page - 1) * pageSize
  const { results } = await db.prepare(
    `SELECT * FROM words WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all<WordRow>()

  return { items: (results ?? []).map(rowToWord), total }
}

export async function getWordById(db: D1Database, id: number): Promise<Word | null> {
  const row = await db.prepare('SELECT * FROM words WHERE id = ?')
    .bind(id).first<WordRow>()
  return row ? rowToWord(row) : null
}

export async function getWordsByIds(db: D1Database, ids: number[]): Promise<Word[]> {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  const { results } = await db.prepare(
    `SELECT * FROM words WHERE id IN (${placeholders})`
  ).bind(...ids).all<WordRow>()
  return (results ?? []).map(rowToWord)
}
```

- [ ] **Step 3: Create passages queries**

```typescript
// packages/api/src/db/queries/passages.ts
import type { Passage } from '@english-learning/shared'

interface PassageRow {
  id: number; language_id: string; title: string; text: string;
  level: string; topic: string; genre: string | null;
  audio_url: string | null; timestamps: string | null;
}

function rowToPassage(row: PassageRow): Passage {
  return {
    id: row.id,
    languageId: row.language_id,
    title: row.title,
    text: row.text,
    level: row.level as Passage['level'],
    topic: row.topic as Passage['topic'],
    genre: row.genre ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    timestamps: row.timestamps ? JSON.parse(row.timestamps) : undefined,
  }
}

// Summary row — excludes text and timestamps (not selected in list queries)
interface PassageSummaryRow {
  id: number; language_id: string; title: string;
  level: string; topic: string; genre: string | null; audio_url: string | null;
}

function rowToPassageSummary(row: PassageSummaryRow): Omit<Passage, 'text' | 'timestamps'> {
  return {
    id: row.id,
    languageId: row.language_id,
    title: row.title,
    level: row.level as Passage['level'],
    topic: row.topic as Passage['topic'],
    genre: row.genre ?? undefined,
    audioUrl: row.audio_url ?? undefined,
  }
}

export async function getPassages(
  db: D1Database,
  opts: { lang: string; level?: string; topic?: string; page?: number; pageSize?: number }
): Promise<{ items: Omit<Passage, 'text' | 'timestamps'>[]; total: number }> {
  const { lang, level, topic, page = 1, pageSize = 50 } = opts
  const conditions = ['language_id = ?']
  const params: unknown[] = [lang]

  if (level) { conditions.push('level = ?'); params.push(level) }
  if (topic) { conditions.push('topic = ?'); params.push(topic) }

  const where = conditions.join(' AND ')

  const countResult = await db.prepare(
    `SELECT COUNT(*) as count FROM passages WHERE ${where}`
  ).bind(...params).first<{ count: number }>()
  const total = countResult?.count ?? 0

  const offset = (page - 1) * pageSize
  const { results } = await db.prepare(
    `SELECT id, language_id, title, level, topic, genre, audio_url FROM passages WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all<PassageSummaryRow>()

  return { items: (results ?? []).map(rowToPassageSummary), total }
}

export async function getPassageById(db: D1Database, id: number): Promise<Passage | null> {
  const row = await db.prepare('SELECT * FROM passages WHERE id = ?')
    .bind(id).first<PassageRow>()
  return row ? rowToPassage(row) : null
}

export async function getPassageWordIds(db: D1Database, passageId: number): Promise<number[]> {
  const { results } = await db.prepare(
    'SELECT word_id FROM passage_words WHERE passage_id = ?'
  ).bind(passageId).all<{ word_id: number }>()
  return (results ?? []).map(r => r.word_id)
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/db/queries/
git commit -m "feat(api): add typed D1 query functions for languages, words, passages"
```

---

### Task 7: Content route handlers

**Files:**
- Create: `packages/api/src/routes/languages.ts`
- Create: `packages/api/src/routes/words.ts`
- Create: `packages/api/src/routes/passages.ts`
- Modify: `packages/api/src/index.ts` (wire routes)

- [ ] **Step 1: Create languages route**

```typescript
// packages/api/src/routes/languages.ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getAllLanguages } from '../db/queries/languages'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const languages = await getAllLanguages(c.env.DB)
  return c.json({ data: languages })
})

export default app
```

- [ ] **Step 2: Create words route**

```typescript
// packages/api/src/routes/words.ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getWords, getWordById } from '../db/queries/words'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const lang = c.req.query('lang')
  if (!lang) return c.json({ error: 'lang is required', code: 'MISSING_LANG' }, 400)

  const result = await getWords(c.env.DB, {
    lang,
    level: c.req.query('level'),
    topic: c.req.query('topic'),
    page: Number(c.req.query('page')) || 1,
    pageSize: Number(c.req.query('pageSize')) || 50,
  })
  return c.json({ data: result })
})

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const word = await getWordById(c.env.DB, id)
  if (!word) return c.json({ error: 'Word not found', code: 'NOT_FOUND' }, 404)
  return c.json({ data: word })
})

export default app
```

- [ ] **Step 3: Create passages route**

```typescript
// packages/api/src/routes/passages.ts
import { Hono } from 'hono'
import type { Env } from '../env'
import { getPassages, getPassageById, getPassageWordIds } from '../db/queries/passages'
import { getWordsByIds } from '../db/queries/words'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const lang = c.req.query('lang')
  if (!lang) return c.json({ error: 'lang is required', code: 'MISSING_LANG' }, 400)

  const result = await getPassages(c.env.DB, {
    lang,
    level: c.req.query('level'),
    topic: c.req.query('topic'),
    page: Number(c.req.query('page')) || 1,
    pageSize: Number(c.req.query('pageSize')) || 50,
  })
  return c.json({ data: result })
})

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const passage = await getPassageById(c.env.DB, id)
  if (!passage) return c.json({ error: 'Passage not found', code: 'NOT_FOUND' }, 404)

  // Load linked words with definitions
  const wordIds = await getPassageWordIds(c.env.DB, id)
  const words = await getWordsByIds(c.env.DB, wordIds)

  return c.json({ data: { ...passage, words } })
})

export default app
```

- [ ] **Step 4: Wire routes into index.ts**

Update `packages/api/src/index.ts` to mount all content routes:

```typescript
import languagesRoutes from './routes/languages'
import wordsRoutes from './routes/words'
import passagesRoutes from './routes/passages'

app.route('/api/languages', languagesRoutes)
app.route('/api/words', wordsRoutes)
app.route('/api/passages', passagesRoutes)
```

- [ ] **Step 5: Test locally with seed data**

Insert test data into the local D1 database and verify the endpoints return correct JSON.

Run: `pnpm wrangler dev` and test with curl.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/
git commit -m "feat(api): add public content routes (languages, words, passages)"
```

---

## Chunk 3: API — Auth + User Data Routes

### Task 8: Clerk auth middleware

**Files:**
- Create: `packages/api/src/middleware/auth.ts`
- Create: `packages/api/src/db/queries/users.ts`

**Context:** Verify Clerk JWT, extract clerk_id, look up or create the internal user_id. Requires `@clerk/backend` package.

- [ ] **Step 1: Install Clerk backend SDK**

Run from `packages/api/`: `pnpm add @clerk/backend`

- [ ] **Step 2: Create users query**

```typescript
// packages/api/src/db/queries/users.ts
export async function getOrCreateUser(db: D1Database, clerkId: string): Promise<number> {
  // Try to find existing user
  const existing = await db.prepare(
    'SELECT id FROM users WHERE clerk_id = ?'
  ).bind(clerkId).first<{ id: number }>()

  if (existing) return existing.id

  // Create new user
  const result = await db.prepare(
    'INSERT INTO users (clerk_id) VALUES (?) RETURNING id'
  ).bind(clerkId).first<{ id: number }>()

  if (!result) throw new Error('Failed to create user')
  return result.id
}
```

- [ ] **Step 3: Create auth middleware**

```typescript
// packages/api/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import type { Env } from '../env'
import { getOrCreateUser } from '../db/queries/users'

// Extend Hono context with userId
declare module 'hono' {
  interface ContextVariableMap {
    userId: number
    clerkId: string
  }
}

export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }

    const token = authHeader.slice(7)
    try {
      const payload = await verifyToken(token, {
        secretKey: c.env.CLERK_SECRET_KEY,
      })
      const clerkId = payload.sub
      if (!clerkId) throw new Error('No sub in token')

      const userId = await getOrCreateUser(c.env.DB, clerkId)
      c.set('userId', userId)
      c.set('clerkId', clerkId)
      await next()
    } catch {
      return c.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, 401)
    }
  }
)
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/
git commit -m "feat(api): add Clerk JWT auth middleware with user auto-creation"
```

---

### Task 9: SRS card routes + cardService

**Files:**
- Create: `packages/api/src/db/queries/cards.ts`
- Create: `packages/api/src/db/queries/history.ts`
- Create: `packages/api/src/services/cardService.ts`
- Create: `packages/api/src/routes/cards.ts`

**Context:** This is the most important set of routes. `cardService` uses the shared `srs-engine` for computation but handles the D1 read/write and ease conversion (x1000). All writes use `db.batch()` for atomicity.

- [ ] **Step 1: Create cards queries**

Functions: `getCardsByUser`, `upsertCard`, `getCardByUserAndWord`, `insertReviewLog`. Each function takes `db: D1Database` and typed params. The `ease` column stores integers (2500 = 2.5). Conversion happens in `cardService`, not here.

- [ ] **Step 2: Create history queries**

Functions: `getHistoryByUser`, `incrementReviewed`, `incrementLearned`. `incrementReviewed` and `incrementLearned` use `INSERT ... ON CONFLICT ... DO UPDATE SET reviewed = reviewed + 1`.

- [ ] **Step 3: Create cardService**

The service orchestrates:
- `getAllCardsWithStats(db, userId)` — loads cards, converts ease from DB int to float, computes stats, returns everything
- `addCard(db, userId, wordId)` — creates card via `createNewCard()` from shared engine, converts ease to int, upserts, increments history.learned
- `rateCard(db, userId, wordId, rating)` — loads card, validates card is not in `'known'` state (return 400 if so), converts ease to float, calls `srs-engine.rateCard()`, converts back, upserts card + inserts review_log + increments history.reviewed in one `db.batch()`
- `markKnown(db, userId, wordId, known: boolean)` — uses shared `markKnown()`/`unmarkKnown()`

Key: ease conversion pattern:
```typescript
const EASE_MULTIPLIER = 1000
const fromDb = (ease: number) => ease / EASE_MULTIPLIER
const toDb = (ease: number) => Math.round(ease * EASE_MULTIPLIER)
```

- [ ] **Step 4: Create cards route**

Wire the 4 endpoints:
- `GET /api/cards` → `cardService.getAllCardsWithStats()`
- `POST /api/cards/add` → `cardService.addCard()`
- `POST /api/cards/rate` → `cardService.rateCard()`
- `PATCH /api/cards/:wordId/known` → `cardService.markKnown()`

All routes use `authMiddleware` and read `c.get('userId')`.

- [ ] **Step 5: Wire into index.ts**

```typescript
import cardsRoutes from './routes/cards'
app.use('/api/cards/*', authMiddleware)
app.route('/api/cards', cardsRoutes)
```

- [ ] **Step 6: Test with wrangler dev**

Manually test with curl + a fake JWT (or temporarily bypass auth for testing).

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/
git commit -m "feat(api): add SRS card routes with rating, stats, and review logging"
```

---

### Task 10: User words, passages-read, history, settings routes

**Files:**
- Create: `packages/api/src/db/queries/userWords.ts`
- Create: `packages/api/src/db/queries/settings.ts`
- Create: `packages/api/src/routes/userWords.ts`
- Create: `packages/api/src/routes/passagesRead.ts`
- Create: `packages/api/src/routes/history.ts`
- Create: `packages/api/src/routes/settings.ts`

**Context:** These are simpler CRUD endpoints. `POST /api/user-words` must create both the user_word and the srs_card in a single `db.batch()` transaction.

- [ ] **Step 1: Create userWords queries + route**

- `getUserWords(db, userId, langId)` — returns all user words for a language
- `createUserWord(db, userId, data)` — INSERT with UNIQUE constraint, returns the created word with auto-assigned ID
- Route: `GET /api/user-words?lang=en`, `POST /api/user-words`
- The POST handler must also create an SRS card in the same batch

- [ ] **Step 2: Create passagesRead queries + route**

- `getPassagesRead(db, userId)` — SELECT passage_id FROM passages_read WHERE user_id = ?
- `markPassageRead(db, userId, passageId)` — INSERT OR IGNORE
- Route: `GET /api/user/passages-read`, `POST /api/user/passages-read/:id`
- Note: The spec's data flow section shows `POST /api/passages/101/read` — this is outdated. Use `/api/user/passages-read/:id` consistently (matches the endpoint table). Update the spec data flow if needed.

- [ ] **Step 3: Create history route**

- Route: `GET /api/history` — returns history from cards queries (already loaded in Task 9)
- Thin wrapper over `getHistoryByUser(db, userId)`

- [ ] **Step 4: Create settings queries + route**

- `getSettings(db, userId)` — SELECT, return defaults if no row exists
- `saveSettings(db, userId, settings)` — INSERT OR REPLACE
- Route: `GET /api/settings`, `PUT /api/settings`

- [ ] **Step 5: Wire all routes into index.ts**

All user routes use `authMiddleware`.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/
git commit -m "feat(api): add user-words, passages-read, history, and settings routes"
```

---

## Chunk 4: Frontend — API Client + Auth + Stores

### Task 11: Typed API client

**Files:**
- Create: `packages/web/src/api/client.ts`
- Create: `packages/web/src/api/words.ts`
- Create: `packages/web/src/api/passages.ts`
- Create: `packages/web/src/api/cards.ts`
- Create: `packages/web/src/api/userWords.ts`
- Create: `packages/web/src/api/settings.ts`

**Context:** Each file is a thin typed wrapper around `fetch`. `client.ts` handles base URL, auth header attachment, and error handling. Other files import from `client.ts`.

- [ ] **Step 1: Create client.ts**

```typescript
// packages/web/src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  if (tokenGetter) {
    const token = await tokenGetter()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText, code: 'UNKNOWN' }))
    throw new ApiError(res.status, body.code, body.error)
  }

  const json = await res.json()
  return json.data !== undefined ? json.data : json
}
```

- [ ] **Step 2: Create words.ts, passages.ts, cards.ts, userWords.ts, settings.ts**

Each file exports typed functions that call `apiFetch`. For example:

```typescript
// packages/web/src/api/cards.ts
import { apiFetch } from './client'
import type { SrsCard, SrsStats, SrsHistory, Rating } from '@/types'

export async function getCards(): Promise<{
  cards: SrsCard[]; stats: SrsStats; history: Record<string, SrsHistory>
}> {
  return apiFetch('/api/cards')
}

export async function addCard(wordId: number): Promise<SrsCard> {
  return apiFetch('/api/cards/add', {
    method: 'POST',
    body: JSON.stringify({ wordId }),
  })
}

export async function rateCardApi(wordId: number, rating: Rating): Promise<SrsCard> {
  return apiFetch('/api/cards/rate', {
    method: 'POST',
    body: JSON.stringify({ wordId, rating }),
  })
}

export async function markKnownApi(wordId: number, known: boolean): Promise<void> {
  return apiFetch(`/api/cards/${wordId}/known`, {
    method: 'PATCH',
    body: JSON.stringify({ known }),
  })
}
```

Follow the same pattern for words, passages, userWords, settings.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/api/
git commit -m "feat(web): add typed API client with auth header injection"
```

---

### Task 12: Auth store (Clerk integration)

**Files:**
- Create: `packages/web/src/stores/auth.ts`
- Modify: `packages/web/src/main.ts`

**Context:** Install `@clerk/vue` (the official Vue SDK). The auth store wraps Clerk's reactive state and exposes `isLoggedIn`, `user`, `signIn()`, `signOut()`. It also calls `setTokenGetter()` from `api/client.ts` so that all API calls automatically include the JWT.

- [ ] **Step 1: Install Clerk Vue SDK**

Run from `packages/web/`: `pnpm add @clerk/vue`

- [ ] **Step 2: Create stores/auth.ts**

Use Clerk Vue composables (`useAuth`, `useUser`, `useClerk`). The store:
- Exposes `isLoggedIn` (computed from Clerk's `isSignedIn`)
- Exposes `user` (from Clerk)
- On init: if user is signed in, call `setTokenGetter(() => clerk.session.getToken())`
- `signOut()`: calls `clerk.signOut()`, then resets all other stores

- [ ] **Step 3: Update main.ts**

Replace the current synchronous bootstrap with async:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.mount('#app')
```

Note: WordIndex.build() and AudioPlayer.init() can remain, but they no longer load user words (those come from the API now).

- [ ] **Step 4: Create .env.example**

```
VITE_API_BASE_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/
git commit -m "feat(web): add Clerk auth integration with auth store"
```

---

### Task 13: Rewrite Pinia stores to use API

**Files:**
- Rewrite: `packages/web/src/stores/srs.ts`
- Create: `packages/web/src/stores/language.ts`
- Create: `packages/web/src/stores/passages.ts`
- Create: `packages/web/src/stores/settings.ts`
- Modify: `packages/web/src/stores/studySession.ts`

**Context:** All stores now call `api/*` functions instead of `lib/storage.ts`. Data is cached in Vue refs. Actions are async. The `_version` pattern is no longer needed since refs update directly.

- [ ] **Step 1: Create stores/language.ts**

```typescript
// Holds the current language. When changed, triggers reload of other stores.
export const useLanguageStore = defineStore('language', () => {
  const currentLanguage = ref('en')

  function setLanguage(lang: string) {
    currentLanguage.value = lang
    // Other stores watch this and reload
  }

  return { currentLanguage, setLanguage }
})
```

- [ ] **Step 2: Rewrite stores/srs.ts**

Remove all imports from `lib/srs-storage`, `lib/srs-queue`, `lib/user-words`, `lib/storage`. Replace with:

```typescript
import * as cardsApi from '@/api/cards'
import { buildQueue, computeStats } from '@english-learning/shared'

export const useSrsStore = defineStore('srs', () => {
  const cards = ref<SrsCard[]>([])
  const history = ref<Record<string, SrsHistory>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stats = computed(() => computeStats(cards.value, totalWordCount.value, history.value))
  const dueCount = computed(() => {
    const queue = buildQueue(cards.value)
    return { learning: queue.learning.length, review: queue.review.length, total: queue.total }
  })

  async function loadCards() {
    loading.value = true
    try {
      const data = await cardsApi.getCards()
      cards.value = data.cards
      history.value = data.history
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function rateCard(wordId: number, rating: Rating): Promise<SrsCard> {
    const updated = await cardsApi.rateCardApi(wordId, rating)
    // Update card in local cache
    const idx = cards.value.findIndex(c => c.wordId === wordId)
    if (idx >= 0) cards.value[idx] = updated
    else cards.value.push(updated)
    return updated
  }

  // ... similar pattern for addWordFromReading, markAsKnown, etc.

  return { cards, history, stats, dueCount, loading, error, loadCards, rateCard, ... }
})
```

- [ ] **Step 3: Create stores/passages.ts**

Replaces the old `usePassages` composable. Fetches passage list from API, tracks read state.

- [ ] **Step 4: Create stores/settings.ts**

Fetches and saves settings via API. Theme stays in localStorage (no API call).

- [ ] **Step 5: Create stores/wordList.ts**

Replaces the old `wordListQuery.ts`. Fetches words from `GET /api/words` with pagination and filters (language, level, topic, search text). Must be rewritten BEFORE Task 14 deletes `src/data/` static files.

```typescript
import * as wordsApi from '@/api/words'

export const useWordListStore = defineStore('wordList', () => {
  const words = ref<Word[]>([])
  const total = ref(0)
  const page = ref(1)
  const filters = ref({ level: '', topic: '', search: '' })
  const loading = ref(false)

  async function loadWords() {
    loading.value = true
    const lang = useLanguageStore().currentLanguage
    const result = await wordsApi.getWords({
      lang, page: page.value,
      level: filters.value.level || undefined,
      topic: filters.value.topic || undefined,
    })
    words.value = result.items
    total.value = result.total
    loading.value = false
  }

  // ... filter setters, page navigation, etc.
  return { words, total, page, filters, loading, loadWords }
})
```

- [ ] **Step 6: Update stores/studySession.ts**

Minimal change — it already gets cards from the srs store. Ensure it calls `useSrsStore.rateCard()` which is now async.

- [ ] **Step 7: Commit**

```bash
git add packages/web/src/stores/
git commit -m "feat(web): rewrite all stores to use API instead of localStorage"
```

---

## Chunk 5: Frontend — Views + Cleanup + Migration

### Task 14: Update composables and views

**Files:**
- Modify: various composables that import from deleted libs
- Modify: views that reference old store APIs
- Delete: `packages/web/src/lib/storage.ts`
- Delete: `packages/web/src/lib/srs-storage.ts`
- Delete: `packages/web/src/lib/srs-queue.ts`
- Delete: `packages/web/src/lib/user-words.ts`
- Delete: `packages/web/src/composables/usePassages.ts`
- Delete: `packages/web/src/data/` (static content files)

**Context:** Remove all localStorage data code. Update composables to use new stores. Update views for auth UI. The `data/` directory is removed because content now comes from the API.

- [ ] **Step 1: Update composables**

- `usePassageView.ts` — replace `usePassages()` with `usePassagesStore()`
- `useFreeWordLookup.ts` — replace direct `saveUserWord`/`srsAddUserWord` with `useSrsStore.addUserWordFromFreeTooltip()`
- `useTheme.ts` — keep localStorage for theme (per spec decision #7), remove import of `Storage`
- `useStudySession.ts` — ensure it works with async `srs.rateCard()`

- [ ] **Step 2: Add auth UI to App.vue / BottomNav.vue**

Add a sign-in/sign-out button. Use Clerk's `<SignInButton>` and `<UserButton>` components, or build a simple button that triggers `useAuthStore().signIn()`.

- [ ] **Step 3: Update SettingsView.vue**

Add account section (sign in/out). Replace `resetProgress()` to call the API reset endpoint.

- [ ] **Step 4: Add language selector**

Add a language dropdown/selector in the nav or settings. On change, calls `useLanguageStore().setLanguage()`.

- [ ] **Step 5: Delete old files**

Remove all the files listed above. Run typecheck to verify nothing is broken.

- [ ] **Step 6: Update WordListView, ReadingView, PassageView**

These views now fetch data from API via stores instead of importing static data. The word list uses pagination. The passage view fetches a single passage with linked words.

- [ ] **Step 7: Verify typecheck and build**

Run: `pnpm --filter @english-learning/web typecheck`
Run: `pnpm --filter @english-learning/web build` (update build script to remove `validate-words` step)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(web): remove localStorage data layer, wire all views to API"
```

---

### Task 15: Content migration script

**Files:**
- Create: `packages/api/scripts/migrate-content.ts`

**Context:** Import existing b2.json words and passages from the old static data files into D1.

- [ ] **Step 1: Write migration script**

The script:
1. Reads `b2.json` → inserts into `words` table (mapping `zh`→`definition_native`, `en`→`definition_target`)
2. Reads `passages-*.ts` exports → inserts into `passages` table
3. For each passage, inserts `passage_words` rows from `wordIds`
4. Inserts the `en` language record
5. Runs via `wrangler d1 execute` or direct D1 API

- [ ] **Step 2: Run migration locally**

Run against local D1, verify data with a SELECT query.

- [ ] **Step 3: Commit**

```bash
git add packages/api/scripts/
git commit -m "feat(api): add content migration script for existing B2 words and passages"
```

---

### Task 16: Deploy

- [ ] **Step 1: Create D1 database on Cloudflare**

```bash
cd packages/api
pnpm wrangler d1 create english-learning
# Update wrangler.toml with the real database_id
```

- [ ] **Step 2: Apply migration to production D1**

```bash
pnpm wrangler d1 migrations apply english-learning --remote
```

- [ ] **Step 3: Set Worker secrets**

```bash
pnpm wrangler secret put CLERK_SECRET_KEY
```

- [ ] **Step 4: Deploy Worker**

```bash
pnpm wrangler deploy
```

- [ ] **Step 5: Run content migration against production**

Run the migration script from Task 15 against the remote D1.

- [ ] **Step 6: Configure Cloudflare Pages**

- Build command: `cd packages/web && pnpm build`
- Output directory: `packages/web/dist`
- Environment variables: `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`

- [ ] **Step 7: Update wrangler.toml ALLOWED_ORIGIN**

Set to the production Pages URL.

- [ ] **Step 8: Configure Clerk production instance**

- Add the production domain to Clerk's allowed origins
- Enable Google OAuth in Clerk dashboard

- [ ] **Step 9: Smoke test**

Test all flows:
- Anonymous browsing (words, passages)
- Sign up with email/password
- Sign in with Google
- Add word to deck, study, rate
- Switch device, verify progress synced
- Sign out, verify anonymous state

- [ ] **Step 10: Commit any config changes**

```bash
git add -A
git commit -m "chore: configure deployment for Cloudflare Pages + Workers"
```

---

## Task Dependencies

```
Task 1 (monorepo) → Task 2 (shared types) → Task 3 (SRS engine)
                  → Task 4 (D1 schema) → Task 5 (worker entry)

Task 2 + Task 5 → Task 6 (content queries) → Task 7 (content routes)
Task 2 + Task 5 → Task 8 (auth middleware) → Task 9 (card routes) → Task 10 (other user routes)
Task 3 → Task 9 (card routes use shared SRS engine via cardService)

Task 7 + Task 10 → Task 11 (API client) → Task 12 (auth store) → Task 13 (rewrite stores)
                                                                 → Task 14 (update views)

Task 14 → Task 15 (migration) → Task 16 (deploy)
```

**Parallelizable:** Tasks 6+8 can run in parallel (both depend on Task 5). Tasks 9+10 can partially overlap. Frontend Tasks 11-14 require the API to be functional.
