import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SrsCard, SrsHistory } from '../types'
import {
  LEARNING_STEPS,
  GRADUATING_INTERVAL,
  EASY_INTERVAL,
  DEFAULT_EASE,
  MIN_EASE,
  MASTERED_INTERVAL,
  isDue,
  rateLearningCard,
  rateReviewCard,
  rateCard,
  createNewCard,
  createKnownCard,
  markKnown,
  unmarkKnown,
  computeStats,
  buildQueue,
} from '../srs-engine'
import { today, now, formatDate, addDays } from '../date-utils'

// --- Helpers ---

function makeLearningCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    wordId: 1,
    state: 'learning',
    ease: DEFAULT_EASE,
    interval: 0,
    due: today(),
    dueTimestamp: now(),
    reps: 0,
    lapses: 0,
    step: 0,
    ...overrides,
  }
}

function makeReviewCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    wordId: 1,
    state: 'review',
    ease: DEFAULT_EASE,
    interval: 10,
    due: today(),
    dueTimestamp: new Date(today() + 'T00:00:00').getTime(),
    reps: 5,
    lapses: 0,
    step: 0,
    ...overrides,
  }
}

function makeRelearningCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    wordId: 1,
    state: 'relearning',
    ease: DEFAULT_EASE,
    interval: 5,
    due: today(),
    dueTimestamp: now(),
    reps: 3,
    lapses: 1,
    step: 0,
    ...overrides,
  }
}

// --- Tests ---

describe('Constants', () => {
  it('has expected default values', () => {
    expect(LEARNING_STEPS).toEqual([1, 10])
    expect(GRADUATING_INTERVAL).toBe(1)
    expect(EASY_INTERVAL).toBe(4)
    expect(DEFAULT_EASE).toBe(2.5)
    expect(MIN_EASE).toBe(1.3)
    expect(MASTERED_INTERVAL).toBe(21)
  })
})

describe('createNewCard', () => {
  it('creates a learning card with default values', () => {
    const card = createNewCard(42)
    expect(card.wordId).toBe(42)
    expect(card.state).toBe('learning')
    expect(card.ease).toBe(DEFAULT_EASE)
    expect(card.interval).toBe(0)
    expect(card.due).toBe(today())
    expect(card.reps).toBe(0)
    expect(card.lapses).toBe(0)
    expect(card.step).toBe(0)
  })

  it('sets dueTimestamp to approximately now', () => {
    const before = Date.now()
    const card = createNewCard(1)
    const after = Date.now()
    expect(card.dueTimestamp).toBeGreaterThanOrEqual(before)
    expect(card.dueTimestamp).toBeLessThanOrEqual(after)
  })
})

describe('createKnownCard', () => {
  it('creates a card with state known', () => {
    const card = createKnownCard(99)
    expect(card.wordId).toBe(99)
    expect(card.state).toBe('known')
    expect(card.ease).toBe(DEFAULT_EASE)
    expect(card.reps).toBe(0)
  })
})

describe('isDue', () => {
  it('learning card is due when dueTimestamp <= now', () => {
    const card = makeLearningCard({ dueTimestamp: Date.now() - 1000 })
    expect(isDue(card)).toBe(true)
  })

  it('learning card is not due when dueTimestamp is in the future', () => {
    const card = makeLearningCard({ dueTimestamp: Date.now() + 60_000 })
    expect(isDue(card)).toBe(false)
  })

  it('relearning card uses dueTimestamp', () => {
    const card = makeRelearningCard({ dueTimestamp: Date.now() - 1 })
    expect(isDue(card)).toBe(true)
  })

  it('review card is due when due <= today', () => {
    const card = makeReviewCard({ due: today() })
    expect(isDue(card)).toBe(true)
  })

  it('review card is due when due is in the past', () => {
    const card = makeReviewCard({ due: '2020-01-01' })
    expect(isDue(card)).toBe(true)
  })

  it('review card is not due when due is in the future', () => {
    const card = makeReviewCard({ due: addDays(today(), 5) })
    expect(isDue(card)).toBe(false)
  })
})

describe('rateLearningCard', () => {
  describe('Again (rating 1)', () => {
    it('resets step to 0', () => {
      const card = makeLearningCard({ step: 1 })
      const result = rateLearningCard(card, 1)
      expect(result.step).toBe(0)
    })

    it('increments reps', () => {
      const card = makeLearningCard({ reps: 2 })
      const result = rateLearningCard(card, 1)
      expect(result.reps).toBe(3)
    })

    it('sets due to today', () => {
      const result = rateLearningCard(makeLearningCard(), 1)
      expect(result.due).toBe(today())
    })

    it('sets dueTimestamp ~1 minute in the future', () => {
      const before = Date.now()
      const result = rateLearningCard(makeLearningCard(), 1)
      const expectedMin = before + LEARNING_STEPS[0] * 60_000
      // Allow 1s tolerance
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expectedMin - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expectedMin + 1000)
    })

    it('stays in same state (learning)', () => {
      const result = rateLearningCard(makeLearningCard(), 1)
      expect(result.state).toBe('learning')
    })
  })

  describe('Hard (rating 2)', () => {
    it('stays at current step', () => {
      const card = makeLearningCard({ step: 0 })
      const result = rateLearningCard(card, 2)
      expect(result.step).toBe(0)
    })

    it('uses current step delay', () => {
      const before = Date.now()
      const card = makeLearningCard({ step: 0 })
      const result = rateLearningCard(card, 2)
      const expectedMin = before + LEARNING_STEPS[0] * 60_000
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expectedMin - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expectedMin + 1000)
    })

    it('at step 1, uses 10min delay', () => {
      const before = Date.now()
      const card = makeLearningCard({ step: 1 })
      const result = rateLearningCard(card, 2)
      const expectedMin = before + LEARNING_STEPS[1] * 60_000
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expectedMin - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expectedMin + 1000)
    })

    it('beyond last step uses last step delay', () => {
      const before = Date.now()
      const card = makeLearningCard({ step: 5 })
      const result = rateLearningCard(card, 2)
      const lastStep = LEARNING_STEPS[LEARNING_STEPS.length - 1]
      const expectedMin = before + lastStep * 60_000
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expectedMin - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expectedMin + 1000)
    })

    it('increments reps', () => {
      const result = rateLearningCard(makeLearningCard({ reps: 0 }), 2)
      expect(result.reps).toBe(1)
    })
  })

  describe('Good (rating 3)', () => {
    it('advances step', () => {
      const card = makeLearningCard({ step: 0 })
      const result = rateLearningCard(card, 3)
      expect(result.step).toBe(1)
      expect(result.state).toBe('learning')
    })

    it('graduates when step reaches end of LEARNING_STEPS', () => {
      const card = makeLearningCard({ step: 1 }) // step 1 is last index
      const result = rateLearningCard(card, 3)
      expect(result.state).toBe('review')
      expect(result.interval).toBe(GRADUATING_INTERVAL)
      expect(result.step).toBe(0)
    })

    it('graduating sets due to tomorrow', () => {
      const card = makeLearningCard({ step: 1 })
      const result = rateLearningCard(card, 3)
      expect(result.due).toBe(addDays(today(), GRADUATING_INTERVAL))
    })

    it('increments reps on graduation', () => {
      const card = makeLearningCard({ step: 1, reps: 3 })
      const result = rateLearningCard(card, 3)
      expect(result.reps).toBe(4)
    })

    it('sets dueTimestamp to next step delay when not graduating', () => {
      const before = Date.now()
      const card = makeLearningCard({ step: 0 })
      const result = rateLearningCard(card, 3)
      const expectedMin = before + LEARNING_STEPS[1] * 60_000
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expectedMin - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expectedMin + 1000)
    })
  })

  describe('Easy (rating 4)', () => {
    it('graduates immediately with EASY_INTERVAL', () => {
      const card = makeLearningCard({ step: 0 })
      const result = rateLearningCard(card, 4)
      expect(result.state).toBe('review')
      expect(result.interval).toBe(EASY_INTERVAL)
    })

    it('increases ease by 0.15', () => {
      const card = makeLearningCard({ ease: DEFAULT_EASE })
      const result = rateLearningCard(card, 4)
      expect(result.ease).toBeCloseTo(DEFAULT_EASE + 0.15)
    })

    it('sets due 4 days from today', () => {
      const result = rateLearningCard(makeLearningCard(), 4)
      expect(result.due).toBe(addDays(today(), EASY_INTERVAL))
    })

    it('increments reps', () => {
      const result = rateLearningCard(makeLearningCard({ reps: 1 }), 4)
      expect(result.reps).toBe(2)
    })
  })
})

describe('rateReviewCard', () => {
  describe('Again (rating 1)', () => {
    it('moves to relearning state', () => {
      const result = rateReviewCard(makeReviewCard(), 1)
      expect(result.state).toBe('relearning')
    })

    it('resets step to 0', () => {
      const result = rateReviewCard(makeReviewCard(), 1)
      expect(result.step).toBe(0)
    })

    it('increments lapses', () => {
      const card = makeReviewCard({ lapses: 2 })
      const result = rateReviewCard(card, 1)
      expect(result.lapses).toBe(3)
    })

    it('halves interval (rounded)', () => {
      const card = makeReviewCard({ interval: 10 })
      const result = rateReviewCard(card, 1)
      expect(result.interval).toBe(5)
    })

    it('halved interval is at least 1', () => {
      const card = makeReviewCard({ interval: 1 })
      const result = rateReviewCard(card, 1)
      expect(result.interval).toBe(1)
    })

    it('decreases ease by 0.20', () => {
      const card = makeReviewCard({ ease: 2.5 })
      const result = rateReviewCard(card, 1)
      expect(result.ease).toBeCloseTo(2.3)
    })

    it('ease does not go below MIN_EASE', () => {
      const card = makeReviewCard({ ease: 1.35 })
      const result = rateReviewCard(card, 1)
      expect(result.ease).toBe(MIN_EASE)
    })

    it('sets dueTimestamp ~1 minute ahead', () => {
      const before = Date.now()
      const result = rateReviewCard(makeReviewCard(), 1)
      const expected = before + LEARNING_STEPS[0] * 60_000
      expect(result.dueTimestamp).toBeGreaterThanOrEqual(expected - 1000)
      expect(result.dueTimestamp).toBeLessThanOrEqual(expected + 1000)
    })

    it('increments reps', () => {
      const card = makeReviewCard({ reps: 5 })
      const result = rateReviewCard(card, 1)
      expect(result.reps).toBe(6)
    })
  })

  describe('Hard (rating 2)', () => {
    it('stays in review state', () => {
      const result = rateReviewCard(makeReviewCard(), 2)
      expect(result.state).toBe('review')
    })

    it('multiplies interval by 1.2', () => {
      const card = makeReviewCard({ interval: 10 })
      const result = rateReviewCard(card, 2)
      expect(result.interval).toBe(12) // 10 * 1.2 = 12
    })

    it('interval is at least 1', () => {
      const card = makeReviewCard({ interval: 0 })
      const result = rateReviewCard(card, 2)
      expect(result.interval).toBeGreaterThanOrEqual(1)
    })

    it('decreases ease by 0.15', () => {
      const card = makeReviewCard({ ease: 2.5 })
      const result = rateReviewCard(card, 2)
      expect(result.ease).toBeCloseTo(2.35)
    })

    it('ease does not go below MIN_EASE', () => {
      const card = makeReviewCard({ ease: MIN_EASE })
      const result = rateReviewCard(card, 2)
      expect(result.ease).toBe(MIN_EASE)
    })

    it('sets due date in the future', () => {
      const card = makeReviewCard({ interval: 10 })
      const result = rateReviewCard(card, 2)
      expect(result.due).toBe(addDays(today(), 12))
    })
  })

  describe('Good (rating 3)', () => {
    it('multiplies interval by ease factor', () => {
      const card = makeReviewCard({ interval: 10, ease: 2.5 })
      const result = rateReviewCard(card, 3)
      expect(result.interval).toBe(25) // 10 * 2.5 = 25
    })

    it('does not change ease', () => {
      const card = makeReviewCard({ ease: 2.5 })
      const result = rateReviewCard(card, 3)
      expect(result.ease).toBe(2.5)
    })

    it('sets due date based on new interval', () => {
      const card = makeReviewCard({ interval: 10, ease: 2.5 })
      const result = rateReviewCard(card, 3)
      expect(result.due).toBe(addDays(today(), 25))
    })

    it('interval is at least 1', () => {
      const card = makeReviewCard({ interval: 0, ease: 2.5 })
      const result = rateReviewCard(card, 3)
      expect(result.interval).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Easy (rating 4)', () => {
    it('multiplies interval by ease * 1.3', () => {
      const card = makeReviewCard({ interval: 10, ease: 2.5 })
      const result = rateReviewCard(card, 4)
      expect(result.interval).toBe(33) // round(10 * 2.5 * 1.3) = 33 (32.5 rounds to 33)
    })

    it('increases ease by 0.15', () => {
      const card = makeReviewCard({ ease: 2.5 })
      const result = rateReviewCard(card, 4)
      expect(result.ease).toBeCloseTo(2.65)
    })

    it('sets due date based on new interval', () => {
      const card = makeReviewCard({ interval: 10, ease: 2.5 })
      const result = rateReviewCard(card, 4)
      expect(result.due).toBe(addDays(today(), 33))
    })
  })
})

describe('rateCard', () => {
  it('delegates learning cards to rateLearningCard', () => {
    const card = makeLearningCard()
    const result = rateCard(card, 3)
    expect(result.reps).toBe(1)
    // step 0 + Good => step 1, still learning
    expect(result.step).toBe(1)
    expect(result.state).toBe('learning')
  })

  it('delegates relearning cards to rateLearningCard', () => {
    const card = makeRelearningCard({ step: 1 })
    const result = rateCard(card, 3)
    // step 1 + Good => graduates
    expect(result.state).toBe('review')
  })

  it('delegates review cards to rateReviewCard', () => {
    const card = makeReviewCard({ interval: 10, ease: 2.5 })
    const result = rateCard(card, 3)
    expect(result.interval).toBe(25)
  })

  it('throws for known cards', () => {
    const card: SrsCard = { ...makeLearningCard(), state: 'known' }
    expect(() => rateCard(card, 3)).toThrow('marked as known')
  })
})

describe('markKnown', () => {
  it('marks a learning card as known', () => {
    const card = makeLearningCard()
    const result = markKnown(card)
    expect(result.state).toBe('known')
    expect(result.previousState).toBe('learning')
  })

  it('marks a review card as known and saves previous state', () => {
    const card = makeReviewCard()
    const result = markKnown(card)
    expect(result.state).toBe('known')
    expect(result.previousState).toBe('review')
  })

  it('marks a relearning card as known', () => {
    const card = makeRelearningCard()
    const result = markKnown(card)
    expect(result.state).toBe('known')
    expect(result.previousState).toBe('relearning')
  })

  it('returns same card if already known', () => {
    const card: SrsCard = { ...makeLearningCard(), state: 'known' }
    const result = markKnown(card)
    expect(result).toBe(card) // same reference
  })

  it('does not mutate original card', () => {
    const card = makeLearningCard()
    const result = markKnown(card)
    expect(card.state).toBe('learning')
    expect(result.state).toBe('known')
  })
})

describe('unmarkKnown', () => {
  it('restores previous state', () => {
    const card: SrsCard = {
      ...makeLearningCard(),
      state: 'known',
      previousState: 'review',
    }
    const result = unmarkKnown(card)
    expect(result).not.toBeNull()
    expect(result!.state).toBe('review')
    expect(result!).not.toHaveProperty('previousState')
  })

  it('returns null if no previous state (created as known)', () => {
    const card = createKnownCard(1)
    const result = unmarkKnown(card)
    expect(result).toBeNull()
  })

  it('returns card unchanged if not known', () => {
    const card = makeLearningCard()
    const result = unmarkKnown(card)
    expect(result).toBe(card)
  })

  it('round-trips: markKnown then unmarkKnown restores state', () => {
    const card = makeReviewCard()
    const known = markKnown(card)
    const restored = unmarkKnown(known)
    expect(restored).not.toBeNull()
    expect(restored!.state).toBe('review')
  })
})

describe('computeStats', () => {
  it('computes correct counts for mixed cards', () => {
    const cards: SrsCard[] = [
      makeLearningCard({ wordId: 1 }),
      makeLearningCard({ wordId: 2 }),
      makeReviewCard({ wordId: 3, interval: 5 }),
      makeReviewCard({ wordId: 4, interval: 25 }), // mastered (>=21)
      makeRelearningCard({ wordId: 5 }),
      { ...makeLearningCard({ wordId: 6 }), state: 'known' as const },
    ]

    const stats = computeStats(cards, 100, {})
    expect(stats.totalLearning).toBe(3) // 2 learning + 1 relearning
    expect(stats.totalReview).toBe(1) // interval 5
    expect(stats.totalMastered).toBe(1) // interval 25
    expect(stats.totalKnown).toBe(1)
    expect(stats.totalStarted).toBe(5) // 6 cards - 1 known
    expect(stats.unseenWords).toBe(94) // 100 - 5 started - 1 known
    expect(stats.deckSize).toBe(5) // 6 - 1 known
    expect(stats.totalWords).toBe(100)
  })

  it('reads today history for todayReviewed and todayLearned', () => {
    const todayStr = today()
    const history: Record<string, SrsHistory> = {
      [todayStr]: { reviewed: 15, learned: 3 },
    }
    const stats = computeStats([], 50, history)
    expect(stats.todayReviewed).toBe(15)
    expect(stats.todayLearned).toBe(3)
  })

  it('defaults to 0 for today if no history', () => {
    const stats = computeStats([], 50, {})
    expect(stats.todayReviewed).toBe(0)
    expect(stats.todayLearned).toBe(0)
  })

  it('computes streak from consecutive days', () => {
    const d = new Date()
    const todayStr = formatDate(d)
    const yesterdayDate = new Date(d)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = formatDate(yesterdayDate)
    const twoDaysAgoDate = new Date(d)
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2)
    const twoDaysAgoStr = formatDate(twoDaysAgoDate)

    const history: Record<string, SrsHistory> = {
      [todayStr]: { reviewed: 5, learned: 1 },
      [yesterdayStr]: { reviewed: 3, learned: 0 },
      [twoDaysAgoStr]: { reviewed: 10, learned: 2 },
    }
    const stats = computeStats([], 50, history)
    expect(stats.streak).toBe(3)
  })

  it('streak is 0 if no review today', () => {
    const stats = computeStats([], 50, {})
    expect(stats.streak).toBe(0)
  })

  it('streak breaks on gap', () => {
    const d = new Date()
    const todayStr = formatDate(d)
    // Skip yesterday, have 2 days ago
    const twoDaysAgoDate = new Date(d)
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2)
    const twoDaysAgoStr = formatDate(twoDaysAgoDate)

    const history: Record<string, SrsHistory> = {
      [todayStr]: { reviewed: 5, learned: 1 },
      [twoDaysAgoStr]: { reviewed: 10, learned: 2 },
    }
    const stats = computeStats([], 50, history)
    expect(stats.streak).toBe(1) // only today
  })
})

describe('buildQueue', () => {
  it('returns empty queue when no cards', () => {
    const q = buildQueue([])
    expect(q.learning).toEqual([])
    expect(q.review).toEqual([])
    expect(q.total).toBe(0)
  })

  it('excludes known cards', () => {
    const cards: SrsCard[] = [
      { ...makeLearningCard(), state: 'known' as const },
    ]
    const q = buildQueue(cards)
    expect(q.total).toBe(0)
  })

  it('separates learning and review cards', () => {
    const cards: SrsCard[] = [
      makeLearningCard({ wordId: 1, dueTimestamp: Date.now() - 1000 }),
      makeReviewCard({ wordId: 2, due: today() }),
      makeRelearningCard({ wordId: 3, dueTimestamp: Date.now() - 1000 }),
    ]
    const q = buildQueue(cards)
    expect(q.learning.length).toBe(2) // learning + relearning
    expect(q.review.length).toBe(1)
    expect(q.total).toBe(3)
  })

  it('excludes cards not yet due', () => {
    const cards: SrsCard[] = [
      makeLearningCard({ wordId: 1, dueTimestamp: Date.now() + 60_000_000 }),
      makeReviewCard({ wordId: 2, due: addDays(today(), 5) }),
    ]
    const q = buildQueue(cards)
    expect(q.total).toBe(0)
  })

  it('sorts learning cards by dueTimestamp ascending', () => {
    const cards: SrsCard[] = [
      makeLearningCard({ wordId: 2, dueTimestamp: Date.now() - 1000 }),
      makeLearningCard({ wordId: 1, dueTimestamp: Date.now() - 5000 }),
      makeLearningCard({ wordId: 3, dueTimestamp: Date.now() - 3000 }),
    ]
    const q = buildQueue(cards)
    expect(q.learning.map(c => c.wordId)).toEqual([1, 3, 2])
  })

  it('sorts review cards by due date ascending', () => {
    const cards: SrsCard[] = [
      makeReviewCard({ wordId: 2, due: today() }),
      makeReviewCard({ wordId: 1, due: '2020-01-01' }),
      makeReviewCard({ wordId: 3, due: '2023-06-15' }),
    ]
    const q = buildQueue(cards)
    expect(q.review.map(c => c.wordId)).toEqual([1, 3, 2])
  })
})

describe('SM-2 algorithm integration', () => {
  it('full learning → review lifecycle', () => {
    let card = createNewCard(1)
    expect(card.state).toBe('learning')
    expect(card.step).toBe(0)

    // Good at step 0 → step 1
    card = rateCard(card, 3)
    expect(card.state).toBe('learning')
    expect(card.step).toBe(1)

    // Good at step 1 → graduate to review
    card = rateCard(card, 3)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(GRADUATING_INTERVAL)
    expect(card.reps).toBe(2)
  })

  it('review → relearning → review cycle', () => {
    let card = makeReviewCard({ interval: 10, ease: 2.5 })

    // Fail review → relearning
    card = rateCard(card, 1)
    expect(card.state).toBe('relearning')
    expect(card.lapses).toBe(1)
    expect(card.interval).toBe(5) // 10 * 0.5
    expect(card.ease).toBeCloseTo(2.3)

    // Good at step 0 → step 1
    card = rateCard(card, 3)
    expect(card.state).toBe('relearning')
    expect(card.step).toBe(1)

    // Good at step 1 → graduate back to review
    card = rateCard(card, 3)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(GRADUATING_INTERVAL)
  })

  it('ease factor decreases on failures but never below MIN_EASE', () => {
    let card = makeReviewCard({ interval: 10, ease: 1.5 })

    // Fail multiple times
    card = rateCard(card, 1)
    expect(card.ease).toBe(MIN_EASE) // 1.5 - 0.2 = 1.3

    // Re-graduate
    card = rateCard(card, 4) // Easy to graduate quickly
    expect(card.state).toBe('review')

    // Fail again
    card = rateCard(card, 1)
    expect(card.ease).toBe(MIN_EASE) // stays at floor
  })

  it('Easy rating fast-tracks through learning', () => {
    let card = createNewCard(1)

    // Easy at step 0 → immediate graduation with EASY_INTERVAL
    card = rateCard(card, 4)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(EASY_INTERVAL)
    expect(card.ease).toBeCloseTo(DEFAULT_EASE + 0.15)
  })

  it('interval grows with consecutive Good reviews', () => {
    let card = makeReviewCard({ interval: 1, ease: 2.5 })
    const intervals: number[] = []

    for (let i = 0; i < 5; i++) {
      card = rateReviewCard(card, 3)
      intervals.push(card.interval)
    }

    // Each interval should be previous * 2.5
    // 1*2.5=3, 3*2.5=8, 8*2.5=20, 20*2.5=50, 50*2.5=125
    expect(intervals).toEqual([3, 8, 20, 50, 125])
  })

  it('immutability: original card is not mutated', () => {
    const original = createNewCard(1)
    const originalCopy = { ...original }
    rateCard(original, 3)
    expect(original).toEqual(originalCopy)
  })
})
