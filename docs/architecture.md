# Architecture

## Tech Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Language**: TypeScript throughout (`.ts` and `.vue` files)
- **State Management**: Pinia stores with localStorage persistence
- **Routing**: Vue Router with hash-based routing (for static deployment)
- **Build Tool**: Vite
- **Styling**: Global CSS with custom properties for light/dark theming

## Directory Structure

```
src/
  main.ts                        # App entry: createApp, router, pinia, WordIndex.build(), AudioPlayer.init()
  App.vue                        # Root: RouterView + BottomNav + WordDetailModal
  types/index.ts                 # Shared types: Word, Passage, SrsCard, CefrLevel, DomainId, SubtopicId, etc.
  router/index.ts                # 6 hash routes

  data/                          # Static data modules
    topics.ts                    # DOMAINS (5) + SUBTOPICS (16) + helpers; TOPIC_REGISTRY as backward-compat alias
    words/                       # Word data (JSON + loader)
      b2.json                    # All B2 words (563 unique entries)
      index.ts                   # Loads JSON files, exports ALL_WORDS
    words.ts                     # Imports ALL_WORDS, deduplicates, sorts by TOPIC_ORDER → WORD_LIST
    passages-002.ts              # 12 B2-level passages
    passages-003.ts              # 6 B1-level passages (IDs 101-106)
    passages-004.ts              # 9 B1-level passages (IDs 107-115)
    passages-005.ts              # 10 B1-level passages (IDs 116-125)
    passages.ts                  # Aggregates PASSAGES from batches 002-005

  lib/                           # Pure logic (no Vue dependency)
    storage.ts                   # Typed localStorage wrapper (domain-specific methods)
    srs-engine.ts                # Pure SM-2 algorithm + constants
    srs-storage.ts               # SRS data persistence (withData pattern), addUserWord(), markAsKnown()/unmarkKnown()
    srs-queue.ts                 # Review queue generation (excludes known cards), stats, rateCard
    dict-api.ts                  # dictionaryapi.dev client + cache (in-memory Map + localStorage)
    audio.ts                     # 3-tier audio playback (explicit init, async preload, HTMLAudioElement cache)
    word-index.ts                # O(1) word lookup by ID, text, and topic; addWord() for incremental insertion
    user-words.ts                # User word persistence (IDs 100001+, level 'user', stored in localStorage)
    format.ts                    # Shared formatting utilities (formatTopic)

  stores/                        # Pinia stores
    srs.ts                       # useSrsStore: SRS actions, addWordFromReading(), markAsKnown()/unmarkKnown()
    session.ts                   # useSessionStore: study session queue, word list UI state, skipCurrent()

  composables/                   # Vue composables (reactive logic)
    useAudio.ts                  # Audio playback (speak, speakSlow, speakSentence)
    useDictionary.ts             # Dictionary API lookups (fetch, getCached, clearCache)
    useStudySession.ts           # Study session logic (dict fetch, preload, auto-play)
    usePassages.ts               # Reactive passage read state (passagesRead, isRead, markRead)
    useTheme.ts                  # Dark/light theme toggle
    useKeyboardShortcuts.ts      # Key event bindings

  components/                    # Reusable UI components
    BottomNav.vue                # Desktop sidebar nav (>=768px) + mobile bottom tab bar
    WordDetailModal.vue          # Full word detail overlay
    WordTooltip.vue              # B2 word tooltip in passages (definition + Save to Deck)
    FreeWordTooltip.vue          # Universal word lookup for non-B2 words via dictionaryapi.dev
    ProgressBar.vue, StatsGrid.vue, WeeklyHeatmap.vue
    RatingButtons.vue, AudioControls.vue

  views/                         # Route-level views
    DashboardView.vue            # Home stats + start review
    StudyView.vue                # Flashcard review + session complete
    WordListView.vue             # Browse/search/filter words (Domain + Subtopic pills, Known tab, My Words tab)
    ReadingView.vue              # Passage list with Level + Domain + Subtopic filters
    PassageView.vue              # Single passage reader with tappable words
    SettingsView.vue             # Settings + data reset

scripts/
  validate-words.ts              # Build-time validation: auto-discovers JSON in src/data/words/, validates structure
```

## Type System

### CEFR Levels

- `CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'` — standard CEFR levels
- `CefrLevel = CefrCoreLevel | 'user'` — extends with user-created words
- `Word.level` uses `CefrLevel`; `Passage.level` uses `CefrCoreLevel`

### Topic Hierarchy

5 Domains → 16 Subtopics, defined in `src/data/topics.ts`:

| Domain (`DomainId`) | Subtopics (`SubtopicId`) |
|---|---|
| `life` | `daily-life`, `health`, `travel` |
| `work` | `work`, `business`, `technology` |
| `society` | `society`, `politics`, `law`, `environment` |
| `people` | `relationships`, `emotions`, `communication` |
| `knowledge` | `education`, `science`, `arts` |

Exports: `DOMAINS`, `SUBTOPICS`, `getSubtopicsByDomain()`, `getDomainBySubtopic()`, `TOPIC_REGISTRY` (alias for `SUBTOPICS`).

### Passage Type

```ts
interface Passage {
  id: number
  title: string
  text: string           // passage body
  wordIds: number[]      // IDs of B2 target words
  level: CefrCoreLevel   // 'B1' for bridge, 'B2' for standard
  topic: SubtopicId
  genre?: 'news' | 'essay' | 'travel' | 'opinion' | 'story' | 'interview' | 'explainer'
}
```

## Dependency Flow

Strict unidirectional dependency:

```
data --> lib --> stores --> composables --> components --> views
```

No reverse imports. `lib/` modules are pure TypeScript with no Vue dependency. Stores import from `lib/` only. Composables import from stores. Components and views consume composables.

## Routes

| Path             | View             | Description                  |
|------------------|------------------|------------------------------|
| `/`              | DashboardView    | Home stats + start review    |
| `/study`         | StudyView        | Flashcard review session     |
| `/words`         | WordListView     | Browse/search/filter words   |
| `/reading`       | ReadingView      | Passage list                 |
| `/reading/:id`   | PassageView      | Single passage reader        |
| `/settings`      | SettingsView     | Settings + reset             |

## State Management

### Pinia Stores

- **useSrsStore**: Wraps SRS engine, storage, and queue modules. Exposes `getCardsForToday()`, `addWordFromReading()`, `addUserWordFromFreeTooltip()`, `markAsKnown()`, `unmarkKnown()`. Uses a `_version` ref to trigger Vue reactivity when localStorage-backed SRS data changes.
- **useSessionStore**: Manages the active study session queue, word list UI state (filters, search, `wordListDomain`, `wordListTopic`), and `skipCurrent()`.

### localStorage

All access goes through `lib/storage.ts` typed methods. Keys:

| Key              | Content                                  |
|------------------|------------------------------------------|
| `srs_data`       | Card states, intervals, ease factors     |
| `dict_cache`     | Dictionary API response cache            |
| `theme`          | `"light"` or `"dark"`                    |
| `settings_audio` | Auto-play preference                     |
| `passages_read`  | Set of read passage IDs                  |
| `user_words`     | User-created words (IDs 100001+)         |

## Data Flow

### Reading to Discovery

1. User browses passage list in ReadingView (filterable by Level, Domain, and Subtopic).
2. User opens a passage in PassageView. All words in the passage body are tappable (`span.plain-word`).
3. **B2 words** (in WORD_LIST): open `WordTooltip` showing definition + "Save to Deck" button.
4. **Non-B2 words**: open `FreeWordTooltip` which fetches from dictionaryapi.dev, showing definition, phonetic, audio, with "Search on Google" fallback and "Save to Deck" button.
5. The two tooltip types are mutually exclusive (opening one closes the other).
6. "Save to Deck" calls `useSrsStore.addWordFromReading()` (for B2 words) or `addUserWordFromFreeTooltip()` (for non-B2 words), which creates an SRS card with state `'learning'` immediately.

### Study (Review Only)

1. `useSrsStore.getCardsForToday()` returns learning/relearning/review cards already in the deck. No automatic new card introduction.
2. `useSessionStore` manages the review queue.
3. User rates each card (Again / Hard / Good / Easy).
4. SRS engine updates card state in localStorage.
5. `_version` ref increments, triggering reactive recomputation across the app.

### Mark as Known

Users can mark words as already known from WordTooltip (passages), StudyView (during review), or WordListView (star toggle). `markAsKnown()` sets the card state to `'known'` and saves `previousState` for undo. Known cards are excluded from the study queue. `unmarkKnown()` restores the previous state.

## Word Data Storage

Words are stored as JSON files in `src/data/words/`. Currently contains `b2.json` with 563 unique B2 entries. Future CEFR levels (A1, A2, B1, C1, C2) will add additional JSON files to this directory.

The loader (`src/data/words/index.ts`) imports all JSON files and exports `ALL_WORDS`. The aggregator (`src/data/words.ts`) deduplicates by word string (case-insensitive) and sorts by `TOPIC_ORDER` into the final `WORD_LIST`.

Build-time validation (`scripts/validate-words.ts`, wired into `npm run build`) auto-discovers all JSON files in `src/data/words/` and checks for duplicate IDs, invalid levels, invalid topic IDs, and missing required fields.

## Audio System

Three-tier fallback implemented in `lib/audio.ts`:

1. **Cloudflare R2 MP3 files** (configured via `VITE_AUDIO_BASE_URL`): TTS-generated pronunciation files hosted on Cloudflare R2, checked first.
2. **dictionaryapi.dev audio URLs**: Fetched from the dictionary API cache; played via `HTMLAudioElement` with an in-memory element cache (max 100 entries).
3. **Web Speech API**: Browser TTS fallback with automatic en-US voice selection. Normal rate 0.85, slow rate 0.6.

Audio requires explicit initialization (`AudioPlayer.init()` in `main.ts`). Word audio is preloaded asynchronously for upcoming cards in the session queue.

## SRS Algorithm

SM-2 spaced repetition with these card states: `new`, `learning`, `relearning`, `review`, `known`.

- Learning steps: 1 min, 10 min, then graduate to review.
- Default ease factor: 2.5, minimum: 1.3.
- Known cards are excluded from all queues.
- User-created words (from passages) enter directly as `'learning'`.

## Responsive Layout

- **Mobile** (<768px): Bottom tab bar navigation.
- **Desktop** (>=768px): Fixed left sidebar navigation with `--sidebar-width` CSS variable. Main content centered.

## Key Conventions

- **TypeScript throughout**: All files typed; shared interfaces in `src/types/index.ts`.
- **Date handling**: Local `formatDate()` helper (not `toISOString()`) to avoid timezone bugs.
- **Dict API caching**: In-memory `Map` cache avoids repeated `JSON.parse` of localStorage on each lookup.
- **User word IDs**: Start at 100001 (`USER_WORD_ID_START = 100000`), with level `'user'`.
- **Initialization order** in `main.ts`: `WordIndex.build()` -> load user words into WordIndex -> `AudioPlayer.init()` -> app mount.
