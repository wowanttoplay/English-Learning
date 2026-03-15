# Dialogue Content Strategy Design

## Problem

Current dialogues contain too many new B2 words per passage (11-26), causing learner stress. The system lacks lower-level vocabulary (A2/B1), making it impossible to construct natural dialogues with gradual difficulty progression.

## Solution: Spiral Progression Strategy

Based on Krashen's i+1 theory, Nation (2001), and Ebbinghaus spaced repetition research: each passage introduces only 3-5 new words and revisits 2-4 recently learned words, creating a spiral of introduction → reinforcement.

---

## 1. Vocabulary System Expansion

### ID Segmentation

| Level | ID Range | Capacity |
|-------|----------|----------|
| A1    | 10001-19999 | 9999 |
| A2    | 20001-29999 | 9999 |
| B1    | 30001-39999 | 9999 |
| B2    | 1-563 (unchanged) | existing |
| C1    | 50001-59999 | 9999 |
| C2    | 60001-69999 | 9999 |
| User  | 100001+ | existing convention |

### Data Structure: Core vs Translation Separation

**Core word data** (required, language-independent):
```json
{
  "id": 30001,
  "word": "convince",
  "pos": "verb",
  "phonetic": "/kənˈvɪns/",
  "en": "to make someone believe something is true",
  "examples": ["She convinced me to try the new restaurant.", "The data convinced the team to change direction."],
  "level": "B1",
  "topics": ["communication"]
}
```

`en` definition is core to English learning and stays in the word entry. `zh` is removed from core data.

**Translation data** (optional, per-language):
```
packages/api/scripts/data/translations/
  zh-CN/b1.json    # Chinese
  ja/b1.json       # Japanese (future)
  ko/b1.json       # Korean (future)
```

Each translation file contains only `{ id, translation }` mappings.

### Word Files

```
packages/api/scripts/data/words/
  a2.json    # new
  b1.json    # new
  b2.json    # existing (unchanged)
```

### Word Generation Rules

- Each entry: id, word, pos, phonetic, en, examples, level, topics
- `en`: English definition, ≤150 characters
- `examples`: exactly 2 sentences, 8-15 words each
- Example context vocabulary ≤ current word's level (A2 word examples use A1-A2 words, B1 examples use A2-B1 words)
- `topics`: 1-3 subtopic IDs from existing 16-subtopic hierarchy
- No duplicate entries within same level
- Translations generated as a separate step, not part of core word generation

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
  // ...existing fields (id, title, level, topic, genre, speakers, turns)
  sequence: number        // Learning order within this level
  newWordIds: number[]    // New words introduced in this passage (3-5)
  reviewWordIds: number[] // Previously learned words revisited (2-4)
}
```

The legacy `wordIds` field is replaced by `newWordIds + reviewWordIds` combined.

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
2. Review word count = 2-4, from previous 5 passages
3. Context vocabulary ≤ target level - 1
4. Each new word is planned to reappear within next 5 passages
5. Topic differs from at least one of the previous 2 passages
6. Dialogue length: 10-14 turns, 120-180 words
7. Dialogue is natural, with clear situation and character motivation

### Batch Generation Workflow

1. Plan the full sequence's word allocation table (which passage introduces which words, which passage reviews which words)
2. Verify review coverage: every new word reappears within 5 passages of introduction
3. Generate dialogue content passage by passage
4. Run `validate:data` after generation

---

## 3. Passage ID and Migration Plan

### New Passage ID Segmentation

| Level | ID Range |
|-------|----------|
| A1    | 10001-19999 |
| A2    | 20001-29999 |
| B1    | 30001-39999 |
| B2    | 40001-49999 |
| C1    | 50001-59999 |

Old passage IDs (1-12, 101-125) are retired.

### Migration

- Delete old `passages/b1.json` and `passages/b2.json`
- Replace with new files following spiral progression
- Regenerate TTS audio and timestamps for new passages

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

- **Phase 1 (current):** Add B1 vocabulary (200-300 words) + generate B1×20 + B2×20 passages → validate spiral mechanism
- **Phase 2+:** Incrementally expand vocabulary and passages per level

---

## 4. CLAUDE.md Updates

The following sections of CLAUDE.md need updating:

1. **Adding Words** — add ID segmentation table, core/translation separation, per-level generation rules
2. **Generating Passages** — replace with new spiral progression rules, pre-generation checklist, batch workflow
3. **Type System > Levels** — document passage ID ranges
4. **Architecture > Data flow** — document sequence-based passage ordering
