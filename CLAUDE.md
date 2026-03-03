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

Vite + Vue 3 SPA with Pinia state management, hash router, and TypeScript throughout.

### Directory structure

```
src/
  main.ts                      # createApp + router + pinia
  App.vue                      # RouterView + BottomNav + WordDetailModal
  types/index.ts               # Word, Passage, SrsCard, etc.
  router/index.ts              # 7 hash routes
  data/                        # Static data (words, topics, passages)
    topics.ts                  # TOPIC_REGISTRY (16 topics)
    words-b2-001.ts            # Batch 1 (IDs 1-200)
    words-b2-002.ts            # Batch 2 (IDs 201-400)
    words-b2-003.ts            # Batch 3 (IDs 401-600)
    words.ts                   # Aggregates all batches into WORD_LIST
    passages-001.ts            # Passage batch 1
    passages.ts                # Aggregates PASSAGES
  lib/                         # Pure logic (no Vue dependency)
    storage.ts                 # Unified localStorage wrapper (typed domain methods only)
    srs-engine.ts              # Pure SM-2 algorithm + constants
    srs-storage.ts             # SRS data persistence (withData pattern)
    srs-queue.ts               # Queue generation, stats, rateCard
    dict-api.ts                # dictionaryapi.dev client + cache
    audio.ts                   # 3-tier audio (explicit init required)
    word-index.ts              # O(1) word lookup by ID + topic index
    format.ts                  # Shared formatting utilities (formatTopic)
  stores/                      # Pinia stores
    srs.ts                     # useSrsStore — imports srs-engine/storage/queue directly
    session.ts                 # useSessionStore — study session + word list UI state
  composables/
    useAudio.ts                # Audio playback only (speak, speakSlow, speakSentence)
    useDictionary.ts           # Dictionary API lookups (fetch, getCached, clearCache)
    useStudySession.ts         # Study session logic (dict fetch, preload, auto-play)
    usePassages.ts             # Reactive passage read state + formatTopic
    useTheme.ts                # Dark/light theme toggle + setTheme
    useKeyboardShortcuts.ts    # Key event bindings
  components/                  # Reusable UI components
    BottomNav.vue, WordDetailModal.vue, ProgressBar.vue,
    StatsGrid.vue, WeeklyHeatmap.vue, TopicSummary.vue,
    RatingButtons.vue, AudioControls.vue, WordTooltip.vue
  views/                       # Route-level views
    DashboardView.vue, StudyView.vue, TopicsView.vue,
    WordListView.vue, ReadingView.vue, PassageView.vue,
    SettingsView.vue
```

### Routes

| Path | View | Description |
|------|------|-------------|
| `/` | DashboardView | Home stats + start study |
| `/study` | StudyView | Flashcard + session complete |
| `/topics` | TopicsView | Topic filter selection |
| `/words` | WordListView | Browse/search/filter words |
| `/reading` | ReadingView | Passage list |
| `/reading/:id` | PassageView | Single passage reader |
| `/settings` | SettingsView | Settings + reset |

### Data flow

`useSrsStore.getCardsForToday()` builds session queue → `useSessionStore` manages queue/index/revealed → user rates via `useSrsStore.rateCard()` → SRS updates localStorage → Pinia `_version` ref triggers reactive recomputation.

### Key conventions

- **TypeScript throughout**: All `.ts` and `.vue` files are typed; `src/types/index.ts` defines shared interfaces
- **Pinia stores**: `_version` ref pattern for triggering reactivity on localStorage-backed SRS data
- **CSS**: Global `style.css` imported in `App.vue`, uses CSS custom properties for theming
- **Date handling**: Local `formatDate(d)` helper (not `toISOString`) to avoid timezone bugs
- **Audio**: 3-tier fallback: dictionaryapi.dev audio URLs > Web Speech API > silent
- **localStorage**: All access via `lib/storage.ts` typed methods; keys: `srs_data`, `dict_cache`, `theme`, `settings_audio`, `passages_read`
- **Dependency direction**: `data → lib → stores → composables → components → views` (no reverse imports)
- **Initialization**: `main.ts` calls `WordIndex.build()` and `AudioPlayer.init()` before mount

## Topic System

Words are tagged with 1-3 topics from `TOPIC_REGISTRY` (defined in `src/data/topics.ts`). The 16 topic IDs are:

`work`, `education`, `technology`, `health`, `environment`, `society`, `emotions`, `business`, `travel`, `communication`, `science`, `law`, `arts`, `daily-life`, `relationships`, `politics`

SRS filters **new cards only** by active topics; review cards always appear regardless of topic.

## Generating a Topic Word Batch

File naming: `src/data/words-b2-{NNN}.ts` (sequential batch number).
Size: 15-25 words per file.
Start ID: check `WORD_LIST.length` (currently 600), then use max existing ID + 1.

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
