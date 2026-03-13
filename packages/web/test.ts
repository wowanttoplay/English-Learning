// Quick smoke test for core logic modules
// Run: npx tsx test.ts

// Mock localStorage for Node
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { for (const k in store) delete store[k] }
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Suppress window-dependent code
Object.defineProperty(globalThis, 'window', { value: { matchMedia: () => ({ matches: false }) } })

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${msg}`)
  } else {
    failed++
    console.error(`  ✗ ${msg}`)
  }
}

async function main() {
  console.log('\n=== Data Layer ===')

  const { WORD_LIST } = await import('./src/data/words.js')
  assert(Array.isArray(WORD_LIST), 'WORD_LIST is an array')
  assert(WORD_LIST.length >= 560 && WORD_LIST.length <= 600, `WORD_LIST has ~600 unique words (got ${WORD_LIST.length})`)
  assert(WORD_LIST[0].id === 1, 'First word ID is 1')
  assert(WORD_LIST[0].word === 'abandon', `First word is "abandon" (got "${WORD_LIST[0].word}")`)
  const lastWord = WORD_LIST[WORD_LIST.length - 1]
  assert(lastWord.id > 0, `Last word has valid ID (got ${lastWord.id})`)

  // Check all words have required fields
  let allValid = true
  for (const w of WORD_LIST) {
    if (!w.id || !w.word || !w.pos || !w.zh || !w.en || !w.examples || !w.level) {
      allValid = false
      console.error(`    Missing field in word ${w.id}: ${w.word}`)
      break
    }
  }
  assert(allValid, 'All words have required fields')

  // Check IDs are unique
  const idSet = new Set<number>()
  let uniqueIds = true
  for (const w of WORD_LIST) {
    if (idSet.has(w.id)) {
      uniqueIds = false
      console.error(`    Duplicate ID: ${w.id}`)
      break
    }
    idSet.add(w.id)
  }
  assert(uniqueIds, 'All word IDs are unique')

  // Check no duplicate words
  const wordSet = new Set<string>()
  let noDuplicates = true
  for (const w of WORD_LIST) {
    if (wordSet.has(w.word)) {
      noDuplicates = false
      console.error(`    Duplicate word: ${w.word}`)
      break
    }
    wordSet.add(w.word)
  }
  assert(noDuplicates, 'No duplicate words')

  const { TOPIC_REGISTRY } = await import('./src/data/topics.js')
  assert(TOPIC_REGISTRY.length === 16, `16 topics (got ${TOPIC_REGISTRY.length})`)

  const { PASSAGES } = await import('./src/data/passages.js')
  assert(PASSAGES.length > 0, `Has passages (got ${PASSAGES.length})`)
  assert(PASSAGES[0].id === 1, 'First passage ID is 1')
  assert(typeof PASSAGES[0].title === 'string', 'Passage has title')
  assert(Array.isArray(PASSAGES[0].wordIds), 'Passage has wordIds array')

  console.log('\n=== Word Index ===')

  const { WordIndex } = await import('./src/lib/word-index.js')
  WordIndex.build(WORD_LIST)

  assert(WordIndex.get(1)?.word === 'abandon', 'WordIndex.get(1) returns "abandon"')
  assert(WordIndex.get(600) !== null, 'WordIndex.get(600) returns a word')
  assert(WordIndex.get(999) === null, 'WordIndex.get(999) returns null')

  const workWords = WordIndex.getByTopic('work')
  assert(workWords.length > 0, `Topic "work" has words (got ${workWords.length})`)

  const topicCounts = WordIndex.getAllTopicCounts(TOPIC_REGISTRY)
  assert(Object.keys(topicCounts).length === 16, 'Topic counts for all 16 topics')

  console.log('\n=== SRS Engine ===')

  const { SRS } = await import('./src/lib/srs.js')

  // Fresh state
  localStorageMock.clear()
  SRS.clearCache()

  const stats0 = SRS.getStats(WORD_LIST.length)
  assert(stats0.totalWords === WORD_LIST.length, `Stats: totalWords = ${WORD_LIST.length}`)
  assert(stats0.totalStarted === 0, 'Stats: totalStarted = 0 initially')
  assert(stats0.streak === 0, 'Stats: streak = 0 initially')

  // Get cards for today
  const queue = SRS.getCardsForToday(WORD_LIST)
  assert(queue.new.length === 20, `New cards default 20/day (got ${queue.new.length})`)
  assert(queue.learning.length === 0, 'No learning cards initially')
  assert(queue.review.length === 0, 'No review cards initially')
  assert(queue.total === 20, `Total = 20 (got ${queue.total})`)

  // Rate first card as Good
  const card1 = SRS.rateCard(1, 3)
  assert(card1.state === 'learning', `Card rated Good: state = learning (got ${card1.state})`)
  assert(card1.step === 1, `Step advanced to 1 (got ${card1.step})`)

  // Rate same card Good again — should graduate
  const card1b = SRS.rateCard(1, 3)
  assert(card1b.state === 'review', `Card graduated to review (got ${card1b.state})`)
  assert(card1b.interval === 1, `Graduating interval = 1d (got ${card1b.interval})`)

  // Rate a card Easy — should graduate immediately with 4d interval
  const card2 = SRS.rateCard(2, 4)
  assert(card2.state === 'review', `Easy: graduated to review (got ${card2.state})`)
  assert(card2.interval === 4, `Easy interval = 4d (got ${card2.interval})`)

  // Rate a card Again — should reset to step 0
  const card3 = SRS.rateCard(3, 1)
  assert(card3.state === 'learning', `Again: state = learning (got ${card3.state})`)
  assert(card3.step === 0, `Again: step reset to 0 (got ${card3.step})`)

  // Check stats after rating
  SRS.clearCache()
  const stats1 = SRS.getStats(600)
  assert(stats1.todayLearned === 3, `Learned today = 3 (got ${stats1.todayLearned})`)
  assert(stats1.todayReviewed >= 4, `Reviewed today >= 4 (got ${stats1.todayReviewed})`)
  assert(stats1.streak === 1, `Streak = 1 (got ${stats1.streak})`)

  // Test card state
  assert(SRS.getCardState(1) === 'review', 'Card 1 state = review')
  assert(SRS.getCardState(999) === 'unseen', 'Card 999 state = unseen')

  // Test settings
  SRS.setNewCardsPerDay(10)
  SRS.clearCache()
  const queue2 = SRS.getCardsForToday(WORD_LIST)
  // Already learned 3 today, so 10-3=7 new cards remaining
  assert(queue2.new.length === 7, `After setting 10/day, 7 new remaining (got ${queue2.new.length})`)

  // Test topic filter
  SRS.setActiveTopics(['work'])
  SRS.clearCache()
  const queue3 = SRS.getCardsForToday(WORD_LIST)
  // Check that new cards are filtered to work topic
  let allWorkTopic = true
  for (const c of queue3.new) {
    const w = WORD_LIST.find((w: any) => w.id === c.wordId)
    if (w && (!w.topics || !w.topics.includes('work'))) {
      allWorkTopic = false
      break
    }
  }
  assert(allWorkTopic, 'Topic filter: all new cards belong to "work" topic')

  // Test reset
  SRS.resetProgress()
  SRS.clearCache()
  const stats2 = SRS.getStats(600)
  assert(stats2.totalStarted === 0, 'After reset: totalStarted = 0')

  console.log('\n=== Types ===')

  // Verify type imports work
  const types = await import('./src/types/index.js')
  assert(types !== undefined, 'Type module imports successfully')

  console.log('\n=== Dict API ===')

  const { DictAPI } = await import('./src/lib/dict-api.js')
  assert(typeof DictAPI.lookup === 'function', 'DictAPI.lookup is a function')
  assert(typeof DictAPI.getCached === 'function', 'DictAPI.getCached is a function')
  assert(DictAPI.getCached('nonexistent') === null, 'getCached returns null for uncached word')

  // === Summary ===
  console.log(`\n${'='.repeat(40)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('All tests passed!')
  }
}

main().catch(e => {
  console.error('Test runner error:', e)
  process.exit(1)
})
