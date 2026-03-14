# CEFR Level Badge Unification

**Date:** 2026-03-14
**Branch:** feature/cefr-level-badges

## Problem

Level display is inconsistent across the app. Passages show color-coded CEFR badges, but words show no level information anywhere. The badge markup is inlined and duplicated rather than encapsulated.

## Design

### New Component: `LevelBadge.vue`

Presentational component in `packages/web/src/components/`.

```vue
<template>
  <span class="level-badge" :class="levelClass">{{ label }}</span>
</template>
```

**Props:**
- `level: CefrLevel` (required)

**Behavior:**
- A1-C2: displays level text with color-coded background (green → blue → purple gradient)
- `'user'`: displays "MY" with a distinct style (e.g., gray/neutral)

**CSS:** Uses existing `.level-badge` and `.level-*` classes in `components.css`. Add `.level-user` for user-created words.

### Module Integration

| Module | Location | Change |
|--------|----------|--------|
| ReadingView | passage list item `.passage-item-meta` | Replace inline `<span>` with `<LevelBadge>` |
| PassageView | header `.card-progress` | Replace inline `<span>` with `<LevelBadge>` |
| WordListView | word list item, next to topic/POS | Add `<LevelBadge>` |
| WordListView | filter section | Add CEFR level filter-tabs row |
| StudyView | card front, near POS | Add `<LevelBadge>` |
| WordDetailModal | detail header | Add `<LevelBadge>` |
| WordTooltip | tooltip meta area | Add `<LevelBadge>` |
| FreeWordTooltip | — | No change (external dict has no CEFR data) |

### WordListView Level Filtering

- Add a row of CEFR level filter buttons (All + A1-C2 + My Words)
- Wire to existing `level` API query parameter (already supported in backend)
- "My Words" tab remains, equivalent to filtering `level === 'user'`

### CSS Addition

```css
.level-user { background: var(--text-tertiary); }
```

### Files Changed

- **New:** `packages/web/src/components/LevelBadge.vue`
- **Edit:** `packages/web/src/views/ReadingView.vue` — use LevelBadge, remove inline span
- **Edit:** `packages/web/src/views/PassageView.vue` — use LevelBadge, remove inline span
- **Edit:** `packages/web/src/views/WordListView.vue` — add LevelBadge + level filter
- **Edit:** `packages/web/src/views/StudyView.vue` — add LevelBadge on card
- **Edit:** `packages/web/src/components/WordDetailModal.vue` — add LevelBadge
- **Edit:** `packages/web/src/components/WordTooltip.vue` — add LevelBadge
- **Edit:** `packages/web/src/styles/components.css` — add `.level-user`

### Out of Scope

- FreeWordTooltip (no CEFR data from external dictionary)
- Adding new word data files for other CEFR levels (content task, not UI)
- Level-based statistics on Dashboard (future feature)
