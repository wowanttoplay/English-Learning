# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vocabulary learning web app implementing Anki-style spaced repetition (SM-2 algorithm) for the Oxford 5000 word list. Built with Vue 3 + TypeScript + Pinia + Vite. Hash-based routing for static deployment.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build (validate-words + typecheck + bundle)
npm run typecheck    # Type check only (vue-tsc --noEmit)
npm run validate:words  # Validate word JSON files (IDs, duplicates, topics, fields)
npm run generate-timestamps  # Generate sentence timestamps via Whisper API
```

## Architecture

Vite + Vue 3 SPA with Pinia state management, hash router, and TypeScript throughout. Responsive layout: sidebar navigation on desktop (>=768px), bottom tab bar on mobile.

### Directory structure

```
src/
  main.ts                      # createApp + router + pinia
  App.vue                      # div.app-main(RouterView) + BottomNav + WordDetailModal
  types/index.ts               # Word, Passage, SrsCard, CefrLevel, DomainId, SubtopicId, SentenceTimestamp, etc.
  router/index.ts              # 6 hash routes
  data/                        # Static data (words, topics, passages)
    topics.ts                  # DOMAINS (5) + SUBTOPICS (16) + helpers; TOPIC_REGISTRY kept as alias
    words/                     # Word data (JSON + loader)
      b2.json                  # All B2 words (563 unique entries)
      index.ts                 # Loads JSON, exports ALL_WORDS
    words.ts                   # Imports ALL_WORDS, deduplicates, sorts by TOPIC_ORDER → WORD_LIST
    passages-002.ts            # Passage batch 2 (12 B2-level passages)
    passages-003.ts            # Passage batch 3 (6 B1-level passages, IDs 101-106)
    passages-004.ts            # Passage batch 4 (9 B1-level passages, IDs 107-115)
    passages-005.ts            # Passage batch 5 (10 B1-level passages, IDs 116-125)
    passages.ts                # Aggregates PASSAGES from batches 002-005
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
    sentence-splitter.ts         # Sentence splitting with character offsets (shared by UI + scripts)
    timestamp-loader.ts          # Sentence timestamp fetch + in-memory cache (R2 JSON)
  styles/                      # Modular CSS (imported in App.vue)
    tokens.css                 # CSS custom properties (colors, spacing, fonts) for light/dark themes
    base.css                   # Reset, typography, shared utilities (.btn, .fade-in, .toggle)
    layout.css                 # Mobile-first layout + @media desktop overrides (sidebar, nav)
    components.css             # Component-specific styles (flashcard, tooltip, player, modal, etc.)
  stores/                      # Pinia stores (focused, single-responsibility)
    srs.ts                     # useSrsStore — SRS actions + addWordFromReading() + addUserWordFromFreeTooltip() + markAsKnown()/unmarkKnown()
    studySession.ts            # useStudySessionStore — study queue, index, reveal, advance, skipCurrent
    wordListQuery.ts           # useWordListQueryStore — word list filter/search/pagination state
    uiState.ts                 # useUiStateStore — cross-view UI state (modal)
  composables/
    useAudio.ts                # Audio playback only (speak, speakSlow, speakSentence)
    useDictionary.ts           # Dictionary API lookups (fetch, getCached, clearCache)
    useStudySession.ts         # Study session logic (dict fetch, preload, auto-play)
    usePassages.ts             # Reactive passage read state (passagesRead, isRead, markRead)
    useTheme.ts                # Dark/light theme toggle + setTheme
    useKeyboardShortcuts.ts    # Key event bindings
    usePassageView.ts          # PassageView logic (tokenization, tooltip state, scroll-lock)
    usePassageAudioPlayer.ts   # Audio player state machine (play/pause/seek/speed, fallback)
    useFreeWordLookup.ts       # Dictionary lookup + save-to-deck logic for non-B2 words
    usePassageSentenceSync.ts  # Audio-to-sentence sync (timestamps + DOM highlight + scroll)
  components/                  # Presentational UI components
    BottomNav.vue (desktop sidebar nav + mobile bottom tab bar), WordDetailModal.vue, ProgressBar.vue,
    StatsGrid.vue, WeeklyHeatmap.vue,
    RatingButtons.vue, AudioControls.vue, WordTooltip.vue,
    FreeWordTooltip.vue              # Universal word lookup (presentational, uses useFreeWordLookup)
    PassageAudioPlayer.vue           # Audio player (presentational, receives props from view)
  views/                       # Route-level views
    DashboardView.vue, StudyView.vue,
    WordListView.vue, ReadingView.vue, PassageView.vue,
    SettingsView.vue
scripts/
  validate-words.ts            # Build-time validation: auto-discovers JSON in src/data/words/, checks IDs, duplicates, levels, topics, fields
  generate-timestamps.ts       # Whisper-based sentence timestamp generation for passage audio
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

**Reading → Discovery:** user browses passage list (filterable by three simultaneous filter rows: Level [All / B1 / B2] + Domain [All / life / work / society / people / knowledge] + Subtopic [per-domain subtopics]) → reads passage → all words in passage text are tappable (`span.plain-word`). B2 highlighted words open `WordTooltip` (definition + "Save to Deck"), plain words open `FreeWordTooltip` (universal lookup via dictionaryapi.dev showing definition, phonetic, audio, with "Search on Google" fallback and "Save to Deck" button; handles loading, not-found, and cached states). The two tooltips are mutually exclusive. `useSrsStore.addWordFromReading()` → `addUserWord()` creates SrsCard with state `'learning'` immediately → card appears in next study session. For non-B2 words, `useSrsStore.addUserWordFromFreeTooltip()` → `saveUserWord()` persists a user-created Word (level `'user'`, IDs 100001+) to localStorage `user_words` and inserts it into WordIndex, then creates an SRS card. B1-level passages use simpler sentence structures and more B1 vocabulary to ease the transition for lower-level learners. During audio playback, sentences are highlighted in sync via timestamp data loaded from R2. `usePassageSentenceSync` watches `currentTime` from the audio player and imperatively toggles `.sentence-active` class on sentence `<span>` elements. Highlighting is skipped in Web Speech API fallback mode.

**Study → Review only:** `useSrsStore.getCardsForToday()` returns only learning/relearning/review cards already in deck (no new card auto-introduction) → `useStudySessionStore` manages queue → user rates → SRS updates localStorage → `_version` ref triggers reactive recomputation.

**Mark as Known:** user can mark a word as already known from three places: WordTooltip (in passages), StudyView (during review), or WordListView (star toggle). `useSrsStore.markAsKnown(wordId)` → `srs-storage.markAsKnown()` sets card state to `'known'` and saves `previousState` for undo. Known cards are excluded from the study queue. Users can unmark via `unmarkKnown()` which restores the `previousState`. WordListView has a dedicated "Known" filter tab. Stats include `totalKnown` count.

### Key conventions

- **TypeScript throughout**: All `.ts` and `.vue` files are typed; `src/types/index.ts` defines shared interfaces
- **Pinia stores**: `_version` ref pattern for triggering reactivity on localStorage-backed SRS data
- **CSS**: Modular CSS in `src/styles/` (tokens → base → layout → components), imported in `App.vue`. Apple-style minimal design with CSS custom properties for theming (light/dark). Responsive: `@media (min-width: 768px)` breakpoint in `layout.css` switches from mobile bottom nav to desktop sidebar nav
- **Layout/Logic separation**: Views are pure templates — business logic lives in per-view composables (`usePassageView`, etc.). Components are presentational — logic in composables (`usePassageAudioPlayer`, `useFreeWordLookup`). Stores are focused single-responsibility (`studySession`, `wordListQuery`, `uiState`)
- **Date handling**: Local `formatDate(d)` helper (not `toISOString`) to avoid timezone bugs
- **Audio**: 3-tier fallback: dictionaryapi.dev audio URLs > Web Speech API > silent. Async preload with HTMLAudioElement caching; dict-api uses in-memory Map cache to avoid repeated JSON.parse of localStorage. Passage audio supports sentence-level highlighting via timestamp sidecar files (`passage-{id}.timestamps.json`) on R2; `usePassageAudioPlayer` is instantiated in `PassageView.vue` (lifted from component) to share `currentTime` with sentence sync
- **localStorage**: All access via `lib/storage.ts` typed methods; keys: `srs_data`, `dict_cache`, `theme`, `settings_audio`, `passages_read`, `user_words`
- **Dependency direction**: `data → lib → stores → composables → components → views` (no reverse imports)
- **User word IDs**: User-created words use IDs starting at 100001 (`USER_WORD_ID_START = 100000` in `user-words.ts`), with level `'user'`; WordListView has a "My Words" filter tab
- **Initialization**: `main.ts` calls `WordIndex.build()`, loads user words into WordIndex via `loadUserWords()` + `WordIndex.addWord()`, and calls `AudioPlayer.init()` before mount

## Type System

### CEFR Levels

- `CefrCoreLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'` — standard CEFR levels
- `CefrLevel = CefrCoreLevel | 'user'` — extends with user-created words
- `Word.level` uses `CefrLevel`; `Passage.level` uses `CefrCoreLevel`

### Topic Hierarchy (Domain → Subtopic)

Words are tagged with 1-3 subtopics (`SubtopicId[]`). The 16 subtopics are organized into 5 domains:

| Domain (`DomainId`) | Subtopics (`SubtopicId`) |
|---|---|
| `life` | `daily-life`, `health`, `travel` |
| `work` | `work`, `business`, `technology` |
| `society` | `society`, `politics`, `law`, `environment` |
| `people` | `relationships`, `emotions`, `communication` |
| `knowledge` | `education`, `science`, `arts` |

Defined in `src/data/topics.ts`: `DOMAINS` array, `SUBTOPICS` array, helper functions `getSubtopicsByDomain()` and `getDomainBySubtopic()`. `TOPIC_REGISTRY` is kept as a backward-compatibility alias for `SUBTOPICS`.

Topics are used for word browsing/filtering in WordListView (Domain + Subtopic pill buttons) and passage filtering in ReadingView (Level + Domain + Subtopic rows). There is no topic-based filtering for SRS — all word discovery happens through reading passages.

## Adding Words

Words are stored as JSON in `src/data/words/`. Currently there is one file (`b2.json`) containing all B2 words. Future CEFR levels will add more JSON files (e.g., `a1.json`, `b1.json`, `c1.json`).

The loader (`src/data/words/index.ts`) imports all JSON files and exports `ALL_WORDS`. The aggregator (`src/data/words.ts`) deduplicates and sorts by `TOPIC_ORDER` into `WORD_LIST`.

To add new words, edit the appropriate JSON file directly. Each word entry:
```json
{
  "id": 601,
  "word": "negotiate",
  "pos": "verb",
  "phonetic": "/nɪˈɡəʊʃieɪt/",
  "zh": "谈判；协商",
  "en": "to try to reach an agreement by formal discussion",
  "examples": [
    "The two sides agreed to negotiate a ceasefire.",
    "She negotiated a higher salary before accepting the job."
  ],
  "level": "B2",
  "topics": ["business", "work"]
}
```

Rules:
- `zh`: Chinese translation, max 20 characters
- `en`: English definition, max 150 characters
- `examples`: exactly 2 sentences, each 8-15 words, context vocabulary at A2-B1 level
- `topics`: 1-3 subtopic IDs from the hierarchy above
- `level`: valid `CefrLevel` (typically `"B2"` for current dataset)
- No duplicates with existing entries (checked by `validate-words` at build time)
- Validate: `npm run validate:words` (also runs automatically in `npm run build`)

## Generating Passages

File naming: `src/data/passages-{NNN}.ts` (sequential batch number, currently up to 005).
Start ID: check max existing passage ID + 1 (currently 125).

Each passage entry must follow this structure:
```ts
{
  id: 126,
  title: "A Healthy Morning Routine",
  genre: "explainer",
  text: "Full passage text with target B2 words...",
  wordIds: [185, 580, 257],
  level: "B1",
  topic: "health",
}
```

Rules:
- `level`: `CefrCoreLevel` — use `'B1'` for easier bridge passages, `'B2'` for standard passages
- `genre`: choose from existing genres (`news`, `essay`, `travel`, `opinion`, `story`, `interview`, `explainer`)
- `topic`: one of the 16 `SubtopicId` values
- `text`: 120-180 words; sentence length 8-18 words; surrounding vocabulary mostly A2-B1 for B1-level passages
- `wordIds`: array of word IDs (numbers) for B2 target words that appear in the passage text and exist in `WORD_LIST`
- Each passage covers one topic; aim for diverse topic coverage across a batch
- After creating, import in `src/data/passages.ts` and spread into `PASSAGES`
- Validate: `npm run typecheck`

Current passage counts: 12 B2-level (batch 002) + 25 B1-level (batches 003-005) = 37 total passages.

## Generating Timestamps

Sentence-level timestamp files enable audio-synced highlighting in PassageView.

File naming: `passage-{id}.timestamps.json`, hosted on R2 alongside passage MP3s.

Each timestamp file:
```json
[
  { "index": 0, "start": 0.0, "end": 3.2, "text": "First sentence." },
  { "index": 1, "start": 3.2, "end": 6.8, "text": "Second sentence." }
]
```

Generation:
- Requires `OPENAI_API_KEY` environment variable
- `npm run generate-timestamps` — generate all (skip existing)
- `npm run generate-timestamps -- --force` — regenerate all
- `npm run generate-timestamps -- --id 101,102` — specific passages
- Upload to R2: `rclone copy output/audio/passages/ r2:$R2_BUCKET/audio/passages/ --include "*.timestamps.json" --progress`
- Uses `splitSentences()` from `lib/sentence-splitter.ts` to align Whisper output with UI sentence indices

## Team Mode

Team mode is **always active by default**. Use team `english-learning` and spawn teammates automatically for every task. See `memory/MEMORY.md` for full team roles, boundaries, and workflow.

### Roles
- **orchestrator** (team lead): User communication, task decomposition, review, commit decisions. Does NOT read/write code directly.
- **codex-advisor**: Calls Codex CLI for read-only code analysis, architecture review, trade-off evaluation.
- **content-writer**: Generates word/passage batches in `src/data/` only.
- **implementer**: Code changes, feature dev, bug fixes, build/test, TTS audio generation.
- **qa**: Typecheck, tests, data consistency verification. Read-only.
- **doc-updater**: Syncs CLAUDE.md, MEMORY.md, docs/architecture.md.

### Workflow
```
User request → orchestrator decomposes tasks
  → content-writer (if content needed)
  → implementer (if code/audio needed)
  → qa (verify)
  → doc-updater (sync docs)
  → orchestrator reviews → commit/push
```
