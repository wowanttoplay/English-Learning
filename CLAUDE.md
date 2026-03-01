# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static, no-build vocabulary learning web app implementing Anki-style spaced repetition (SM-2 algorithm) for the Oxford 5000 word list. No framework, no bundler — just open `index.html` in a browser.

## Development

There is no build step, test suite, or linter. To run the app, open `index.html` in a browser. To validate JavaScript syntax quickly:

```bash
node -e "new Function(require('fs').readFileSync('js/srs.js','utf8'))"
```

To test SRS logic in Node, you must provide a `localStorage` mock and set `global.WORD_LIST` before loading `srs.js`.

## Architecture

Four IIFE modules loaded in dependency order via `<script>` tags:

1. **`js/words.js`** — Exports `WORD_LIST` (global const). Array of ~200 B2-level word objects with `id`, `word`, `pos`, `phonetic`, `zh` (Chinese), `en` (English definition), `examples`, and `level`.

2. **`js/srs.js`** — Exports `SRS` (global). SM-2 spaced repetition engine. Card states: `new` → `learning` → `review` (or `relearning` on lapse). Ratings: Again(1), Hard(2), Good(3), Easy(4). Learning steps: 1min → 10min → graduate to 1-day review interval. All state persisted in `localStorage['srs_data']`.

3. **`js/dict-api.js`** — Exports `DictAPI` (global). Fetches extra definitions from `dictionaryapi.dev`, caches in `localStorage['dict_cache']`. Purely supplementary; the app works fine without it.

4. **`js/app.js`** — Exports `App` (global). Renders all UI by setting `innerHTML` on `#app`. Manages five screens: `dashboard`, `card` (flashcard study), `complete` (session summary), `wordlist` (browse/search/filter), `settings`. Uses `onclick` attributes in rendered HTML to call `App.*` methods.

### Data flow

`App` calls `SRS.getCardsForToday()` to build a session queue → user rates cards via `SRS.rateCard(wordId, rating)` → SRS updates intervals/ease/due dates in localStorage → `App` re-renders.

### Key conventions

- **Module pattern**: Each file is an IIFE returning a public API object (`const SRS = (() => { ... return { ... }; })()`)
- **No DOM framework**: UI rendered as HTML strings via template literals; events bound via inline `onclick`
- **Date handling**: Uses local `formatDate(d)` helper (not `toISOString`) to avoid timezone bugs
- **Theming**: CSS custom properties in `:root` / `[data-theme="dark"]`; theme stored in `localStorage['theme']`
- **Audio**: Browser Web Speech API (`speechSynthesis`) for pronunciation — no external audio files

## Word list format

When adding words to `js/words.js`, each entry must follow this structure:
```js
{ id: 201, word: "influence", pos: "noun", phonetic: "/ˈɪnfluəns/",
  zh: "影响；势力", en: "the effect that somebody/something has on the way a person thinks or behaves",
  examples: ["She has a lot of influence over her students.", "..."], level: "B2" }
```
IDs must be sequential. The SRS engine references words by `id` and iterates `WORD_LIST` in order to determine which new cards to introduce.
