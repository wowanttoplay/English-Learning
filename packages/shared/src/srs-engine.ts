import type { SrsCard, Rating, SrsStats, SrsHistory, CardQueue } from './types'
import { today, now, addMinutes, addDays, formatDate } from './date-utils'

// --- Constants ---

export const LEARNING_STEPS = [1, 10] // minutes
export const GRADUATING_INTERVAL = 1 // days
export const EASY_INTERVAL = 4 // days
export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MASTERED_INTERVAL = 21 // days

// --- Due check ---

export function isDue(card: SrsCard): boolean {
  if (card.state === 'learning' || card.state === 'relearning') {
    return now() >= card.dueTimestamp
  }
  return card.due <= today()
}

// --- Pure helpers ---

function graduated(card: SrsCard, interval: number): SrsCard {
  const due = addDays(today(), interval)
  return {
    ...card,
    state: 'review' as const,
    interval,
    due,
    dueTimestamp: new Date(due + 'T00:00:00').getTime(),
    step: 0,
  }
}

// --- SM-2 Rating Logic (pure, immutable) ---

export function rateLearningCard(card: SrsCard, rating: Rating): SrsCard {
  if (rating === 1) {
    return {
      ...card,
      step: 0,
      dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[0]).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  } else if (rating === 2) {
    const stepMinutes = LEARNING_STEPS[card.step] || LEARNING_STEPS[LEARNING_STEPS.length - 1]
    return {
      ...card,
      dueTimestamp: addMinutes(new Date(), stepMinutes).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  } else if (rating === 3) {
    const newStep = card.step + 1
    if (newStep >= LEARNING_STEPS.length) {
      return {
        ...graduated(card, GRADUATING_INTERVAL),
        reps: card.reps + 1,
      }
    } else {
      return {
        ...card,
        step: newStep,
        dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[newStep]).getTime(),
        due: today(),
        reps: card.reps + 1,
      }
    }
  } else {
    // rating === 4
    return {
      ...graduated(card, EASY_INTERVAL),
      ease: card.ease + 0.15,
      reps: card.reps + 1,
    }
  }
}

export function rateReviewCard(card: SrsCard, rating: Rating): SrsCard {
  if (rating === 1) {
    const newInterval = Math.max(1, Math.round(card.interval * 0.5))
    return {
      ...card,
      lapses: card.lapses + 1,
      state: 'relearning' as const,
      step: 0,
      interval: newInterval,
      ease: Math.max(MIN_EASE, card.ease - 0.20),
      dueTimestamp: addMinutes(new Date(), LEARNING_STEPS[0]).getTime(),
      due: today(),
      reps: card.reps + 1,
    }
  } else if (rating === 2) {
    const newInterval = Math.max(1, Math.round(card.interval * 1.2))
    const due = addDays(today(), newInterval)
    return {
      ...card,
      interval: newInterval,
      ease: Math.max(MIN_EASE, card.ease - 0.15),
      due,
      dueTimestamp: new Date(due + 'T00:00:00').getTime(),
      reps: card.reps + 1,
    }
  } else if (rating === 3) {
    const newInterval = Math.max(1, Math.round(card.interval * card.ease))
    const due = addDays(today(), newInterval)
    return {
      ...card,
      interval: newInterval,
      due,
      dueTimestamp: new Date(due + 'T00:00:00').getTime(),
      reps: card.reps + 1,
    }
  } else {
    // rating === 4
    const newInterval = Math.max(1, Math.round(card.interval * card.ease * 1.3))
    const due = addDays(today(), newInterval)
    return {
      ...card,
      interval: newInterval,
      ease: card.ease + 0.15,
      due,
      dueTimestamp: new Date(due + 'T00:00:00').getTime(),
      reps: card.reps + 1,
    }
  }
}

export function rateCard(card: SrsCard, rating: Rating): SrsCard {
  if (card.state === 'known') {
    throw new Error(`Card ${card.wordId} is marked as known and cannot be rated`)
  }
  if (card.state === 'learning' || card.state === 'relearning') {
    return rateLearningCard(card, rating)
  }
  return rateReviewCard(card, rating)
}

// --- Card creation (pure) ---

export function createNewCard(wordId: number): SrsCard {
  return {
    wordId,
    state: 'learning',
    ease: DEFAULT_EASE,
    interval: 0,
    due: today(),
    dueTimestamp: now(),
    reps: 0,
    lapses: 0,
    step: 0,
  }
}

export function createKnownCard(wordId: number): SrsCard {
  return {
    wordId,
    state: 'known',
    ease: DEFAULT_EASE,
    interval: 0,
    due: today(),
    dueTimestamp: now(),
    reps: 0,
    lapses: 0,
    step: 0,
  }
}

// --- Mark as known (pure) ---

export function markKnown(card: SrsCard): SrsCard {
  if (card.state === 'known') return card
  return {
    ...card,
    state: 'known' as const,
    previousState: card.state as 'learning' | 'review' | 'relearning',
  }
}

export function unmarkKnown(card: SrsCard): SrsCard | null {
  if (card.state !== 'known') return card
  if (card.previousState) {
    const { previousState, ...rest } = card
    return {
      ...rest,
      state: previousState,
    }
  }
  // No previous state means it was created directly as known — should be deleted
  return null
}

// --- Statistics (pure) ---

export function computeStats(
  cards: SrsCard[],
  totalWords: number,
  history: Record<string, SrsHistory>
): SrsStats {
  const todayStr = today()
  const todayHistory = history[todayStr] || { reviewed: 0, learned: 0 }

  let totalLearning = 0
  let totalReview = 0
  let totalMastered = 0
  let totalKnown = 0

  for (const card of cards) {
    switch (card.state) {
      case 'known':
        totalKnown++
        break
      case 'learning':
      case 'relearning':
        totalLearning++
        break
      case 'review':
        if (card.interval >= MASTERED_INTERVAL) {
          totalMastered++
        } else {
          totalReview++
        }
        break
    }
  }

  const totalStarted = cards.length - totalKnown
  const unseenWords = totalWords - totalStarted - totalKnown

  let streak = 0
  const d = new Date()
  while (true) {
    const dateStr = formatDate(d)
    if (history[dateStr] && history[dateStr].reviewed > 0) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return {
    todayReviewed: todayHistory.reviewed,
    todayLearned: todayHistory.learned,
    totalWords,
    totalStarted,
    unseenWords,
    totalLearning,
    totalReview,
    totalMastered,
    totalKnown,
    streak,
    deckSize: cards.length - totalKnown,
  }
}

// --- Queue building (pure) ---

export function buildQueue(cards: SrsCard[]): CardQueue {
  const learningCards: SrsCard[] = []
  const reviewCards: SrsCard[] = []

  for (const card of cards) {
    if (card.state === 'known') continue
    if (card.state === 'review' && isDue(card)) {
      reviewCards.push(card)
    } else if ((card.state === 'learning' || card.state === 'relearning') && isDue(card)) {
      learningCards.push(card)
    }
  }

  learningCards.sort((a, b) => a.dueTimestamp - b.dueTimestamp)
  reviewCards.sort((a, b) => (a.due > b.due ? 1 : -1))

  return {
    learning: learningCards,
    review: reviewCards,
    total: learningCards.length + reviewCards.length,
  }
}
