# Oxford 5000 Vocabulary Learning App - Product Specification

Version: 1.0
Date: 2026-03-01
Status: Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vocabulary Data Strategy](#2-vocabulary-data-strategy)
3. [Pronunciation System](#3-pronunciation-system)
4. [Example Sentence Design Principles](#4-example-sentence-design-principles)
5. [Contextual Short Passage Feature](#5-contextual-short-passage-feature)
6. [Review Strategy Enhancements](#6-review-strategy-enhancements)
7. [User Experience Optimization](#7-user-experience-optimization)
8. [Technical Architecture](#8-technical-architecture)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Executive Summary

This specification defines the product direction for an Oxford 5000 vocabulary learning application. The app uses a static architecture (HTML/CSS/JS, no backend) with localStorage persistence. The design philosophy prioritizes evidence-based learning methods: spaced repetition, comprehensible input (Krashen's i+1), contextual learning, and active recall.

### Current State

- 495 B2-level words with Chinese/English definitions, phonetics, and 2 example sentences each
- SM-2 spaced repetition algorithm (learning steps: 1min, 10min, then graduate to review)
- Web Speech API TTS (en-US)
- dictionaryapi.dev integration for supplementary definitions
- 5 screens: Dashboard, Flashcard, Complete, WordList, Settings
- Pure frontend, all data in localStorage

### Target State

- Full Oxford 5000 word list (B1 + B2 + C1), organized by CEFR level and thematic groups
- Enhanced pronunciation with fallback audio sources and speed control
- Contextual short passages that combine recently learned words
- Augmented review strategies (active recall variations, reverse cards, listening drills)
- Gamification layer (streaks, milestones, progress visualization)

---

## 2. Vocabulary Data Strategy

### 2.1 Oxford 5000 Word List Organization

The Oxford 5000 consists of approximately 5,000 words distributed across CEFR levels:

| Level | Approximate Count | Description |
|-------|-------------------|-------------|
| A1    | ~500              | Beginner essentials |
| A2    | ~700              | Elementary |
| B1    | ~900              | Intermediate |
| B2    | ~1,500            | Upper-intermediate (current focus) |
| C1    | ~1,400            | Advanced |

**Decision**: Focus on B2 and C1 words first (approximately 2,900 words), since A1-B1 words are assumed known by the target audience (Chinese learners preparing for IELTS/TOEFL or professional English use). Maintain the current B2-first approach and add C1 after B2 is complete.

### 2.2 Batch Size and File Organization

**Problem**: A single `words.js` file with 5,000 entries would exceed 600KB and be difficult to maintain.

**Solution**: Split word data across multiple files, loaded by level:

```
js/words.js          -- Main file: exports WORD_LIST, loads level files
js/words_b2_001.js   -- IDs 1-200 (B2 words, batch 1)
js/words_b2_002.js   -- IDs 201-400
js/words_b2_003.js   -- IDs 401-600
...
js/words_c1_001.js   -- C1 words, batch 1
...
```

**Implementation**:

- `words.js` defines `const WORD_LIST = []` and each batch file pushes entries via `WORD_LIST.push(...)`.
- All batch `<script>` tags are added to `index.html` in order, before `srs.js`.
- Each batch file is approximately 200 words (~25KB), keeping individual files manageable.
- IDs are globally sequential across all batches: B2 words get IDs 1-1500, C1 words get 1501-2900.

### 2.3 Word Entry Format

Each word entry must follow this structure (unchanged from current format):

```js
{
  id: 201,
  word: "influence",
  pos: "noun",           // primary part of speech
  phonetic: "/ˈɪnfluəns/", // IPA, American English
  zh: "影响；势力",        // concise Chinese definition (semicolon-separated for multiple meanings)
  en: "the effect that somebody/something has on the way a person thinks or behaves",
  examples: [
    "She has a lot of influence over her students.",
    "The media can have a powerful influence on public opinion."
  ],
  level: "B2"            // CEFR level
}
```

**Constraints on word entries**:

- `id`: Sequential integer, never reused. Determines the order SRS introduces new cards.
- `pos`: One of: noun, verb, adjective, adverb, conjunction, preposition, pronoun, determiner, exclamation, number, modal verb. For words with multiple POS, use the most common one.
- `phonetic`: American English IPA pronunciation. Use the format `/.../ `.
- `zh`: Chinese translation, max 20 characters. Use semicolons to separate multiple meanings. Prioritize the most common meaning in academic/professional contexts.
- `en`: Oxford-style English definition. One sentence, max 150 characters.
- `examples`: Exactly 2 example sentences. See Section 4 for design principles.
- `level`: "B1", "B2", or "C1".

### 2.4 Thematic Tagging (Future Enhancement)

Add an optional `tags` field for thematic grouping:

```js
{ ..., tags: ["business", "academic"] }
```

This enables future features like "Study business vocabulary" or "Focus on academic words." Not required for initial implementation.

---

## 3. Pronunciation System

### 3.1 Current State

The app currently uses the Web Speech API (`window.speechSynthesis`) with `lang: 'en-US'` and `rate: 0.9`. Quality varies significantly across browsers and operating systems:

- macOS Safari/Chrome: Good quality (Samantha or Alex voice)
- iOS Safari: Good quality
- Android Chrome: Acceptable quality, varies by device
- Windows Chrome: Variable, often robotic

### 3.2 Recommended Approach: Layered Audio Strategy

Use a 3-tier fallback approach, all implemented client-side:

**Tier 1: dictionaryapi.dev Audio Files (Preferred)**

The existing `DictAPI` integration already fetches phonetic data that includes audio URLs. These are real human recordings hosted by dictionaryapi.dev.

```js
// Already available from DictAPI cache:
{
  phonetics: [
    { text: "/ˈɪnfluəns/", audio: "https://api.dictionaryapi.dev/media/pronunciations/en/influence-us.mp3" }
  ]
}
```

**Implementation**:
- When displaying a word, check `DictAPI.getCached(word)` for an audio URL.
- If found, play it via `new Audio(url)`.
- Pre-fetch audio for upcoming words in the session queue.
- Cache audio URLs alongside dictionary data (already happening).

**Tier 2: Web Speech API (Fallback)**

Keep the current `speechSynthesis` implementation as fallback when no audio URL is available. Enhancements:

- Prefer voices matching "en-US" locale. On load, enumerate voices and select the best American English voice.
- Set `rate: 0.85` for slightly slower, clearer pronunciation.
- Add a "slow pronunciation" button: plays the word at `rate: 0.6` for difficult phonetics.

**Tier 3: No Audio (Graceful Degradation)**

If both Tier 1 and Tier 2 fail (e.g., no network and no speechSynthesis support), show the IPA phonetic transcription prominently and indicate audio is unavailable.

### 3.3 Pronunciation Speed Control

Add a speed toggle to the audio button:

- **Normal speed**: Single tap/click plays at normal rate.
- **Slow speed**: Long press or double-tap plays at 0.6x rate.
- Visual indicator: the play button shows a turtle icon for slow mode.

### 3.4 Auto-Play Behavior

- When a new flashcard appears (front side), auto-play pronunciation once at normal speed.
- Can be disabled in Settings ("Auto-play pronunciation: on/off").
- When the card is revealed (back side), do NOT auto-play (user has already heard it).

### 3.5 Sentence Audio

For example sentences on the back of cards:

- Use Web Speech API only (Tier 2). Full sentence audio from dictionaryapi.dev is not available.
- Add a small play button next to each example sentence.
- Rate: 0.85 for sentence reading (slightly slower for comprehension).

---

## 4. Example Sentence Design Principles

### 4.1 Core Principles

Each word has exactly 2 example sentences. These are the primary context through which users encounter the word, so quality matters significantly.

**Principle 1: Comprehensible Input (i+1)**

Sentences should be 95% comprehensible to the target audience (B2 learners). Use mostly A2-B1 vocabulary in sentences, with only the target word at the B2/C1 level. Avoid using other advanced vocabulary in example sentences.

Good: "She has a lot of **influence** over her students."
Bad: "Her **influence** was tantamount to a paradigm shift in the constituency."

**Principle 2: Natural, Authentic Context**

Sentences should reflect how native speakers actually use the word. Avoid textbook-style sentences or contrived contexts.

Good: "The media can have a powerful **influence** on public opinion."
Bad: "The influence is very big and important."

**Principle 3: Different Usage Patterns**

The two sentences should demonstrate different usage patterns, collocations, or contexts:

- Sentence 1: Most common usage/collocation
- Sentence 2: Different context, different grammatical pattern, or different shade of meaning

Example for "abandon" (verb):
1. "The crew abandoned the sinking ship." (physical leaving)
2. "She abandoned her plans to go abroad." (giving up an idea)

**Principle 4: Moderate Length**

- Target: 8-15 words per sentence.
- Minimum: 6 words (shorter sentences lack context).
- Maximum: 20 words (longer sentences become hard to parse on mobile).

**Principle 5: Cultural Accessibility**

Avoid examples that require specific cultural knowledge (American sports references, British slang, etc.). Use universally understandable contexts: work, study, daily life, technology, nature, travel.

### 4.2 Sentence Quality Checklist

When creating or reviewing example sentences, verify:

- [ ] Target word is used naturally (not forced into the sentence)
- [ ] Other vocabulary is at A2-B1 level
- [ ] Sentence is between 8-15 words
- [ ] The two sentences show different usages/contexts
- [ ] No cultural references that require background knowledge
- [ ] Grammar is correct and natural
- [ ] The sentence helps clarify the word's meaning without the definition

---

## 5. Contextual Short Passage Feature

### 5.1 Purpose

Short passages (micro-stories) combine multiple recently learned words into coherent, natural text. This implements comprehensible input theory: learners encounter familiar vocabulary in new contexts, reinforcing retention and building reading fluency.

### 5.2 Design Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Length | 80-120 words | Short enough for a single screen, long enough for meaningful context |
| Target words per passage | 5-8 | Enough reinforcement without feeling contrived |
| Vocabulary level | 90% known words, 10% target words | Krashen's i+1 theory |
| Readability | B1-B2 grammar | Accessible to target audience |
| Topics | Daily life, work, travel, technology, nature | Universally relatable |

### 5.3 Passage Generation Strategy

Since the app has no backend, passages must be pre-generated and bundled as static data.

**Option A: Pre-authored Passages (Recommended)**

Create a library of short passages, each tagged with the word IDs it contains. Store in a new file:

```
js/passages.js
```

Format:

```js
const PASSAGES = [
  {
    id: 1,
    title: "A Change of Plans",
    text: "Sarah had always wanted to study abroad, but she had to abandon her plans when...",
    wordIds: [1, 45, 67, 89, 102, 156],  // words used in this passage
    level: "B2",
    topic: "daily_life"
  },
  ...
];
```

**Selection Logic** (in `srs.js` or `app.js`):

```
1. Get all words the user has seen (state != 'unseen')
2. For each passage, count how many of its wordIds the user has seen
3. A passage is "ready" when >= 80% of its wordIds have been seen
4. Sort ready passages by: most recently learned words first
5. Exclude passages the user has already read (track in localStorage)
6. Present the top passage
```

**Option B: Template-based Generation (Simpler, Less Natural)**

Create sentence templates with slots, fill slots with learned words. This produces less natural text and is not recommended as the primary approach, but could supplement the passage library.

### 5.4 Passage UI

**Entry Point**: New "Read" tab in the bottom navigation (4th tab, between Words and Settings).

**Reading Screen**:

```
+----------------------------------+
| < Back           Reading         |
+----------------------------------+
| A Change of Plans                |
|                                  |
| Sarah had always wanted to study |
| abroad, but she had to [abandon] |
| her plans when her company       |
| offered her a [significant]      |
| promotion. The [influence] of    |
| her mentor helped her see that   |
| ...                              |
|                                  |
| [Target words highlighted in     |
|  accent color, tappable to show  |
|  definition tooltip]             |
|                                  |
+----------------------------------+
| [Mark as Read]  [Play Audio]     |
+----------------------------------+
```

**Interaction**:

- Target words (words the user is learning) are highlighted in the accent color.
- Tapping a highlighted word shows a tooltip with: Chinese definition, English definition, and a play-pronunciation button.
- "Play Audio" reads the entire passage aloud via Web Speech API.
- "Mark as Read" saves the passage as completed, and the user returns to the passage list.

### 5.5 Passage Volume

Target: approximately 1 passage per 10 words. For 2,900 words, we need approximately 290 passages. These can be authored in batches alongside the word data:

- Phase 1 (words 1-500): 50 passages
- Phase 2 (words 501-1000): 50 passages
- Phase 3 (words 1001-1500): 50 passages
- Ongoing: 50 passages per 500 words added

### 5.6 Passage Data File Organization

```
js/passages_001.js  -- Passages 1-50 (covering words 1-500)
js/passages_002.js  -- Passages 51-100
...
```

Each file appends to a global `PASSAGES` array, same pattern as word batches.

---

## 6. Review Strategy Enhancements

### 6.1 Current SM-2 Implementation (Retain)

The existing SM-2 implementation is solid and should be retained as the core scheduling algorithm. Key parameters:

- Learning steps: 1min, 10min
- Graduating interval: 1 day
- Easy interval: 4 days
- Default ease: 2.5
- Minimum ease: 1.3
- New cards per day: 20 (configurable)
- Mastered threshold: 21-day interval

No changes to the core scheduling algorithm in this version.

### 6.2 Card Type Variations

Currently, only one card type exists: see the word, recall the meaning. Add these additional review modes:

**Mode 1: Word -> Meaning (Current, Default)**

Front: word + phonetic + POS
Back: Chinese definition + English definition + examples

**Mode 2: Meaning -> Word (Reverse Card)**

Front: Chinese definition + English definition
Back: word + phonetic + pronunciation
Purpose: Tests productive recall (can you produce the word from the meaning?).

**Mode 3: Listening -> Meaning (Listening Drill)**

Front: Audio plays automatically (no text shown). User must recognize the word by sound.
Back: word + Chinese definition + English definition
Purpose: Tests listening comprehension and phonetic recognition.

**Mode 4: Fill-in-the-Blank (Contextual Recall)**

Front: An example sentence with the target word replaced by a blank. Chinese definition shown as a hint.
Back: The complete sentence with the word highlighted.
Purpose: Tests contextual usage and productive recall.

**Implementation**: Add a `cardMode` field to the session configuration. The mode is selected for each card in a session:

```js
// In SRS or App:
function selectCardMode(card) {
  // New cards and learning cards: always Mode 1 (standard)
  if (card.state === 'new' || card.state === 'learning') return 'standard';

  // Review cards: vary the mode based on reps
  // After 3+ successful reviews, start mixing in other modes
  if (card.reps < 3) return 'standard';

  // Weighted random: 50% standard, 20% reverse, 15% listening, 15% fill-blank
  const r = Math.random();
  if (r < 0.50) return 'standard';
  if (r < 0.70) return 'reverse';
  if (r < 0.85) return 'listening';
  return 'fill_blank';
}
```

Users can also configure which modes are enabled in Settings.

### 6.3 Session Types

Enhance the existing session types:

| Type | Description | Card Source |
|------|-------------|-------------|
| Mixed | All due cards | Learning + Review + New (current behavior) |
| Review Only | Due reviews only | Review + Relearning cards (current behavior) |
| Learn New | New cards only | New cards (current behavior) |
| **Quick Review** | 10-minute burst | Top 15 most overdue cards |
| **Weak Words** | Focus on lapsed cards | Cards with lapses >= 2, sorted by lapse count |
| **Listening Drill** | Audio-only session | All due cards in Listening mode |

### 6.4 Leech Detection

Words that repeatedly lapse (rated "Again" many times) are "leeches" -- the SM-2 algorithm keeps scheduling them but the user isn't retaining them.

**Detection**: A card is a leech if `lapses >= 4`.

**Response**:
- Show a "leech" badge on the word in the word list.
- When a leech card appears in a session, show a special notice: "This word is tricky! Try associating it with a mental image or mnemonic."
- In the word detail modal, suggest the user add a personal note or mnemonic (stored in `localStorage['user_notes']`).

### 6.5 User Notes / Mnemonics

Allow users to add a personal note or mnemonic to any word:

- Text input field in the word detail modal
- Stored in `localStorage['user_notes']` as `{ [wordId]: "note text" }`
- Displayed on the back of flashcards when present
- Especially prompted for leech words

---

## 7. User Experience Optimization

### 7.1 Progress Visualization

**7.1.1 Dashboard Enhancements**

Replace the current simple progress bar with a multi-segment visualization:

```
Progress: 495 / 2900 words
[====B2 Unseen=====|=Learning=|=Young=|Mastered]
 ^^^^^^^^^^^^^^^^   ^^^^^^^^   ^^^^^^  ^^^^^^^
 gray               orange     green   purple
```

Show counts below: "305 Unseen | 45 Learning | 120 Young | 25 Mastered"

**7.1.2 Weekly Heatmap**

Show a 7-day activity heatmap on the dashboard (like GitHub contribution graph, but horizontal):

```
Mon  [##]  15 reviews
Tue  [###] 23 reviews
Wed  [#]   8 reviews
Thu  [ ]   0 reviews
Fri  [##]  12 reviews
Sat  [####] 31 reviews
Sun  [##]  18 reviews
```

Data source: `SRS.getStats()` already tracks daily history.

**7.1.3 Level Progress**

Show B2 and C1 progress separately:

```
B2 Progress: 495/1500 (33%)
[===========                              ]

C1 Progress: 0/1400 (0%)
[                                          ]
```

### 7.2 Motivation Mechanics

**7.2.1 Streak System (Existing, Enhance)**

The current streak counter is functional. Enhancements:

- Show the streak prominently on the dashboard with a flame icon.
- Add a "streak freeze" feature: if the user misses one day, they can use a streak freeze (earned by completing 7 consecutive days) to preserve their streak.
- Store freeze count in `localStorage['streak_freezes']`.

**7.2.2 Milestone Celebrations**

Trigger a brief celebration animation when the user reaches milestones:

| Milestone | Message |
|-----------|---------|
| First word learned | "You're on your way!" |
| 50 words | "50 words mastered!" |
| 100 words | "Triple digits!" |
| 7-day streak | "One week streak!" |
| 500 words | "Halfway through B2!" |
| 1000 words | "B2 complete!" |
| 30-day streak | "Monthly warrior!" |

Implementation: Check milestones after each session completes. Show a modal with the milestone message and a confetti animation (CSS-only, no library needed).

**7.2.3 Daily Goal**

Add a configurable daily goal (default: 20 reviews + 10 new words):

- Show progress toward the daily goal on the dashboard as a circular progress indicator.
- When the goal is met, show a "Goal Complete" badge for the day.
- Stored in `localStorage['daily_goal']`.

### 7.3 Learning Path

**7.3.1 Level Unlock System**

Present learning as a journey through levels:

- Start with B2 words (most relevant for intermediate learners).
- After 80% of B2 words reach "review" or "mastered" state, unlock C1 words.
- Visual: a path/roadmap on the dashboard showing B2 -> C1 progression.

**7.3.2 Word Groups Within Levels**

Within each CEFR level, organize words into groups of 50 ("Units"):

```
B2 Unit 1: Words 1-50    [Complete]
B2 Unit 2: Words 51-100  [In Progress: 35/50]
B2 Unit 3: Words 101-150 [Locked]
...
```

Units unlock sequentially. The user must start at least 40 words in a unit before the next unit unlocks. This prevents overwhelm and gives a sense of progression.

Note: The SRS engine still controls when new cards appear (20/day). The unit system is purely a visual/motivational overlay, not a gating mechanism for the SRS.

### 7.4 Settings Enhancements

Add these settings:

| Setting | Default | Options |
|---------|---------|---------|
| New cards per day | 20 | 5-50 slider |
| Auto-play pronunciation | On | On/Off |
| Card modes enabled | Standard only | Checkboxes for each mode |
| Daily goal | 30 total reviews | 10-100 slider |
| Show Chinese first | Off | On/Off (for reverse cards) |
| Session size limit | Unlimited | 10/20/30/50/Unlimited |

### 7.5 Keyboard Shortcuts

Current shortcuts (1-4 for ratings, Space/Enter for reveal/Good) are good. Add:

| Key | Action | Screen |
|-----|--------|--------|
| 1-4 | Rate card | Flashcard |
| Space/Enter | Reveal / Rate Good | Flashcard |
| P | Play pronunciation | Flashcard |
| Esc | Back to dashboard | Flashcard |
| N | Start new session | Dashboard |
| Left/Right Arrow | Previous/Next in word list | Word List |

---

## 8. Technical Architecture

### 8.1 Module Structure (Updated)

```
index.html
style.css
js/
  words.js              -- WORD_LIST definition + auto-loads batch files
  words_b2_001.js       -- B2 words 1-200
  words_b2_002.js       -- B2 words 201-400
  ...
  words_c1_001.js       -- C1 words 1501-1700
  ...
  passages.js           -- PASSAGES definition
  passages_001.js       -- Passages 1-50
  ...
  srs.js                -- SM-2 engine (core, unchanged algorithm)
  audio.js              -- NEW: Audio playback (Tier 1/2/3 fallback)
  dict-api.js           -- Dictionary API (unchanged)
  app.js                -- UI rendering and events
docs/
  product-spec.md       -- This document
```

### 8.2 New Module: audio.js

Encapsulates all pronunciation logic:

```js
const Audio = (() => {
  // Public API:
  return {
    playWord(word, speed),    // Play word pronunciation (Tier 1 > 2 > 3)
    playSentence(text, speed), // Play sentence via TTS
    preload(word),             // Pre-fetch audio for a word
    isAvailable(),             // Check if any audio method works
    setAutoPlay(enabled),      // Toggle auto-play
    getPreferredVoice()        // Get best en-US voice
  };
})();
```

### 8.3 localStorage Keys

| Key | Content | Owner |
|-----|---------|-------|
| `srs_data` | Card states, history, settings | srs.js |
| `dict_cache` | Dictionary API response cache | dict-api.js |
| `theme` | "light" or "dark" | app.js |
| `user_notes` | `{ [wordId]: "note text" }` | app.js (new) |
| `passages_read` | `[passageId, ...]` | app.js (new) |
| `streak_freezes` | `{ count: N, lastEarned: "date" }` | srs.js (new) |
| `daily_goal` | `{ target: N }` | app.js (new) |
| `settings_audio` | `{ autoPlay: bool, preferredSpeed: num }` | audio.js (new) |
| `milestones` | `{ [milestone]: true }` | app.js (new) |

### 8.4 Data Size Considerations

localStorage limit is typically 5-10MB. Estimates:

- `srs_data` with 5,000 cards: approximately 500KB
- `dict_cache` with 5,000 entries: approximately 2MB
- Other keys: approximately 50KB total

Total: approximately 2.5MB, well within limits. If `dict_cache` grows too large, implement LRU eviction (keep most recently accessed 2,000 entries).

---

## 9. Implementation Phases

### Phase 1: Data Expansion (Priority: High)

**Goal**: Expand from 495 to 1,500 B2 words.

Tasks:
1. Refactor `words.js` into batch files (words_b2_001.js, words_b2_002.js, etc.)
2. Add words 496-1000 (5 batch files of 100 words each)
3. Add words 1001-1500 (5 batch files of 100 words each)
4. Update `index.html` to load all batch files
5. Validate all entries follow the format spec

### Phase 2: Audio Enhancement (Priority: High)

**Goal**: Implement the layered audio strategy.

Tasks:
1. Create `audio.js` module
2. Extract audio URLs from DictAPI cache for Tier 1
3. Improve Web Speech API voice selection for Tier 2
4. Add speed control (normal/slow)
5. Add auto-play setting
6. Add sentence audio playback buttons

### Phase 3: Review Strategy (Priority: Medium)

**Goal**: Add card type variations and session types.

Tasks:
1. Implement reverse card mode (Meaning -> Word)
2. Implement listening drill mode
3. Implement fill-in-the-blank mode
4. Add card mode selection logic
5. Add "Quick Review" and "Weak Words" session types
6. Implement leech detection and user notes

### Phase 4: Contextual Passages (Priority: Medium)

**Goal**: Launch the short passage reading feature.

Tasks:
1. Author 50 passages for words 1-500
2. Create `passages.js` data format and loader
3. Build passage selection logic
4. Build reading screen UI
5. Add "Read" tab to navigation

### Phase 5: UX Polish (Priority: Medium)

**Goal**: Gamification and progress enhancements.

Tasks:
1. Redesign dashboard with multi-segment progress bar
2. Add weekly heatmap
3. Implement milestone celebrations
4. Add daily goal feature
5. Enhance streak system with streak freezes
6. Add new settings options
7. Add word detail modal note/mnemonic input

### Phase 6: C1 Words (Priority: Low)

**Goal**: Expand to full Oxford 5000.

Tasks:
1. Add C1 words 1501-2900 (14 batch files)
2. Author 140 additional passages
3. Implement level unlock system (B2 -> C1)
4. Add level-specific progress tracking

---

## Appendix A: Word Data Generation Guidelines

When generating word entries (manually or with AI assistance), follow this checklist:

1. Look up the word in the Oxford Learner's Dictionary for the canonical definition, POS, and CEFR level.
2. Use American English IPA for phonetics.
3. Write the Chinese translation (`zh`) concisely. Focus on the most common meaning.
4. Write the English definition (`en`) in the Oxford style: start with "to" for verbs, use "the quality of being..." for abstract nouns, etc.
5. Write 2 example sentences following Section 4 principles.
6. Verify: Is the sentence natural? Would a native speaker actually say this? Are other words in the sentence at A2-B1 level?

## Appendix B: Passage Authoring Guidelines

When writing contextual passages:

1. Select 5-8 target words that share a plausible thematic connection.
2. Write an 80-120 word passage that uses each target word naturally.
3. Ensure 90%+ of non-target vocabulary is at A2-B1 level.
4. Use B1-B2 grammar (simple and compound sentences preferred; avoid complex subordinate clauses).
5. Make the passage tell a mini-story or describe a coherent scenario.
6. Avoid: cultural references requiring background knowledge, controversial topics, humor that doesn't translate.
7. Each passage needs: id (sequential), title (short, descriptive), text, wordIds (array of word IDs used), level ("B2" or "C1"), topic (one of: daily_life, work, travel, technology, nature, health, education, social).

## Appendix C: References

- Krashen, S. (1982). Principles and Practice in Second Language Acquisition. Pergamon Press.
- Pimsleur, P. (1967). A Memory Schedule. Modern Language Journal, 51(2).
- Wozniak, P. (1990). SuperMemo algorithm SM-2. Retrieved from supermemo.com.
- Oxford Learner's Dictionaries. Oxford 3000 and 5000 word lists. https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000
- Ye, J. (2023). FSRS: A Modern Spaced Repetition Algorithm. https://github.com/open-spaced-repetition/fsrs4anki
