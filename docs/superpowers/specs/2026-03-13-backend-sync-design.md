# Backend Sync & Multi-Language Architecture Design

## Overview

Transform the English Learning app from a static single-language SPA into a server-driven multi-language learning platform. The frontend becomes a pure display layer; all data (content + user progress) lives on the server.

## Goals

1. **Cross-device sync** — users log in and pick up where they left off on any device
2. **Multi-language ready** — adding a new language means adding content to the database, zero frontend changes
3. **Content independence** — adding words/passages requires no code deployment
4. **Clean separation** — frontend displays, server decides

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vue 3 + TypeScript + Pinia + Vite | Display + interaction |
| Auth | Clerk | Username/password + Google OAuth |
| API | Cloudflare Workers + Hono | Business logic + content delivery |
| Database | Cloudflare D1 (SQLite) | Content data + user data |
| File storage | Cloudflare R2 | Audio files (word pronunciation, passage reading) |
| Deploy | Cloudflare Pages (frontend) + Workers (API) | Hosting |

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (Vue SPA)                              │
│  Pure display — no business logic, no storage   │
│  Fetches everything from API on demand          │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS (JSON)
┌──────────────────────▼──────────────────────────┐
│  Cloudflare Worker (Hono)                       │
│  Auth · SRS algorithm · Content delivery        │
│  Source of truth for ALL data                   │
└──────────┬───────────────────────┬──────────────┘
           │                       │
┌──────────▼──────────┐  ┌────────▼──────────────┐
│  D1 Database         │  │  R2 Object Storage    │
│  Content + User data │  │  Audio files          │
└─────────────────────┘  └───────────────────────┘
```

## Monorepo Structure

```
english-learning/
  package.json                    # workspace root
  packages/
    shared/                       # shared types + pure logic
      src/
        types.ts                  # all domain types (Word, SrsCard, Passage, etc.)
        srs-engine.ts             # pure SM-2 algorithm, used by API
        date-utils.ts             # date helpers, used by API

    api/                          # Cloudflare Worker
      wrangler.toml               # D1 + R2 bindings
      src/
        index.ts                  # Hono app entry
        middleware/
          auth.ts                 # Clerk JWT → userId
          cors.ts                 # CORS for Pages origin
        routes/
          languages.ts            # language listing
          words.ts                # word queries (by language, level, topic)
          passages.ts             # passage queries + single passage detail
          cards.ts                # SRS card operations (add, rate, known)
          userWords.ts            # user-created word CRUD
          history.ts              # daily review history
          settings.ts             # user settings
          sync.ts                 # anonymous → authenticated migration
        db/
          migrations/
            0001_initial.sql      # all tables
          queries/                # one file per table, typed D1 queries
            languages.ts
            words.ts
            passages.ts
            cards.ts
            userWords.ts
            history.ts
            settings.ts
            users.ts
        services/
          cardService.ts          # SRS queue building, rating, stats
          contentService.ts       # word/passage queries with pagination
          syncService.ts          # merge anonymous data on first login

    web/                          # Vue 3 SPA
      src/
        main.ts                   # bootstrap: init auth → mount
        App.vue                   # root layout
        router/index.ts           # hash router
        api/                      # typed HTTP client
          client.ts               # base fetch wrapper with auth header
          words.ts                # word API calls
          passages.ts             # passage API calls
          cards.ts                # SRS card API calls
          userWords.ts            # user word API calls
          settings.ts             # settings API calls
        stores/
          auth.ts                 # Clerk state, login/logout
          language.ts             # current language selection
          srs.ts                  # SRS cards, stats, actions
          studySession.ts         # study queue, current card
          passages.ts             # passage list, read state
          wordList.ts             # word browsing, filter/search
          uiState.ts              # modal, UI state
          settings.ts             # audio, preferences
        composables/              # UI logic (audio, tooltips, etc.)
        components/               # presentational components
        views/                    # route-level views
        styles/                   # CSS (unchanged)
```

## Database Schema

### Content Tables (managed by admin/scripts)

```sql
-- Supported languages
CREATE TABLE languages (
  id          TEXT PRIMARY KEY,     -- 'en', 'ja', 'zh', etc.
  name        TEXT NOT NULL,        -- 'English', 'Japanese'
  native_name TEXT NOT NULL,        -- 'English', '日本語'
  created_at  TEXT DEFAULT (datetime('now'))
);

-- All words across all languages
CREATE TABLE words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id TEXT NOT NULL,
  word        TEXT NOT NULL,         -- the word itself
  pos         TEXT,                  -- part of speech
  phonetic    TEXT,                  -- IPA or language-specific pronunciation
  definition_native TEXT,            -- definition in learner's context language (e.g. Chinese)
  definition_target TEXT,            -- definition in target language (e.g. English)
  examples    TEXT,                  -- JSON array of example sentences
  level       TEXT NOT NULL,         -- difficulty level (A1/A2/B1/B2/C1/C2 or language-specific)
  topics      TEXT,                  -- JSON array of subtopic IDs
  audio_url   TEXT,                  -- R2 path to pronunciation audio
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_words_lang_level ON words(language_id, level);
CREATE INDEX idx_words_word ON words(language_id, word);

-- All passages across all languages
CREATE TABLE passages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  text        TEXT NOT NULL,
  level       TEXT NOT NULL,
  topic       TEXT NOT NULL,         -- subtopic ID
  genre       TEXT,                  -- news, essay, story, etc.
  audio_url   TEXT,                  -- R2 path to passage audio
  timestamps  TEXT,                  -- JSON array of sentence timestamps
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_passages_lang_level ON passages(language_id, level);
CREATE INDEX idx_passages_topic ON passages(language_id, topic);

-- Which words appear in which passages
CREATE TABLE passage_words (
  passage_id  INTEGER NOT NULL,
  word_id     INTEGER NOT NULL,
  PRIMARY KEY (passage_id, word_id),
  FOREIGN KEY (passage_id) REFERENCES passages(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_passage_words_word ON passage_words(word_id);
```

### User Tables

```sql
-- Users (Clerk handles auth, we store internal ID)
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id    TEXT NOT NULL UNIQUE,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- SRS card state per user per word
CREATE TABLE srs_cards (
  user_id         INTEGER NOT NULL,
  word_id         INTEGER NOT NULL,
  state           TEXT NOT NULL,        -- learning/review/relearning/known
  ease            INTEGER NOT NULL,     -- x1000 (2500 = 2.5)
  interval        INTEGER NOT NULL,     -- days
  due             TEXT NOT NULL,        -- YYYY-MM-DD
  due_timestamp   INTEGER NOT NULL,     -- Unix ms for intraday scheduling
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  step            INTEGER NOT NULL DEFAULT 0,
  previous_state  TEXT,                 -- for undo "mark as known"
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE RESTRICT
);

CREATE INDEX idx_srs_cards_due ON srs_cards(user_id, due);

-- Immutable review log (for analytics and algorithm tuning)
CREATE TABLE review_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  word_id     INTEGER NOT NULL,
  rating      INTEGER NOT NULL,        -- 1-4
  state       TEXT NOT NULL,           -- card state at time of rating
  ease        INTEGER NOT NULL,        -- ease after rating
  interval    INTEGER NOT NULL,        -- interval after rating
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_review_log_user ON review_log(user_id, reviewed_at);

-- Daily learning statistics
CREATE TABLE srs_history (
  user_id     INTEGER NOT NULL,
  date        TEXT NOT NULL,           -- YYYY-MM-DD
  reviewed    INTEGER NOT NULL DEFAULT 0,
  learned     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User-created custom words
CREATE TABLE user_words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  language_id TEXT NOT NULL,
  word        TEXT NOT NULL,
  pos         TEXT,
  phonetic    TEXT,
  definition_native TEXT,
  definition_target TEXT,
  examples    TEXT,                     -- JSON array
  topics      TEXT,                     -- JSON array
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, language_id, word),  -- no duplicate words per user per language
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_user_words_user ON user_words(user_id, language_id);

-- Passages the user has read
CREATE TABLE passages_read (
  user_id     INTEGER NOT NULL,
  passage_id  INTEGER NOT NULL,
  read_at     TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, passage_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (passage_id) REFERENCES passages(id) ON DELETE CASCADE
);

-- User settings
CREATE TABLE user_settings (
  user_id     INTEGER PRIMARY KEY,
  current_language TEXT DEFAULT 'en',   -- which language the user is currently studying
  settings    TEXT NOT NULL DEFAULT '{}', -- JSON (audioAutoPlay, etc.)
  updated_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (current_language) REFERENCES languages(id)
);
```

## API Endpoints

### Content (public, no auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/languages` | List all supported languages |
| `GET` | `/api/words?lang=en&level=B2&topic=work&page=1` | Paginated word list with filters |
| `GET` | `/api/words/:id` | Single word detail |
| `GET` | `/api/passages?lang=en&level=B1&topic=health&page=1` | Paginated passage list with filters |
| `GET` | `/api/passages/:id` | Single passage with full text + linked words |

### User Data (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cards` | All SRS cards + stats + history for current language |
| `POST` | `/api/cards/add` | Add word to deck |
| `POST` | `/api/cards/rate` | Rate a card (SM-2 computed server-side) |
| `PATCH` | `/api/cards/:wordId/known` | Mark/unmark as known |
| `GET` | `/api/user-words` | List user-created words |
| `POST` | `/api/user-words` | Create a user word |
| `GET` | `/api/user/passages-read` | List read passage IDs |
| `POST` | `/api/user/passages-read/:id` | Mark passage as read |
| `GET` | `/api/settings` | Get user settings |
| `PUT` | `/api/settings` | Update user settings |
| `POST` | `/api/sync/push` | One-time migration from anonymous to authenticated |

## Data Flows

### App Startup (authenticated user)

```
1. main.ts initializes Clerk → user is logged in
2. Fetch user settings → get current_language
3. Fetch SRS cards for current language → populate store
4. Mount Vue app → render dashboard with stats from store
5. User navigates to reading → fetch passages on demand
6. User navigates to word list → fetch words on demand
```

### Reading a Passage

```
1. User opens passage list → GET /api/passages?lang=en&level=B1
2. User taps a passage → GET /api/passages/101
3. Server returns: title, text, audio_url, timestamps, linked words (with definitions)
4. Frontend renders passage with tappable words
5. User taps a word → tooltip shows definition (already in response data)
6. User taps "Save to Deck" → POST /api/cards/add { wordId: 257 }
7. User finishes reading → POST /api/passages/101/read
```

### Study Session

```
1. User enters study view
2. Store already has cards from startup → filter due cards → build queue
3. User sees card → reveals answer → rates 1-4
4. POST /api/cards/rate { wordId: 257, rating: 3 }
5. Server: load card → srs-engine.rate() → update srs_cards → insert review_log → update srs_history
6. Server returns: updated card
7. Store updates local cache → next card
```

### Login Migration (anonymous → authenticated)

```
1. Anonymous user has been browsing (content is public)
2. User signs up / logs in via Clerk
3. No local data to migrate (anonymous users cannot save progress)
4. Store fetches fresh data from server → empty for new users
5. User starts learning from scratch (or picks up if they had an account)
```

### Adding a New Language (admin workflow)

```
1. Insert language record: INSERT INTO languages VALUES ('ja', 'Japanese', '日本語')
2. Bulk import words: INSERT INTO words (language_id, word, ...) VALUES ('ja', '食べる', ...)
3. Bulk import passages with passage_words links
4. Upload audio to R2: audio/ja/words/食べる.mp3
5. Done — users can now select Japanese in settings and start learning
```

## Anonymous User Experience

- Can browse: language list, word list, passage list, read passages
- Cannot: save to deck, study, mark as read, save settings
- Content endpoints are public (no auth required)
- User data endpoints return 401 → frontend shows "Sign in to start learning" prompt

## Key Design Decisions

### 1. Content in database, not in frontend bundle
**Why:** Multi-language support + frequent content additions. Deploying code to add a passage is not scalable.
**Impact:** Frontend `src/data/` directory is removed entirely. All content comes from API.

### 2. SRS computation on server
**Why:** Server is source of truth. No offline support. Prevents client-side tampering.
**Impact:** `srs-engine.ts` moves to `packages/shared`, imported only by the API's `cardService`. The current engine functions mutate card objects in-place — they must be refactored to return new card objects instead, so `cardService` can load from D1, compute, and write back cleanly.

### 3. Clerk for auth
**Why:** Handles registration, login, Google OAuth, token refresh, email verification — all without custom code. 10,000 MAU free.
**Impact:** Frontend adds Clerk SDK. Worker verifies JWT in middleware.

### 4. Internal integer user ID
**Why:** Clerk's string IDs are long. Integer FKs are smaller, faster, and decouple from auth provider.
**Impact:** `users` table maps `clerk_id → id`. All other tables FK to `users.id`.

### 5. ease stored as integer (x1000)
**Why:** Avoids floating point precision issues in SQLite. Anki uses the same pattern.
**Impact:** `cardService` converts on both paths: load from DB → divide by 1000 → pass to `srs-engine` → multiply result by 1000 → write to DB. The shared `srs-engine` always works with floats (2.5), never with the DB integer (2500).

### 6. review_log as append-only table
**Why:** Enables future analytics, algorithm tuning, study habit insights. Cheap to store.
**Impact:** Every rating inserts a log row. Never updated or deleted.

### 7. Theme stays in localStorage
**Why:** Pure UI preference. Syncing it would add latency and cause flash-of-wrong-theme on load.
**Impact:** `useTheme` composable keeps direct localStorage access. Not routed through API.

### 8. Word definitions: dual-language fields
**Why:** `definition_native` (e.g. Chinese translation) + `definition_target` (e.g. English definition) supports learners of any background studying any language.
**Impact:** Frontend displays whichever is appropriate based on user's native language setting.

### 9. Timestamps stored inline in passages table
**Why:** One-to-one with passages, always loaded together, small data. Separate table adds complexity for no benefit.
**Impact:** JSON column in `passages` table.

### 10. Anonymous users cannot save progress
**Why:** Simplifies architecture significantly — no local-to-server migration of SRS data needed. Anonymous users can only browse content.
**Impact:** No `LocalRepository` needed for SRS data. The `api/` module in web is a simple typed HTTP client, not a repository pattern.

## Frontend Data Layer (simplified)

Since anonymous users cannot save progress, the frontend data layer is simpler than the repository pattern discussed earlier:

```
stores/auth.ts          → Clerk state, isLoggedIn
stores/srs.ts           → fetches cards from API, caches in ref, all actions call API
stores/passages.ts      → fetches passage list from API, tracks read state
stores/wordList.ts      → fetches words from API with pagination/filters
stores/studySession.ts  → manages study queue from srs store data
stores/settings.ts      → fetches/saves settings via API
stores/language.ts      → current language, triggers reload of other stores on change

api/client.ts           → base fetch wrapper, attaches Clerk JWT
api/words.ts            → getWords(filters), getWord(id)
api/passages.ts         → getPassages(filters), getPassage(id)
api/cards.ts            → getCards(), addCard(), rateCard(), markKnown()
api/userWords.ts        → getUserWords(), createUserWord()
api/settings.ts         → getSettings(), saveSettings()
```

Each store:
1. Calls `api/` functions (which are just typed fetch wrappers)
2. Caches results in Vue refs
3. Exposes computed properties for the UI
4. Actions are async, call API, update cache

No repository pattern needed. No localStorage for user data. The API client is the only data access layer.

## Audio File Organization (R2)

```
audio/
  en/
    words/{word-id}.mp3         # word pronunciation
    passages/{passage-id}.mp3   # passage reading
  ja/
    words/{word-id}.mp3
    passages/{passage-id}.mp3
```

Audio URLs are stored in the `words.audio_url` and `passages.audio_url` columns. The frontend uses these URLs directly (R2 public bucket or signed URLs).

## Implementation Phases

### Phase 1: Monorepo + Shared Package
Set up workspace structure. Move types and SRS engine to shared package. Verify everything compiles.

### Phase 2: API — Database + Content Routes
Create D1 schema. Write content query functions. Implement public content endpoints (languages, words, passages). Test locally with wrangler dev.

### Phase 3: API — Auth + User Routes
Add Clerk middleware. Implement all user data endpoints (cards, user-words, history, settings). Test with real Clerk JWT.

### Phase 4: Frontend — API Client + Auth
Install Clerk Vue SDK. Write typed API client. Create auth store with login/logout.

### Phase 5: Frontend — Rewrite Stores
Replace all localStorage-based stores with API-backed stores. Remove `src/data/` static files. Remove `src/lib/storage.ts`, `srs-storage.ts`, `user-words.ts`.

### Phase 6: Frontend — Update Views
Update views to use new stores. Add language selector. Add auth UI. Ensure anonymous browsing works.

### Phase 7: Content Migration
Write a script to import existing b2.json words and passages into D1. Specifically:
- Import words from `b2.json` into the `words` table
- Import passages from `passages-*.ts` into the `passages` table
- Populate `passage_words` from each passage's `wordIds` array
- For each passage with a `passage-{id}.timestamps.json` on R2, fetch and insert the JSON into `passages.timestamps`
- Upload any missing audio files to R2

### Phase 8: Deploy
Configure Cloudflare Pages + Workers. Apply D1 migrations. Set secrets. Smoke test.

## Known Limitations (to address later)

### Startup card loading
`GET /api/cards` loads all cards at once. Fine for hundreds of cards, but at thousands of cards per user consider adding `GET /api/cards/due` (only today's due cards + word data) and paginating the full list.

### Per-card rating requests
Each card rating fires a separate POST. For a 50-card session that's 50 requests. A future `POST /api/cards/rate-batch` endpoint accepting an array of ratings would reduce round-trips and improve reliability on slow connections.

### Content deletion policy
`srs_cards.word_id` uses `ON DELETE RESTRICT` — you cannot delete a word from the `words` table if any user has it in their deck. This is intentional (prevents data loss) but means content cleanup requires a migration strategy. `passages_read` and `passage_words` use `ON DELETE CASCADE` — deleting a passage cleans up automatically.

### srs_history.learned semantics
`learned` is incremented when a word is added to the user's deck (via `POST /api/cards/add`), not when it is first reviewed correctly. This matches the current frontend behavior.

### User word + SRS card atomicity
`POST /api/user-words` must create both the `user_words` row and the `srs_cards` row in a single D1 transaction (`db.batch()`). If either fails, both roll back.
