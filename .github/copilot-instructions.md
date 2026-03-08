# Copilot Instructions for This Repository

## Build, typecheck, and test commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Type-check: `npm run typecheck`
- Production build: `npm run build`
- No package test script is configured; ad-hoc smoke script: `npx tsx test.ts` (currently references missing `src/lib/srs.js`, so fix that import before relying on it)

## High-level architecture

- This is a Vue 3 + TypeScript + Pinia SPA built with Vite and `createWebHashHistory` routing (`src/router/index.ts`) for static hosting compatibility.
- App bootstrap in `src/main.ts` initializes two global runtime indexes before mount: `WordIndex.build(WORD_LIST)` for O(1) word/topic lookups and `AudioPlayer.init()` for speech voice selection.
- Core flow is:
  1. `useSrsStore.getCardsForToday()` (store wrapper over `lib/srs-queue.ts`) computes due/new queue data from localStorage-backed SRS state.
  2. `useSessionStore` owns in-session queue/index/reveal/modal UI state.
  3. `StudyView` + `useStudySession` render current cards, preload next audio, and fetch dictionary definitions on reveal.
  4. Ratings call `useSrsStore.rateCard()` → `lib/srs-queue.ts`/`lib/srs-engine.ts` update SM-2 scheduling and persist via `lib/srs-storage.ts`.
- Data is mostly static content plus persisted user progress:
  - Word/passage/topic data from `src/data/*`
  - SRS progress, dictionary cache, theme, audio settings, and passage read state in `localStorage` through the typed `Storage` wrapper (`src/lib/storage.ts`).

## Key repository conventions

- Keep dependency direction one-way: `data -> lib -> stores -> composables -> components -> views`; avoid reverse imports.
- Do not access `localStorage` directly from UI/store code; use `src/lib/storage.ts` domain methods.
- Preserve the `_version` bump pattern in `src/stores/srs.ts` to force recomputation after SRS mutations.
- Use `formatDate()` from `src/lib/srs-engine.ts` date helpers (local date strings) instead of `toISOString()` to avoid timezone drift in due-date logic.
- Topic filtering only applies to **new** cards; due review/learning cards are always included (`getCardsForToday` behavior).
- When adding word batches, update `src/data/words.ts` aggregation and preserve dedup-by-word semantics (earlier batch wins).
- Keep startup initialization in `main.ts` (`WordIndex.build`, `AudioPlayer.init`) before mounting the app.
