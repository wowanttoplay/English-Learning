# Dialogue Content Strategy Design

## Problem

Current dialogues contain too many new B2 words per passage (11-26), causing learner stress. The system lacks lower-level vocabulary (A2/B1), making it impossible to construct natural dialogues with gradual difficulty progression.

## Solution: Spiral Progression Strategy

Based on Krashen's i+1 theory, Nation (2001), and Ebbinghaus spaced repetition research: each passage introduces only 3-5 new words and revisits 2-4 recently learned words, creating a spiral of introduction → reinforcement.

---

## 1. Vocabulary System Expansion

### Word ID Segmentation

All levels use consistent 10000-block ranges. B2 words are renumbered from 1-563 to 40001-40563.

| Level | ID Range | Capacity |
|-------|----------|----------|
| A1    | 10001-19999 | 9999 |
| A2    | 20001-29999 | 9999 |
| B1    | 30001-39999 | 9999 |
| B2    | 40001-49999 | 9999 |
| C1    | 50001-59999 | 9999 |
| C2    | 60001-69999 | 9999 |
| User  | 100001+ | existing convention |

### Passage ID Segmentation (separate namespace from words)

Word IDs and passage IDs live in separate database tables (`words` vs `passages`). Passage IDs use a distinct range ordered by CEFR progression:

| Level | ID Range |
|-------|----------|
| A1    | 1001-1999 |
| A2    | 2001-2999 |
| B1    | 3001-3999 |
| B2    | 4001-4999 |
| C1    | 5001-5999 |
| C2    | 6001-6999 |

Old passage IDs (1-12, 101-125) are retired. Both word and passage ID ranges are per-language — different languages use the same ranges independently (disambiguated by `language_id` in the DB).

### B2 Renumbering

B2 words are renumbered from 1-563 to 40001-40563. This is a one-time mechanical change affecting:
- `packages/api/scripts/data/words/b2.json` — word IDs
- `packages/api/scripts/data/translations/en/b2.json` — translation references
- `packages/api/scripts/data/translations/zh-CN/b2.json` — translation references
- Old passage files (being deleted anyway)

A one-off script handles the renumbering before any other changes.

### Data Structure: Core vs Translation Separation

The existing architecture separates translations from core word data. English definitions (`en`) and all other language translations live in `translations/` directories, NOT in core word data. This spec maintains that convention for all levels.

**Core word data** (required, language-independent):
```json
{
  "id": 30001,
  "word": "convince",
  "pos": "verb",
  "phonetic": "/kənˈvɪns/",
  "examples": ["She convinced me to try the new restaurant.", "The data convinced the team to change direction."],
  "level": "B1",
  "topics": ["communication"]
}
```

**Translation data** (per-language, including English definitions):
```
packages/api/scripts/data/translations/
  en/b1.json       # English definitions (required for English learning)
  zh-CN/b1.json    # Chinese translations
  ja/b1.json       # Japanese (future)
  ko/b1.json       # Korean (future)
```

Each translation file contains `{ id, <lang_field> }` mappings, following existing B2 convention.

### Word Files

```
packages/api/scripts/data/words/
  a2.json    # new
  b1.json    # new
  b2.json    # existing (IDs renumbered to 40001+)
```

One JSON file per level. At ~1500 words per level (~300KB), this is well within editor and toolchain limits. Do not split by topic.

### Word Generation Rules

- Each entry: id, word, pos, phonetic, examples, level, topics
- `examples`: exactly 2 sentences, 8-15 words each
- Example context vocabulary ≤ current word's level (A2 word examples use A1-A2 words, B1 examples use A2-B1 words)
- `topics`: 1-3 subtopic IDs from existing 16-subtopic hierarchy
- No duplicate entries within same level
- English definitions and other translations generated as separate files in `translations/`

### Translation Validation

`validate-data.ts` must enforce:
- Every word ID in `words/{level}.json` must have a corresponding entry in `translations/en/{level}.json` (English definitions are required)
- Translation entries in other locales are optional, but if present, the `wordId` must exist in the corresponding word file

---

## 2. Dialogue Content Rules (Spiral Progression)

### Core Parameters

| Rule | Value | Rationale |
|------|-------|-----------|
| New words per passage | **3-5** | Nation (2001): <5% unknown words for comprehensible input |
| Review words per passage | **2-4** | From previous 5 passages, reinforcing memory |
| Review window | **Each new word reappears within next 5 passages** | Ebbinghaus spaced repetition |
| Context vocabulary ceiling | **Target level - 1** | B1 passages use A2 context; B2 passages use A2+B1 context |
| Dialogue length | **10-14 turns, 120-180 words** | Existing convention maintained |

### Passage Data Structure Changes

New fields added to Passage:

```typescript
interface Passage {
  // ...existing fields (id, title, level, topic, genre, languageId, speakers, turns)
  sequence: number | null   // Learning order within this level (null = supplemental)
  newWordIds: number[]      // New words introduced in this passage (3-5)
  reviewWordIds: number[]   // Previously learned words revisited (2-4)
}
```

The legacy `wordIds` field is replaced by `newWordIds` and `reviewWordIds`.

`sequence` is nullable — passages with `sequence = null` are supplemental/standalone and not part of the spiral curriculum. This allows adding extra practice passages without disrupting the ordered sequence.

### Database Migration

New migration file: `packages/api/src/db/migrations/0002_spiral_progression.sql`

```sql
-- Add sequence for ordered curriculum within a level
ALTER TABLE passages ADD COLUMN sequence INTEGER;

-- Unique constraint: sequence is unique per (language, level) pair,
-- nullable to allow supplemental passages outside the curriculum
CREATE UNIQUE INDEX idx_passages_sequence
  ON passages(language_id, level, sequence)
  WHERE sequence IS NOT NULL;

-- Add role to passage-word relationships
-- 'new'    = word is introduced for the first time in this passage
-- 'review' = word was introduced in an earlier passage, revisited here
ALTER TABLE passage_words ADD COLUMN role TEXT NOT NULL DEFAULT 'new'
  CHECK (role IN ('new', 'review'));
```

Design notes:
- `role` (not `word_type`) — describes the word's function in the passage, not the word itself
- Partial unique index allows supplemental passages to coexist without sequence
- CHECK constraint enforces the enum at the DB layer
- The "first introduction" fact is derivable via query (`role='new'` + `sequence ORDER`), not stored redundantly

### Code Changes Required

1. **`packages/shared/src/types.ts`** — Add `sequence`, `newWordIds`, `reviewWordIds` to `Passage` type; remove `wordIds`
2. **`packages/api/src/db/migrations/0002_spiral_progression.sql`** — As above
3. **`packages/api/src/db/queries/passages.ts`** — Update `getPassages()` to `ORDER BY sequence NULLS LAST, id`; update `getPassageWordIds()` return type to `{ wordId: number; role: 'new' | 'review' }[]`
4. **`packages/api/scripts/migrate-content.ts`** — Read `newWordIds` and `reviewWordIds` from JSON; insert into `passage_words` with `role` column; populate `sequence`
5. **`packages/web/scripts/validate-data.ts`** — Replace `wordIds` with `newWordIds` + `reviewWordIds` in `REQUIRED_PASSAGE_FIELDS`; add new validation rules (see below)

### New Validation Rules for `validate-data.ts`

- `newWordIds` length must be 3-5 (for passages with non-null sequence)
- `reviewWordIds` length must be 2-4 (for passages with sequence > 1; first passage may have 0)
- `sequence` must be unique within each level and contiguous (1, 2, 3, ...)
- All IDs in `newWordIds` and `reviewWordIds` must reference existing words
- `reviewWordIds` must reference words that appeared as `newWordIds` in earlier passages (lower sequence) of the same level, OR belong to a lower CEFR level (cross-level review is allowed)
- **Spiral window enforcement:** for each word W introduced as `newWordIds` in passage at sequence N, W must appear in `reviewWordIds` of at least one passage with sequence in [N+1, N+5] within the same level. This makes the spiral guarantee machine-checked, not just a generation convention.

### UI Treatment of New vs Review Words

Both `newWordIds` and `reviewWordIds` populate `passage_words` and are tappable in PassageView. The `role` column enables future UI differentiation (e.g., badge or color), but Phase 1 treats them identically — all are highlighted and open WordTooltip. This avoids UI complexity while the core mechanism is validated.

### Difficulty Sequencing

Passages have a recommended learning order within each level:

```
B1 sequence:
  B1-001 (seq=1) → new [w1, w2, w3], context=A2
  B1-002 (seq=2) → new [w4, w5, w6], review [w1, w3]
  B1-003 (seq=3) → new [w7, w8, w9], review [w2, w5, w6]
  ...

B2 sequence:
  B2-001 (seq=1) → new [w1, w2, w3], context=A2+B1
  B2-002 (seq=2) → new [w4, w5, w6], review [w1, w3]
  ...
```

### Topic Distribution

- Every 5 passages must cover at least 3 different domains
- No more than 3 consecutive passages with the same topic
- Dialogues must feel natural and situational — never forced for vocabulary insertion

### Pre-Generation Checklist

Before generating any dialogue, verify:

1. New word count = 3-5, all same level
2. Review word count = 2-4, from previous 5 passages (first passage exempt)
3. Context vocabulary ≤ target level - 1
4. Each new word is planned to reappear within next 5 passages
5. Topic differs from at least one of the previous 2 passages
6. Dialogue length: 10-14 turns, 120-180 words
7. Dialogue is natural, with clear situation and character motivation

### Word Allocation Table Format

Before generating a batch of passages, create a JSON allocation plan:

```json
{
  "level": "B1",
  "allocations": [
    { "sequence": 1, "topic": "daily-life", "newWordIds": [30001, 30002, 30003], "reviewWordIds": [] },
    { "sequence": 2, "topic": "health", "newWordIds": [30004, 30005, 30006], "reviewWordIds": [30001, 30003] },
    { "sequence": 3, "topic": "work", "newWordIds": [30007, 30008, 30009], "reviewWordIds": [30002, 30005, 30006] }
  ]
}
```

This table is used to verify review coverage before generating any dialogue content. It is a planning artifact, not a runtime file.

### Batch Generation Workflow

1. Plan the full sequence's word allocation table (JSON format above)
2. Verify review coverage: every new word reappears within 5 passages of introduction
3. Generate dialogue content passage by passage
4. Run `validate:data` after generation

---

## 3. Migration Plan

### Phase 0: B2 Renumbering

1. Write and run one-off script to renumber B2 word IDs from 1-563 to 40001-40563 across all data files
2. Delete the script after use

### Phase 1: Schema and Types

1. Create `0002_spiral_progression.sql` migration
2. Update `Passage` type in `packages/shared/src/types.ts`
3. Apply migration locally

### Phase 2: Content Restructuring

1. Add B1 vocabulary (~200-300 words) in `words/b1.json` + `translations/en/b1.json` + `translations/zh-CN/b1.json`
2. Delete old passage files (`passages/b1.json`, `passages/b2.json`)
3. Generate new passages following spiral progression: B1×20 + B2×20
4. Update `migrate-content.ts` to handle new structure
5. Update `validate-data.ts` with new rules

### Phase 3: Validation and Deployment

1. Run `validate:data` to verify all constraints
2. Run `migrate:content` to seed local D1
3. Verify in dev server
4. Regenerate TTS audio and timestamps for new passages

### Scale Projection

| Level | Est. Words (Oxford 5000) | Passages Needed (4 new/passage) |
|-------|--------------------------|-------------------------------|
| A1    | ~500  | ~125 |
| A2    | ~1000 | ~250 |
| B1    | ~1500 | ~375 |
| B2    | ~1500 | ~375 |
| C1    | ~500  | ~125 |
| **Total** | **~5000** | **~1250** |

### Phased Delivery

- **Phase 1 (current):** Renumber B2 + add B1 vocabulary (200-300 words) + generate B1×20 + B2×20 passages → validate spiral mechanism
- **Phase 2+:** Incrementally expand vocabulary and passages per level

---

## 4. CLAUDE.md Updates

The following sections of CLAUDE.md need updating:

1. **Adding Words** — word ID segmentation table (all levels at 10000-block ranges), clarify core/translation separation, per-level generation rules, translation validation requirements
2. **Generating Passages** — passage ID segmentation, spiral progression rules, pre-generation checklist, word allocation table format, batch workflow, `newWordIds`/`reviewWordIds` structure
3. **Type System > Levels** — document word and passage ID ranges, note that ranges are per-language
4. **Architecture > Data flow** — document sequence-based passage ordering, `role` column semantics
5. **validate-data.ts** — document new validation rules including spiral window enforcement
