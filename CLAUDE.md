# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vocabulary learning web app implementing Anki-style spaced repetition (SM-2 algorithm) for the Oxford 5000 word list. pnpm monorepo with 3 packages: Vue 3 frontend, Cloudflare Workers API, and shared types/logic. Hash-based routing for static deployment. Clerk authentication with D1 database backend.

## Development

```bash
pnpm install                # Install all workspace dependencies
pnpm dev                    # Start Vite dev server (packages/web)
pnpm build                  # Production build (packages/web: typecheck + bundle)
pnpm typecheck              # Type check all packages (pnpm -r typecheck)
pnpm build:api              # Build API worker (packages/api)

# Dev mode switching (local vs server database):
pnpm dev                                                    # Frontend → local API (localhost:8787)
pnpm --filter @english-learning/web dev:remote              # Frontend → production API (Cloudflare)

# Local D1 database setup (run in order):
pnpm --filter @english-learning/api dev                                    # Start local API
npx wrangler d1 migrations apply english-learning --local                  # Apply schema
pnpm --filter @english-learning/api migrate:content                        # Generate seed.sql
npx wrangler d1 execute english-learning --local --file=seed.sql           # Seed data

# Within packages/web:
pnpm --filter @english-learning/web validate:data      # Validate word, translation, and passage JSON files
pnpm --filter @english-learning/web generate-tts          # Generate TTS audio + sentence timestamps (Google Cloud TTS)

# Within packages/api:
pnpm --filter @english-learning/api dev       # Start Wrangler dev server
pnpm --filter @english-learning/api deploy    # Deploy to Cloudflare Workers
pnpm --filter @english-learning/api migrate:content  # Migrate word/passage data into D1
```

## Architecture

pnpm monorepo with three packages. Vue 3 SPA frontend communicates with a Hono-based Cloudflare Workers API backed by D1 (SQLite). Shared types and SRS engine live in a common package. Clerk handles authentication. Responsive layout: sidebar navigation on desktop (>=768px), bottom tab bar on mobile.

### Directory structure

```
pnpm-workspace.yaml            # Workspace: packages/*
package.json                   # Root scripts delegate to packages

packages/shared/               # @english-learning/shared
  src/
    index.ts                   # Re-exports all shared modules
    types.ts                   # Word, Passage, SrsCard, Level, DomainId, TopicId, etc.
    srs-engine.ts              # Pure SM-2 algorithm + constants (incl. EASE_MULTIPLIER)
    date-utils.ts              # Shared date formatting utilities
    levels.ts                  # Per-language level registry (LevelDef, getLevels, isValidLevel)

packages/api/                  # @english-learning/api (Cloudflare Workers + D1)
  wrangler.toml                # Wrangler config (D1 binding, etc.)
  src/
    index.ts                   # Hono app: mounts routes, CORS, auth middleware
    env.ts                     # Env type (D1, Clerk keys, etc.)
    errors.ts                  # Typed error classes (AppError, NotFoundError, CardKnownError, MissingFieldError)
    middleware/
      auth.ts                  # Clerk JWT validation middleware
      cors.ts                  # CORS middleware
    routes/
      cards.ts                 # SRS card CRUD + review rating
      words.ts                 # Word list queries (content, no auth)
      passages.ts              # Passage queries (content, no auth)
      passagesRead.ts          # User passage read state
      userWords.ts             # User-created word CRUD
      history.ts               # Review history
      settings.ts              # User settings
      languages.ts             # Language/locale data
    db/
      migrations/
        0001_initial.sql       # D1 schema migration
      queries/
        cards.ts               # Card query functions
        words.ts               # Word query functions
        passages.ts            # Passage query functions
        users.ts               # User query functions
        userWords.ts           # User word query functions
        history.ts             # History query functions
        settings.ts            # Settings query functions
        languages.ts           # Language query functions
        passagesRead.ts        # Passage read state queries
    services/
      cardService.ts           # Card business logic
      userWordService.ts       # User word creation + SRS card atomically
  scripts/
    migrate-content.ts         # Seed D1 with word/passage data
    data/
      words/
        b2.json                # B2 word core data (563 entries)
      translations/
        en/b2.json             # English definitions
        zh-CN/b2.json          # Chinese translations
      passages/
        b1.json                # B1 passages (25 entries)
        b2.json                # B2 passages (12 entries)

packages/web/                  # @english-learning/web (Vue 3 + Vite)
  src/
    main.ts                    # createApp + router + pinia + Clerk plugin
    App.vue                    # div.app-main(RouterView) + BottomNav + WordDetailModal
    router/index.ts            # 6 hash routes
    api/                       # Typed API client modules
      client.ts                # Base fetch wrapper (auth token injection, error handling)
      cards.ts                 # SRS card API calls
      words.ts                 # Word list API calls
      passages.ts              # Passage API calls
      settings.ts              # Settings API calls
      userWords.ts             # User word API calls
      languages.ts             # Language API calls
    stores/                    # Pinia stores (call API, not localStorage)
      auth.ts                  # useAuthStore — Clerk auth state + token wiring
      srs.ts                   # useSrsStore — SRS actions via API
      studySession.ts          # useStudySessionStore — study queue, index, reveal, advance
      wordListQuery.ts         # useWordListQueryStore — word list filter/search/pagination
      passages.ts              # usePassagesStore — passage data + read state via API
      settings.ts              # useSettingsStore — user settings via API
      language.ts              # useLanguageStore — language/locale state
      uiState.ts               # useUiStateStore — cross-view UI state (modal)
    data/                      # Client-side static data
      topics.ts                # DOMAINS (5) + SUBTOPICS (16) + helpers
    lib/                       # Pure client-side logic (no Vue dependency)
      dict-api.ts              # Dictionary client + cache, parameterized by language (DICT_PROVIDERS map)
      audio.ts                 # 3-tier audio (explicit init required, async preload with HTMLAudioElement cache)
      format.ts                # Shared formatting utilities (formatTopic)
      sentence-splitter.ts     # Sentence splitting with character offsets + language-aware word patterns (getWordPattern)
      timestamp-loader.ts      # Sentence timestamp fetch + in-memory cache (R2 JSON)
    styles/                    # Modular CSS (imported in App.vue)
      tokens.css               # CSS custom properties (colors, spacing, fonts) for light/dark themes
      base.css                 # Reset, typography, shared utilities (.btn, .fade-in, .toggle)
      layout.css               # Mobile-first layout + @media desktop overrides (sidebar, nav)
      components.css           # Component-specific styles (flashcard, tooltip, player, modal, etc.)
    composables/
      useAudio.ts              # Audio playback only (speak, speakSlow, speakSentence)
      useDictionary.ts         # Dictionary API lookups (fetch, getCached, clearCache), language-aware
      useStudySession.ts       # Study session logic (dict fetch, preload, auto-play)
      useTheme.ts              # Dark/light theme toggle + setTheme
      useKeyboardShortcuts.ts  # Key event bindings
      usePassageView.ts        # PassageView logic (tooltip state, scroll-lock) — delegates inflections to useInflectionMatcher
      useInflectionMatcher.ts  # Language-aware word inflection matching (strategy pattern per language)
      usePassageAudioPlayer.ts # Audio player state machine (play/pause/seek/speed, fallback)
      useFreeWordLookup.ts     # Dictionary lookup + save-to-deck logic for non-B2 words
      usePassageSentenceSync.ts # Audio-to-sentence sync (timestamps + DOM highlight + scroll)
      useWordTooltip.ts        # WordTooltip business logic (SRS state, card actions)
      useWordModal.ts          # WordDetailModal data loading (word fetch, dict, SRS state)
    components/                # Presentational UI components
      BottomNav.vue (desktop sidebar nav + mobile bottom tab bar), WordDetailModal.vue, ProgressBar.vue,
      StatsGrid.vue, WeeklyHeatmap.vue,
      RatingButtons.vue, AudioControls.vue, WordTooltip.vue,
      FreeWordTooltip.vue              # Universal word lookup (presentational, uses useFreeWordLookup)
      PassageAudioPlayer.vue           # Audio player (presentational, receives props from view)
    views/                     # Route-level views
      DashboardView.vue, StudyView.vue,
      WordListView.vue, ReadingView.vue, PassageView.vue,
      SettingsView.vue
  scripts/
    validate-data.ts           # Build-time validation: checks IDs, duplicates, levels, topics, fields, passage cross-refs
    generate-tts.ts            # TTS audio + sentence timestamps (Google Cloud TTS); loads data from packages/api/scripts/data/
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

### API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/languages` | No | Language/locale data |
| GET | `/api/words` | No | Word list (with filters) |
| GET | `/api/passages` | No | Passage list |
| * | `/api/cards/*` | Yes | SRS card CRUD + review |
| * | `/api/user-words/*` | Yes | User-created words |
| * | `/api/user/passages-read/*` | Yes | Passage read state |
| * | `/api/history/*` | Yes | Review history |
| * | `/api/settings/*` | Yes | User settings |

### Data flow

**Authentication:** Clerk handles sign-in/sign-up. `useAuthStore` (packages/web) watches Clerk state and wires a token getter into the API client (`packages/web/src/api/client.ts`). The API client injects `Authorization: Bearer <token>` into all requests. Server-side, `packages/api/src/middleware/auth.ts` validates JWTs on protected routes.

**Reading → Discovery:** user browses passage list (filterable by three simultaneous filter rows: Level [All / B1 / B2] + Domain [All / life / work / society / people / knowledge] + Subtopic [per-domain subtopics]) → reads passage → all words in passage text are tappable (`span.plain-word`). B2 highlighted words open `WordTooltip` (definition + "Save to Deck"), plain words open `FreeWordTooltip` (universal lookup via dictionaryapi.dev showing definition, phonetic, audio, with "Search on Google" fallback and "Save to Deck" button; handles loading, not-found, and cached states). The two tooltips are mutually exclusive. `useSrsStore.addWordFromReading()` creates an SRS card via the API with state `'learning'` immediately → card appears in next study session. For non-B2 words, `useSrsStore.addUserWordFromFreeTooltip()` persists a user-created Word (level `'user'`, IDs 100001+) via the API and creates an SRS card. B1-level passages use simpler sentence structures and more B1 vocabulary to ease the transition for lower-level learners. During audio playback, sentences are highlighted in sync via timestamp data loaded from R2. `usePassageSentenceSync` watches `currentTime` from the audio player and imperatively toggles `.sentence-active` class on sentence `<span>` elements. Highlighting is skipped in Web Speech API fallback mode.

**Study → Review only:** `useSrsStore.getCardsForToday()` fetches cards due for review from the API → `useStudySessionStore` manages queue → user rates → SRS updates via API → store reactivity triggers recomputation.

**Mark as Known:** user can mark a word as already known from three places: WordTooltip (in passages), StudyView (during review), or WordListView (star toggle). `useSrsStore.markAsKnown(wordId)` calls the API to set card state to `'known'` and saves `previousState` for undo. Known cards are excluded from the study queue. Users can unmark via `unmarkKnown()` which restores the `previousState`. WordListView has a dedicated "Known" filter tab. Stats include `totalKnown` count.

### Key conventions

- **TypeScript throughout**: All `.ts` and `.vue` files are typed; shared types in `packages/shared/src/types.ts`
- **Pinia stores**: All stores call API endpoints (via `packages/web/src/api/`) rather than localStorage directly
- **CSS**: Modular CSS in `packages/web/src/styles/` (tokens → base → layout → components), imported in `App.vue`. Apple-style minimal design with CSS custom properties for theming (light/dark). Responsive: `@media (min-width: 768px)` breakpoint in `layout.css` switches from mobile bottom nav to desktop sidebar nav
- **Layout/Logic separation**: Views are pure templates — business logic lives in per-view composables (`usePassageView`, etc.). Components are presentational — logic in composables (`usePassageAudioPlayer`, `useFreeWordLookup`). Stores are focused single-responsibility (`studySession`, `wordListQuery`, `uiState`)
- **Date handling**: `formatDate(d)` in `packages/shared/src/date-utils.ts` (not `toISOString`) to avoid timezone bugs
- **Audio**: 3-tier fallback: dictionaryapi.dev audio URLs > Web Speech API > silent. Async preload with HTMLAudioElement caching; dict-api uses in-memory Map cache to avoid repeated JSON.parse of localStorage. Passage audio supports sentence-level highlighting via timestamp sidecar files (`passage-{id}.timestamps.json`) on R2; `usePassageAudioPlayer` is instantiated in `PassageView.vue` (lifted from component) to share `currentTime` with sentence sync
- **localStorage**: Only used for client-side caching/preferences: `dict_cache_<lang>`, `theme`, `settings_audio`. All user data (SRS cards, passages read, user words, settings) stored in D1 via API
- **Dependency direction**: `shared → api`, `shared → web`; within web: `api → stores → composables → components → views` (no reverse imports)
- **User word IDs**: User-created words use IDs starting at 100001, with level `'user'`; WordListView has a "My Words" filter tab
- **Auth**: Clerk integration — `@clerk/vue` on frontend, `@clerk/backend` on API. Auth store initializes in `App.vue` and wires Clerk token into API client
- **Initialization**: `main.ts` installs Clerk plugin, creates router + pinia, and calls `AudioPlayer.init()` before mount
- **EASE_MULTIPLIER**: Defined once in `packages/shared/src/srs-engine.ts`. Used by `cardService.ts` and `userWordService.ts` to convert between float ease (domain) and integer ease (DB storage). Never define locally.

### Architecture Patterns

- **Typed errors (API):** Services throw `AppError` subclasses (`NotFoundError`, `CardKnownError`, `MissingFieldError`) from `packages/api/src/errors.ts`. Routes catch `AppError` and return `{ error, code }` with appropriate HTTP status. Never match on error message strings.
- **Route → Service → Query:** Routes are thin HTTP handlers. Business logic lives in `services/`. Raw SQL lives in `db/queries/`. Routes never construct SQL directly.
- **Language strategy pattern:** English-specific logic is isolated behind strategy maps keyed by language code. Files using this pattern: `useInflectionMatcher.ts` (word inflections), `dict-api.ts` (dictionary providers via `DICT_PROVIDERS`), `sentence-splitter.ts` (word tokenization via `WORD_PATTERNS` / `getWordPattern()`). To add a new language, add an entry to each strategy map.
- **Component purity:** Components (`components/`) must not import stores or API modules directly. Business logic lives in composables (`useWordTooltip`, `useWordModal`, `useFreeWordLookup`). Components receive reactive state and callbacks from composables.
- **Level registry:** Per-language level definitions in `packages/shared/src/levels.ts`. UI components (`LevelBadge`, filter tabs) read from the registry via `getLevels(lang)`. Colors come from the registry's `color` field (inline style), with CSS class fallback for existing levels. Adding a new language's levels requires only adding a registry entry — no type, component, or view changes needed.

## Type System

### Levels

- `Level = string` — language-specific difficulty level (e.g., 'A1'-'C2' for English, 'N5'-'N1' for Japanese)
- `'user'` is a special sentinel level for user-created words (not in the level registry)
- Level definitions live in `packages/shared/src/levels.ts` — per-language registry with `{ id, name, order, color }`
- To add a new language's levels, add an entry to the `LEVELS` record in `levels.ts`
- `Word.level` uses `Level`; `Passage.level` uses `Level`

### Topic Hierarchy (Domain → Subtopic)

Words are tagged with 1-3 topics (`TopicId[]`). Types `DomainId` and `TopicId` are `string` aliases. The 18 topics are organized into 5 domains:

| Domain (`DomainId`) | Topics (`TopicId`) |
|---|---|
| `life` | `daily-life`, `health`, `travel`, `food`, `sports` |
| `work` | `work`, `business` |
| `society` | `society`, `politics`, `law` |
| `people` | `relationships`, `emotions`, `communication` |
| `knowledge` | `education`, `science`, `arts`, `technology`, `environment` |

Defined in `packages/web/src/data/topics.ts`: `DOMAINS` array, `SUBTOPICS` array, helper functions `getSubtopicsByDomain()` and `getDomainBySubtopic()`. `TOPIC_REGISTRY` is kept as a backward-compatibility alias for `SUBTOPICS`.

Topics are used for word browsing/filtering in WordListView (Domain + Subtopic pill buttons) and passage filtering in ReadingView (Level + Domain + Subtopic rows). There is no topic-based filtering for SRS — all word discovery happens through reading passages.

## Adding Words

Words are stored as JSON in `packages/api/scripts/data/`. Currently there is one file (`b2.json`) containing all B2 words. Future CEFR levels will add more JSON files (e.g., `a1.json`, `b1.json`, `c1.json`).

After editing JSON files, run `pnpm --filter @english-learning/api migrate:content` to seed the D1 database.

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
- No duplicates with existing entries (checked by `validate:data` at build time)
- Validate: `pnpm --filter @english-learning/web validate:data`

## Generating Passages

File naming: `packages/api/scripts/data/passages-{NNN}.ts` (sequential batch number, currently up to 005).
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
- `wordIds`: array of word IDs (numbers) for B2 target words that appear in the passage text and exist in the word list
- Each passage covers one topic; aim for diverse topic coverage across a batch
- After creating, run `pnpm --filter @english-learning/api migrate:content` to seed D1
- Validate: `pnpm typecheck`

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

Generation: Timestamps are generated alongside MP3 audio by `generate-tts.ts` using Google Cloud TTS with SSML `<mark>` tags — no separate STT step needed.
- Requires Google Cloud auth: `gcloud auth application-default login`
- `pnpm --filter @english-learning/web generate-tts` — generate all (skip existing)
- `pnpm --filter @english-learning/web generate-tts -- --force` — regenerate all
- `pnpm --filter @english-learning/web generate-tts -- --only passages` — passages only
- Upload to R2: `rclone copy public/audio/ r2:$R2_BUCKET/audio/ --progress`
- Uses `splitSentences()` from `lib/sentence-splitter.ts` to build SSML with per-sentence marks
