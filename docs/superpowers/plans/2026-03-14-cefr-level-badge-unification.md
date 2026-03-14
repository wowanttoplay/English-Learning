# CEFR Level Badge Unification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract a reusable `LevelBadge.vue` component and integrate it consistently across all modules that display word or passage levels, plus add CEFR level filtering to WordListView.

**Architecture:** Create a single presentational component that maps `CefrLevel` to a color-coded badge. Replace all inline level markup with this component. Add a `level` ref to `wordListQuery` store and wire it to the existing API `level` query parameter.

**Tech Stack:** Vue 3, TypeScript, Pinia, CSS custom properties

---

## Chunk 1: LevelBadge Component + Refactor Existing Usage

### Task 1: Create LevelBadge.vue component

**Files:**
- Create: `packages/web/src/components/LevelBadge.vue`
- Modify: `packages/web/src/styles/components.css` — add `.level-user`

- [ ] **Step 1: Create LevelBadge.vue**

```vue
<template>
  <span class="level-badge" :class="levelClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CefrLevel } from '@/types'

const props = defineProps<{ level: CefrLevel }>()

const levelClass = computed(() => 'level-' + props.level.toLowerCase())
const label = computed(() => props.level === 'user' ? 'MY' : props.level)
</script>
```

- [ ] **Step 2: Add `.level-user` to CSS**

In `packages/web/src/styles/components.css`, after the `.level-c2` rule, add:

```css
.level-user { background: var(--text-tertiary); }
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: all 3 packages pass

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/LevelBadge.vue packages/web/src/styles/components.css
git commit -m "feat: create LevelBadge.vue component with user level support"
```

### Task 2: Replace inline badges in ReadingView and PassageView

**Files:**
- Modify: `packages/web/src/views/ReadingView.vue`
- Modify: `packages/web/src/views/PassageView.vue`

- [ ] **Step 1: Update ReadingView.vue**

Import `LevelBadge` and replace two inline `<span class="level-badge" ...>` with `<LevelBadge :level="passage.level" />` and `<LevelBadge :level="p.level" />`.

Remove `CefrCoreLevel` import (no longer needed in template logic, but keep for `cefrLevels` const).

- [ ] **Step 2: Update PassageView.vue**

Import `LevelBadge` and replace inline `<span class="level-badge" ...>` with `<LevelBadge :level="passage.level" />`.

- [ ] **Step 3: Verify typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/views/ReadingView.vue packages/web/src/views/PassageView.vue
git commit -m "refactor: use LevelBadge component in ReadingView and PassageView"
```

## Chunk 2: Add LevelBadge to Word-Related Modules

### Task 3: Add LevelBadge to WordListView

**Files:**
- Modify: `packages/web/src/views/WordListView.vue`

- [ ] **Step 1: Add LevelBadge to word list items**

Import `LevelBadge`. In the word item div (after `.word-item-text`), add `<LevelBadge :level="w.level" />` before the known-star button.

```html
<div class="word-item-text">
  <div class="word-item-word">{{ w.word }}</div>
  <div v-if="w.definitionNative" class="word-item-zh">{{ w.definitionNative }}</div>
</div>
<LevelBadge :level="w.level" />
<button class="word-known-btn" ...>
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/views/WordListView.vue
git commit -m "feat: show LevelBadge in WordListView word items"
```

### Task 4: Add LevelBadge to StudyView

**Files:**
- Modify: `packages/web/src/views/StudyView.vue`

- [ ] **Step 1: Add LevelBadge next to POS on card front**

Import `LevelBadge`. After the `.card-pos` div (line 48), add:

```html
<div class="card-pos">{{ currentWord.pos }}</div>
<LevelBadge :level="currentWord.level" />
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/views/StudyView.vue
git commit -m "feat: show LevelBadge on StudyView flashcard"
```

### Task 5: Add LevelBadge to WordDetailModal

**Files:**
- Modify: `packages/web/src/components/WordDetailModal.vue`

- [ ] **Step 1: Add LevelBadge in modal header**

Import `LevelBadge`. In the header flex container (line 6-16), add `<LevelBadge :level="word.level" />` after the SRS state badge.

```html
<span class="word-item-badge" :class="'badge-' + state">{{ state }}</span>
<LevelBadge :level="word.level" />
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/WordDetailModal.vue
git commit -m "feat: show LevelBadge in WordDetailModal"
```

### Task 6: Add LevelBadge to WordTooltip

**Files:**
- Modify: `packages/web/src/components/WordTooltip.vue`

- [ ] **Step 1: Add LevelBadge in tooltip header**

Import `LevelBadge`. In the `.reading-tooltip-word` div (line 4-7), add `<LevelBadge :level="word.level" />` after the state span.

```html
<span class="reading-tooltip-state" :class="'state-' + cardState">{{ stateLabel }}</span>
<LevelBadge v-if="word" :level="word.level" />
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/WordTooltip.vue
git commit -m "feat: show LevelBadge in WordTooltip"
```

## Chunk 3: WordListView Level Filtering

### Task 7: Add level state to wordListQuery store

**Files:**
- Modify: `packages/web/src/stores/wordListQuery.ts`

- [ ] **Step 1: Add level ref and wire to API**

Add `level` ref. Import `CefrLevel`. Pass `level` to API call. Update `resetFilters`.

```ts
import type { Word, CefrLevel, DomainId, SubtopicId } from '@/types'

const level = ref<'all' | CefrLevel>('all')

// In loadWords():
const result = await wordsApi.getWords({
  lang,
  page: page.value,
  pageSize: pageSize.value,
  level: level.value === 'all' ? undefined : level.value,
  topic: topic.value === 'all' ? undefined : topic.value,
})

// In resetFilters():
level.value = 'all'

// In return:
return { level, ... }
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/stores/wordListQuery.ts
git commit -m "feat: add level filtering to wordListQuery store"
```

### Task 8: Add CEFR level filter tabs to WordListView UI

**Files:**
- Modify: `packages/web/src/views/WordListView.vue`

- [ ] **Step 1: Add level filter row**

Import `CefrLevel` type. Add a new `filter-tabs` row after the search box, before the domain filter tabs (after line 14):

```html
<div class="filter-tabs">
  <button
    class="filter-tab"
    :class="{ active: query.level === 'all' }"
    @click="setLevel('all')"
  >All Levels</button>
  <button
    v-for="lv in cefrLevels"
    :key="lv"
    class="filter-tab"
    :class="{ active: query.level === lv }"
    @click="setLevel(lv)"
  >{{ lv }}</button>
  <button
    class="filter-tab"
    :class="{ active: query.level === 'user' }"
    @click="setLevel('user')"
  >My Words</button>
</div>
```

Add in script:

```ts
import type { CefrLevel, DomainId } from '@/types'

const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function setLevel(lv: 'all' | CefrLevel) {
  query.level = lv
  query.page = 1
  query.loadWords()
}
```

- [ ] **Step 2: Remove 'user' from SRS state filter tabs**

The "My Words" button moves to the level filter row. Remove it from the `filters` computed:

```ts
const filters = computed<{ key: WordListFilter; label: string }[]>(() => [
  { key: 'all', label: 'All' },
  { key: 'unseen', label: 'Unseen' },
  { key: 'learning', label: 'Learning' },
  { key: 'review', label: 'Review' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'known', label: 'Known' },
])
```

Remove client-side `user` filter from `filtered` computed (line 150):

```ts
// Remove: if (f === 'user') return w.level === 'user'
```

Update `WordListFilter` type in `wordListQuery.ts` to remove `'user'`:

```ts
export type WordListFilter = 'all' | 'unseen' | 'learning' | 'review' | 'mastered' | 'known'
```

- [ ] **Step 3: Verify typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/views/WordListView.vue packages/web/src/stores/wordListQuery.ts
git commit -m "feat: add CEFR level filter tabs to WordListView"
```

## Chunk 4: Final Verification

### Task 9: Full verification

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: all 3 packages pass

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: exit 0, no errors

- [ ] **Step 3: Verify no remaining inline level badges**

Search for old patterns:
- `difficulty-badge` — should have 0 results
- `passage-level` — should have 0 results
- `class="level-badge"` in `.vue` files — should have 0 results (all replaced by `<LevelBadge>`)

- [ ] **Step 4: Verify LevelBadge import count matches usage**

Grep `LevelBadge` across all `.vue` files — should appear in:
- ReadingView.vue
- PassageView.vue
- WordListView.vue
- StudyView.vue
- WordDetailModal.vue
- WordTooltip.vue
