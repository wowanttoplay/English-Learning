# Architecture Design & Interface Specification

## Module Dependency Order (index.html script loading)

```
1. js/words.js           -- defines WORD_LIST = []
2. js/words_b2_001.js    -- pushes words 1-200
3. js/words_b2_002.js    -- pushes words 201-400
4. js/words_b2_003.js    -- pushes words 401-600
   ...more batch files...
5. js/passages.js        -- defines PASSAGES = []
6. js/passages_001.js    -- pushes passages 1-50
   ...more batch files...
7. js/srs.js             -- spaced repetition engine
8. js/dict-api.js        -- dictionary API
9. js/audio.js           -- NEW: audio playback module
10. js/app.js            -- UI (must be last)
```

## File Responsibilities & Agent Assignment

### word-curator agent 负责的文件:
- `js/words.js` — 改造为空数组定义 + batch loader
- `js/words_b2_001.js` ~ `js/words_b2_008.js` — B2 词汇数据（每文件约200词，共约1500词）
- `js/passages.js` — 定义 PASSAGES = []
- `js/passages_001.js` — 短文数据（50篇，覆盖 words 1-500）

### story-builder agent 负责的文件:
- `js/app.js` 中的阅读界面部分 — 新增 Reading screen
- 短文选择逻辑（可放在 app.js 中）

### ux-audio agent 负责的文件:
- `js/audio.js` — 全新音频模块
- `js/app.js` — UI 增强（Dashboard、卡片模式、设置页）
- `style.css` — 样式更新
- `index.html` — script 标签更新

## Interface Specifications

### WORD_LIST (global array)

```js
// js/words.js 定义：
const WORD_LIST = [];

// 各 batch 文件 push：
WORD_LIST.push(
  { id: 1, word: "abandon", pos: "verb", phonetic: "/əˈbændən/",
    zh: "放弃；遗弃", en: "to leave a place, thing, or person...",
    examples: ["sentence1", "sentence2"], level: "B2" },
  ...
);
```

### PASSAGES (global array)

```js
// js/passages.js 定义：
const PASSAGES = [];

// 各 batch 文件 push：
PASSAGES.push(
  { id: 1, title: "A Change of Plans",
    text: "Sarah had always wanted to study abroad...",
    wordIds: [1, 45, 67, 89, 102, 156],
    level: "B2", topic: "daily_life" },
  ...
);
```

### Audio module API (js/audio.js)

```js
const AudioPlayer = (() => {
  return {
    playWord(word, speed),       // speed: 'normal' | 'slow'
    playSentence(text, speed),   // TTS only
    preload(word),               // pre-fetch audio URL
    isAvailable(),               // bool
    setAutoPlay(enabled),        // toggle
    getPreferredVoice()          // best en-US voice
  };
})();
```

注意：不要用 `Audio` 作为模块名，会与浏览器内置 `Audio` 构造函数冲突。使用 `AudioPlayer`。

### SRS module — 需要新增的接口

story-builder 和 ux-audio 需要调用以下现有 SRS 接口：
- `SRS.getCardState(wordId)` — 获取单词学习状态
- `SRS.getStats()` — 获取学习统计
- `SRS.getDueCount()` — 获取待复习数量

不修改 SRS 核心算法。

### App module — 新增界面

需要在 app.js 中新增：
- `reading` screen — 短文阅读界面
- 底部导航新增 "Read" tab
- Dashboard 增强（进度条、热力图）
- Settings 增强（音频设置、卡片模式）

## Integration Rules

1. **避免冲突**：story-builder 和 ux-audio 都需要修改 app.js，因此采用顺序方式 — ux-audio 先完成基础 UI 改造，story-builder 后集成阅读界面
2. **数据独立**：word-curator 只负责数据文件，不碰逻辑代码
3. **接口约定**：各模块通过全局变量通信（WORD_LIST, PASSAGES, SRS, AudioPlayer, DictAPI, App）
4. **localStorage namespace**：各模块使用自己的 key，不交叉读写

## Phase 1 Scope (本次实现)

优先完成产品方案的 Phase 1-4：
1. 词汇扩展到至少 600 词 (word-curator)
2. 音频模块 + 基础 UI 改造 (ux-audio)
3. 短文数据 + 阅读界面 (story-builder，在 ux-audio 之后)

暂不实现：C1 词汇、卡片模式变化、里程碑庆祝、Leech 检测
