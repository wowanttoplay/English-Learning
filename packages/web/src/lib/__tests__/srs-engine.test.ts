import { describe, it, expect } from 'vitest'
import {
  formatDate,
  today,
  addDays,
  addMinutes,
  rateLearningCard,
  rateReviewCard,
  DEFAULT_EASE,
  MIN_EASE,
  GRADUATING_INTERVAL,
  EASY_INTERVAL,
  LEARNING_STEPS
} from '@/lib/srs-engine'
import type { SrsCard } from '@/types'

function makeLearningCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    wordId: 1,
    state: 'learning',
    ease: DEFAULT_EASE,
    interval: 0,
    due: today(),
    dueTimestamp: Date.now(),
    reps: 0,
    lapses: 0,
    step: 0,
    ...overrides
  }
}

function makeReviewCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    wordId: 1,
    state: 'review',
    ease: DEFAULT_EASE,
    interval: 10,
    due: today(),
    dueTimestamp: Date.now(),
    reps: 5,
    lapses: 0,
    step: 0,
    ...overrides
  }
}

// --- formatDate ---

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 5) // Jan 5 2025
    expect(formatDate(d)).toBe('2025-01-05')
  })

  it('pads single-digit month and day', () => {
    const d = new Date(2024, 2, 3) // Mar 3 2024
    expect(formatDate(d)).toBe('2024-03-03')
  })

  it('handles December 31', () => {
    const d = new Date(2024, 11, 31)
    expect(formatDate(d)).toBe('2024-12-31')
  })
})

// --- today ---

describe('today', () => {
  it('returns a string matching YYYY-MM-DD pattern', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// --- addDays ---

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2025-01-28', 5)).toBe('2025-02-02')
  })

  it('handles month boundary', () => {
    expect(addDays('2025-01-31', 1)).toBe('2025-02-01')
  })
})

// --- addMinutes ---

describe('addMinutes', () => {
  it('adds minutes to a date', () => {
    const base = new Date('2025-01-01T10:00:00')
    const result = addMinutes(base, 30)
    expect(result.getTime() - base.getTime()).toBe(30 * 60 * 1000)
  })
})

// --- rateLearningCard ---

describe('rateLearningCard', () => {
  it('rating 1 (Again) resets step to 0', () => {
    const card = makeLearningCard({ step: 1 })
    rateLearningCard(card, 1)
    expect(card.step).toBe(0)
    expect(card.due).toBe(today())
  })

  it('rating 2 (Hard) keeps same step, schedules next review', () => {
    const card = makeLearningCard({ step: 0 })
    const before = Date.now()
    rateLearningCard(card, 2)
    expect(card.step).toBe(0)
    // dueTimestamp should be ~1 minute from now
    expect(card.dueTimestamp).toBeGreaterThanOrEqual(before + LEARNING_STEPS[0] * 60 * 1000 - 1000)
  })

  it('rating 3 (Good) advances step', () => {
    const card = makeLearningCard({ step: 0 })
    rateLearningCard(card, 3)
    expect(card.step).toBe(1)
    expect(card.state).toBe('learning')
  })

  it('rating 3 (Good) at last step graduates card', () => {
    const card = makeLearningCard({ step: LEARNING_STEPS.length - 1 })
    rateLearningCard(card, 3)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(GRADUATING_INTERVAL)
  })

  it('rating 4 (Easy) graduates with easy interval and boosts ease', () => {
    const card = makeLearningCard()
    rateLearningCard(card, 4)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(EASY_INTERVAL)
    expect(card.ease).toBe(DEFAULT_EASE + 0.15)
  })
})

// --- rateReviewCard ---

describe('rateReviewCard', () => {
  it('rating 1 (Again) lapses and moves to relearning', () => {
    const card = makeReviewCard({ interval: 10, ease: 2.5 })
    rateReviewCard(card, 1)
    expect(card.state).toBe('relearning')
    expect(card.lapses).toBe(1)
    expect(card.interval).toBe(5) // 10 * 0.5
    expect(card.ease).toBe(2.3) // 2.5 - 0.20
    expect(card.step).toBe(0)
  })

  it('rating 2 (Hard) decreases ease and slightly increases interval', () => {
    const card = makeReviewCard({ interval: 10, ease: 2.5 })
    rateReviewCard(card, 2)
    expect(card.state).toBe('review')
    expect(card.interval).toBe(12) // round(10 * 1.2)
    expect(card.ease).toBe(2.35) // 2.5 - 0.15
  })

  it('rating 3 (Good) multiplies interval by ease', () => {
    const card = makeReviewCard({ interval: 10, ease: 2.5 })
    rateReviewCard(card, 3)
    expect(card.interval).toBe(25) // round(10 * 2.5)
  })

  it('rating 4 (Easy) multiplies interval by ease * 1.3 and boosts ease', () => {
    const card = makeReviewCard({ interval: 10, ease: 2.5 })
    rateReviewCard(card, 4)
    expect(card.interval).toBe(33) // round(10 * 2.5 * 1.3)
    expect(card.ease).toBe(2.65) // 2.5 + 0.15
  })

  it('ease never drops below MIN_EASE', () => {
    const card = makeReviewCard({ interval: 10, ease: MIN_EASE })
    rateReviewCard(card, 1)
    expect(card.ease).toBe(MIN_EASE)

    const card2 = makeReviewCard({ interval: 10, ease: MIN_EASE })
    rateReviewCard(card2, 2)
    expect(card2.ease).toBe(MIN_EASE)
  })

  it('interval never goes below 1', () => {
    const card = makeReviewCard({ interval: 1, ease: MIN_EASE })
    rateReviewCard(card, 1)
    expect(card.interval).toBeGreaterThanOrEqual(1)
  })
})
