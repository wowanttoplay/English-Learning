import type { SrsCard, Rating } from '@/types'

// --- Constants ---

export const LEARNING_STEPS = [1, 10] // minutes
export const GRADUATING_INTERVAL = 1 // days
export const EASY_INTERVAL = 4 // days
export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MASTERED_INTERVAL = 21 // days

// --- Date helpers ---

export function formatDate(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function today(): string {
  return formatDate(new Date())
}

export function now(): number {
  return Date.now()
}

export function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000)
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function isDue(card: SrsCard): boolean {
  if (card.state === 'learning' || card.state === 'relearning') {
    return now() >= card.dueTimestamp
  }
  return card.due <= today()
}

// --- SM-2 Rating Logic ---

export function graduateCard(card: SrsCard, interval: number): void {
  card.state = 'review'
  card.interval = interval
  card.due = addDays(today(), interval)
  card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime()
  card.step = 0
}

export function rateLearningCard(card: SrsCard, rating: Rating): void {
  if (rating === 1) {
    card.step = 0
    card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[0]).getTime()
    card.due = today()
  } else if (rating === 2) {
    const stepMinutes = LEARNING_STEPS[card.step] || LEARNING_STEPS[LEARNING_STEPS.length - 1]
    card.dueTimestamp = addMinutes(new Date(), stepMinutes).getTime()
    card.due = today()
  } else if (rating === 3) {
    card.step++
    if (card.step >= LEARNING_STEPS.length) {
      graduateCard(card, GRADUATING_INTERVAL)
    } else {
      card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[card.step]).getTime()
      card.due = today()
    }
  } else if (rating === 4) {
    graduateCard(card, EASY_INTERVAL)
    card.ease += 0.15
  }
}

export function rateReviewCard(card: SrsCard, rating: Rating): void {
  if (rating === 1) {
    card.lapses++
    card.state = 'relearning'
    card.step = 0
    card.interval = Math.max(1, Math.round(card.interval * 0.5))
    card.ease = Math.max(MIN_EASE, card.ease - 0.20)
    card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[0]).getTime()
    card.due = today()
  } else if (rating === 2) {
    card.interval = Math.max(1, Math.round(card.interval * 1.2))
    card.ease = Math.max(MIN_EASE, card.ease - 0.15)
    card.due = addDays(today(), card.interval)
    card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime()
  } else if (rating === 3) {
    card.interval = Math.max(1, Math.round(card.interval * card.ease))
    card.due = addDays(today(), card.interval)
    card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime()
  } else if (rating === 4) {
    card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3))
    card.ease += 0.15
    card.due = addDays(today(), card.interval)
    card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime()
  }
}
