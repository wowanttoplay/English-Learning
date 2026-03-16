# Warm & Friendly UI Redesign

## Problem

The current UI uses a cold blue-gray iOS style that feels clinical and generic. It lacks personality and visual warmth, which is important for a language learning app where reducing anxiety and encouraging consistent practice matters.

## Solution

Redesign all pages to a Warm & Friendly visual style: amber/green/indigo color palette, generous spacing, rounded corners, speaker avatars, progress gamification. Covers all 5 views + navigation.

---

## 1. Design System Changes (tokens.css)

### Color Palette

| Token | Current | New | Purpose |
|-------|---------|-----|---------|
| `--accent` | `#007aff` (blue) | `#f59e0b` (amber) | Primary action, active nav |
| `--accent-hover` | `#0066d6` | `#d97706` | Hover state |
| `--accent-soft` | `rgba(0,122,255,0.1)` | `rgba(245,158,11,0.1)` | Light accent background |
| `--bg` | `#f2f2f7` | `#faf9f6` | Page background (warm gray) |
| `--bg-card` | `#ffffff` | `#ffffff` | Card background (unchanged) |
| `--green` | `#34c759` | `#10b981` | Progress, completion |
| `--speaker-a` | n/a (new) | `#f59e0b` | Speaker A color (amber) |
| `--speaker-a-bg` | n/a (new) | `#fef3c7` | Speaker A light background |
| `--speaker-a-text` | n/a (new) | `#92400e` | Speaker A text color |
| `--speaker-b` | n/a (new) | `#6366f1` | Speaker B color (indigo) |
| `--speaker-b-bg` | n/a (new) | `#eef2ff` | Speaker B light background |
| `--speaker-b-text` | n/a (new) | `#4338ca` | Speaker B text color |

Dark mode: invert backgrounds to dark warm tones, keep accent colors vibrant.

### Spacing & Radius

| Token | Current | New |
|-------|---------|-----|
| `--radius-sm` | `10px` | `12px` |
| `--radius` | `14px` | `16px` |
| `--radius-lg` | `20px` | `20px` (unchanged) |
| `--max-width` | `480px` | `560px` |

### Typography

No font stack change. Add weight variations:
- Extra bold (800) for flashcard words and stat numbers
- Medium (500) for labels and secondary text

---

## 2. Navigation (BottomNav / Sidebar)

- Active tab icon color: amber `--accent` (was blue)
- Active tab label: amber
- Background: keep backdrop blur, tint slightly warm
- Desktop sidebar: active item gets warm amber left border + light amber background

---

## 3. Dashboard View

- Stats cards: white cards with subtle warm shadow, stat numbers in 800 weight
- Weekly heatmap: amber→green color scale for bar levels (level-1=`#fef3c7`, level-2=`#fde68a`, level-3=`#f59e0b`, level-4=`#10b981`)
- "Start Review" button: amber gradient background (`#f59e0b` → `#fbbf24`), white text, 700 weight
- Progress bar: green gradient (`#10b981` → `#34d399`)
- Section headers: warm brown text `#92400e` instead of gray

---

## 4. Study View (Flashcard)

### Card Design (Warm & Immersive)
- Card background: warm gradient `linear-gradient(145deg, #fffbeb, #fef3c7)`
- Decorative circle: top-right, `rgba(251,191,36,0.15)`
- Box shadow: `0 8px 32px rgba(245,158,11,0.15)`
- Border radius: 20px
- Word: 38px, weight 800
- Phonetic/POS: amber-toned subdued text `#92400e`

### Progress Indicator
- Replace current progress bar with dot array (filled=green, current=amber with glow ring, todo=gray)
- Show `N / total` count next to dots

### Streak Counter
- Small pill badge above word: "🔥 N streak" (white bg, amber text)
- Shows consecutive correct answers in current session

### Rating Buttons
- 4 buttons: Again (white/red), Hard (white/orange), Good (solid green `#10b981`, white text), Easy (white/blue)
- "Good" is visually prominent (filled) as the most common action
- Rounded 14px, shadow on each button

### Session Complete
- Warm celebratory gradient background
- Stats summary (reviewed, accuracy, streak)

---

## 5. Word List View

- Filter tabs (Level/Domain/Subtopic): amber pill style when selected (`--accent-bg` background, `--accent` text)
- Unselected tabs: light warm gray
- Word cards: warm hover effect (light amber border glow)
- Level badges: consistent with passage list (B1=blue `#dbeafe`, B2=indigo `#e0e7ff`, A2=green `#dcfce7`)
- Search input: warm amber focus ring
- "Known" star toggle: amber when active

---

## 6. Reading View (Passage List)

### Rich Card Design
- White card, 16px radius, subtle warm shadow
- Sequence number: amber gradient circle (40px), white text, bold
- Completed passages: gray circle with checkmark, card dimmed to 55% opacity
- Level badge: colored pill (A2/B1/B2)
- Topic: emoji + topic name in gray text
- Speakers: overlapping mini avatars (20px circles) with speaker names
- Footer: "N new words" with eye icon in green, progress bar (green for unread, gray for completed)
- Card-to-card gap: 14px

### Filter Section
- Level/Domain/Subtopic filter rows with warm pill buttons
- Active filter: amber background

---

## 7. Passage View (Reading Dialogue)

### Script Style Layout
- Each turn: left-colored border (3px) + small avatar (24px) + speaker name + text
- Speaker A: amber border, amber avatar gradient, `#92400e` name
- Speaker B: indigo border, indigo avatar gradient, `#4338ca` name
- Turn gap: 18px
- Text: 14px, line-height 1.65

### Word Highlighting
- New words (from `newWordIds`): warm pill highlight — `background: #fef3c7; color: #92400e; font-weight: 600; padding: 2px 5px; border-radius: 4px`
- Review words (from `reviewWordIds`): same style (Phase 1 treats identically)
- Tappable — opens WordTooltip

### Audio Player
- Progress bar: amber gradient
- Play/pause button: amber circle
- Speed selector: warm styling
- Skip buttons: warm gray

### Page Header
- Passage title: large (24px), bold
- Level badge + topic + speaker info row below title

---

## 8. Dark Mode Adjustments

- Background: `#1a1917` (warm dark, not pure black)
- Card background: `#2a2826`
- Accent amber stays vibrant
- Speaker colors: slightly lighter for contrast
- Flashcard gradient: dark warm tones `linear-gradient(145deg, #2a2419, #1f1b14)`
- Text: warm white `#fafaf9` (not pure white)

---

## 9. Files to Modify

| File | Changes |
|------|---------|
| `packages/web/src/styles/tokens.css` | Color palette, spacing, radius, new speaker tokens |
| `packages/web/src/styles/base.css` | Button styles, progress bar colors |
| `packages/web/src/styles/layout.css` | Max-width, nav active states |
| `packages/web/src/styles/components.css` | Flashcard, tooltip, player, filter, passage card styles |
| `packages/web/src/views/DashboardView.vue` | Stats card styling, heatmap colors, button style |
| `packages/web/src/views/StudyView.vue` | Flashcard template (gradient card, dots, streak) |
| `packages/web/src/views/WordListView.vue` | Filter pill styling, card hover |
| `packages/web/src/views/ReadingView.vue` | Rich card template (avatars, progress, sequence circle) |
| `packages/web/src/views/PassageView.vue` | Script layout (borders, avatars, highlights) |
| `packages/web/src/components/BottomNav.vue` | Active state amber |
| `packages/web/src/components/PassageAudioPlayer.vue` | Player warm colors |
| `packages/web/src/components/RatingButtons.vue` | Warm button styles, Good highlighted |
| `packages/web/src/components/WordTooltip.vue` | Warm styling |

---

## 10. What Does NOT Change

- App architecture, routing, data flow
- Responsive breakpoint (768px) stays the same
- Store/composable/API logic — no business logic changes
- Functionality — all features remain identical
- Font stack — keep system fonts

**Note:** While this is primarily a visual redesign, some views require template changes (new HTML elements) in addition to CSS. Specifically: StudyView (dot progress, streak pill), ReadingView (sequence circle, avatars, word count footer), PassageView (script layout with borders/avatars). These are presentational template changes, not logic changes.
