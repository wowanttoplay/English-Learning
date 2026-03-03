# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vocabulary learning web app implementing Anki-style spaced repetition (SM-2 algorithm) for the Oxford 5000 word list. Built with Vue 3 + TypeScript + Pinia + Vite. Hash-based routing for static deployment.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build (typecheck + bundle)
npm run typecheck    # Type check only (vue-tsc --noEmit)
```

## Architecture

Vite + Vue 3 SPA with Pinia state management, hash router, and TypeScript throughout. Responsive layout: sidebar navigation on desktop (>=768px), bottom tab bar on mobile.

### Directory structure

```
src/
  main.ts                      # createApp + router + pinia
  App.vue                      # div.app-main(RouterView) + BottomNav + WordDetailModal
  types/index.ts               # Word, Passage (with difficulty field), SrsCard (with 'known' state + previousState), etc.
  router/index.ts              # 6 hash routes
  data/                        # Static data (words, topics, passages)
    topics.ts                  # TOPIC_REGISTRY (16 topics)
    words-b2-001.ts            # Batch 1 (IDs 1-200)
    words-b2-002.ts            # Batch 2 (IDs 201-400)
    words-b2-003.ts            # Batch 3 (IDs 401-600)
    words.ts                   # Aggregates batches, deduplicates, sorts by TOPIC_ORDER
    passages-001.ts            # Passage batch 1 (legacy, not imported)
    passages-002.ts            # Passage batch 2 (12 genre-varied passages, standard difficulty)
    passages-003.ts            # Passage batch 3 (6 bridge passages IDs 101-106, B1→B2 difficulty)
    passages-004.ts            # Passage batch 4 (9 bridge passages IDs 107-115, B1→B2 difficulty)
    passages.ts                # Aggregates PASSAGES from batches 002-004
  lib/                         # Pure logic (no Vue dependency)
    storage.ts                 # Unified localStorage wrapper (typed domain methods only)
    srs-engine.ts              # Pure SM-2 algorithm + constants (no initCard)
    srs-storage.ts             # SRS data persistence (withData pattern) + addUserWord() creates card immediately + markAsKnown()/unmarkKnown()
    srs-queue.ts               # Review-only queue generation (excludes known cards), stats (includes totalKnown), rateCard
    dict-api.ts                # dictionaryapi.dev client + cache (in-memory Map + localStorage)
    audio.ts                   # 3-tier audio (explicit init required, async preload with HTMLAudioElement cache)
    word-index.ts              # O(1) word lookup by ID, text, and topic index + addWord() for incremental insertion
    user-words.ts              # User word persistence (loadUserWords, saveUserWord, nextUserWordId, isUserWord)
    format.ts                  # Shared formatting utilities (formatTopic)
  stores/                      # Pinia stores
    srs.ts                     # useSrsStore — SRS actions + addWordFromReading() + addUserWordFromFreeTooltip() + markAsKnown()/unmarkKnown()
    session.ts                 # useSessionStore — study session + word list UI state + skipCurrent()
  composables/
    useAudio.ts                # Audio playback only (speak, speakSlow, speakSentence)
    useDictionary.ts           # Dictionary API lookups (fetch, getCached, clearCache)
    useStudySession.ts         # Study session logic (dict fetch, preload, auto-play)
    usePassages.ts             # Reactive passage read state (passagesRead, isRead, markRead)
    useTheme.ts                # Dark/light theme toggle + setTheme
    useKeyboardShortcuts.ts    # Key event bindings
  components/                  # Reusable UI components
    BottomNav.vue (desktop sidebar nav + mobile bottom tab bar), WordDetailModal.vue, ProgressBar.vue,
    StatsGrid.vue, WeeklyHeatmap.vue,
    RatingButtons.vue, AudioControls.vue, WordTooltip.vue,
    FreeWordTooltip.vue              # Universal word lookup for non-B2 words via dictionaryapi.dev
  views/                       # Route-level views
    DashboardView.vue, StudyView.vue,
    WordListView.vue, ReadingView.vue, PassageView.vue,
    SettingsView.vue
```

### Routes

| Path | View | Description |
|------|------|-------------|
| `/` | DashboardView | Home stats + start review |
| `/study` | StudyView | Flashcard review + session complete |
| `/words` | WordListView | Browse/search/filter words |
| `/reading` | ReadingView | Passage list |
| `/reading/:id` | PassageView | Single passage reader |
| `/settings` | SettingsView | Settings + reset |

### Data flow

**Reading → Discovery:** user browses passage list (filterable by two simultaneous filter rows: difficulty [All / Easier / Standard] + topic [All Topics + per-topic with emoji, derived from PASSAGES data via TOPIC_REGISTRY]) → reads passage → all words in passage text are tappable (`span.plain-word`). B2 highlighted words open `WordTooltip` (definition + "Save to Deck"), plain words open `FreeWordTooltip` (universal lookup via dictionaryapi.dev showing definition, phonetic, audio, with "Search on Google" fallback and "Save to Deck" button; handles loading, not-found, and cached states). The two tooltips are mutually exclusive. `useSrsStore.addWordFromReading()` → `addUserWord()` creates SrsCard with state `'learning'` immediately → card appears in next study session. For non-B2 words, `useSrsStore.addUserWordFromFreeTooltip()` → `saveUserWord()` persists a user-created Word (level `'user'`, IDs 100001+) to localStorage `user_words` and inserts it into WordIndex, then creates an SRS card. Bridge passages (`difficulty: 'bridge'`) use simpler sentence structures and more B1 vocabulary to ease the transition for lower-level learners.

**Study → Review only:** `useSrsStore.getCardsForToday()` returns only learning/relearning/review cards already in deck (no new card auto-introduction) → `useSessionStore` manages queue → user rates → SRS updates localStorage → `_version` ref triggers reactive recomputation.

**Mark as Known:** user can mark a word as already known from three places: WordTooltip (in passages), StudyView (during review), or WordListView (star toggle). `useSrsStore.markAsKnown(wordId)` → `srs-storage.markAsKnown()` sets card state to `'known'` and saves `previousState` for undo. Known cards are excluded from the study queue. Users can unmark via `unmarkKnown()` which restores the `previousState`. WordListView has a dedicated "Known" filter tab. Stats include `totalKnown` count.

### Key conventions

- **TypeScript throughout**: All `.ts` and `.vue` files are typed; `src/types/index.ts` defines shared interfaces
- **Pinia stores**: `_version` ref pattern for triggering reactivity on localStorage-backed SRS data
- **CSS**: Global `style.css` imported in `App.vue`, Apple-style minimal design with CSS custom properties for theming (light/dark). Responsive: `@media (min-width: 768px)` breakpoint switches from mobile bottom nav to desktop sidebar nav (`--sidebar-width` CSS variable, `.side-nav` class)
- **Date handling**: Local `formatDate(d)` helper (not `toISOString`) to avoid timezone bugs
- **Audio**: 3-tier fallback: dictionaryapi.dev audio URLs > Web Speech API > silent. Async preload with HTMLAudioElement caching; dict-api uses in-memory Map cache to avoid repeated JSON.parse of localStorage
- **localStorage**: All access via `lib/storage.ts` typed methods; keys: `srs_data`, `dict_cache`, `theme`, `settings_audio`, `passages_read`, `user_words`
- **Dependency direction**: `data → lib → stores → composables → components → views` (no reverse imports)
- **User word IDs**: User-created words use IDs starting at 100001 (`USER_WORD_ID_START = 100000` in `user-words.ts`), with level `'user'`; WordListView has a "My Words" filter tab
- **Initialization**: `main.ts` calls `WordIndex.build()`, loads user words into WordIndex via `loadUserWords()` + `WordIndex.addWord()`, and calls `AudioPlayer.init()` before mount

## Topic System

Words are tagged with 1-3 topics from `TOPIC_REGISTRY` (defined in `src/data/topics.ts`). The 16 topic IDs are:

`work`, `education`, `technology`, `health`, `environment`, `society`, `emotions`, `business`, `travel`, `communication`, `science`, `law`, `arts`, `daily-life`, `relationships`, `politics`

Topics are used for word browsing/filtering in WordListView. There is no topic-based filtering for SRS — all word discovery happens through reading passages.

## Generating a Topic Word Batch

File naming: `src/data/words-b2-{NNN}.ts` (sequential batch number).
Size: 15-25 words per file.
Start ID: check `WORD_LIST.length` (currently 600), then use max existing ID + 1.
Note: `WORD_LIST` is sorted by `TOPIC_ORDER` (defined in `words.ts`) after aggregation, so card introduction order follows topic clusters, not ID order.

Each word entry must follow this structure:
```ts
{
  id: 601,
  word: "negotiate",
  pos: "verb",
  phonetic: "/nɪˈɡəʊʃieɪt/",
  zh: "谈判；协商",
  en: "to try to reach an agreement by formal discussion",
  examples: [
    "The two sides agreed to negotiate a ceasefire.",
    "She negotiated a higher salary before accepting the job."
  ],
  level: "B2",
  topics: ["business", "work"]
}
```

Rules:
- `zh`: Chinese translation, max 20 characters
- `en`: English definition, max 150 characters
- `examples`: exactly 2 sentences, each 8-15 words, context vocabulary at A2-B1 level
- `topics`: primary topic must match the batch theme, plus 0-2 secondary topics
- No duplicates with existing `WORD_LIST` entries (check by word string)
- File format: `import type { Word } from '@/types'` + `export const words: Word[] = [...]`
- After creating, import in `src/data/words.ts` and spread into `WORD_LIST`
- Validate: `npm run typecheck`

## Generating Bridge Passages

Bridge passages (`difficulty: 'bridge'`) are designed for learners transitioning from B1 to B2. They use simpler sentence structures and more familiar vocabulary while still introducing B2 target words in context.

File naming: `src/data/passages-{NNN}.ts` (sequential batch number, currently up to 004).
Start ID: check max existing passage ID + 1 (currently 115).

Each passage entry must follow this structure:
```ts
{
  id: 101,
  title: "A Healthy Morning Routine",
  genre: "lifestyle",
  topic: "health",
  difficulty: "bridge",
  body: "Full passage text with target B2 words...",
  words: ["adequate", "significant", "routine"]
}
```

Rules:
- `difficulty`: must be `'bridge'` for B1->B2 passages, `'standard'` or omitted for regular B2 passages
- `genre`: choose from existing genres (lifestyle, narrative, informational, opinion, advice, etc.)
- `topic`: one of the 16 topic IDs from `TOPIC_REGISTRY`
- `body`: 120-180 words; sentence length 8-18 words; surrounding vocabulary mostly A2-B1
- `words`: 4-8 B2 target words that appear in the passage body and exist in `WORD_LIST`
- Each passage covers one topic; aim for diverse topic coverage across a batch
- After creating, import in `src/data/passages.ts` and spread into `PASSAGES`
- The `Passage` type (in `src/types/index.ts`) has `difficulty?: 'bridge' | 'standard' | 'challenging'`
- Validate: `npm run typecheck`

Current passage counts: 12 standard (batch 002) + 15 bridge (batches 003-004) = 27 total passages.

## Team Mode

When user says **"start team"**, activate team orchestration mode. See `memory/MEMORY.md` for full team roles and workflow.

Key workflow: architect designs → workers implement in parallel → doc updater syncs all docs → verify build → report.
