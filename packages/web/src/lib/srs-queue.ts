import type { SrsCard, SrsStats, DueCount, CardQueue, Rating, Word } from '@/types'
import { MASTERED_INTERVAL, today, isDue, formatDate, rateLearningCard, rateReviewCard } from './srs-engine'
import { peekData, withData } from './srs-storage'

// --- Rating orchestrator ---

export function rateCard(wordId: number, rating: Rating): SrsCard {
  return withData(data => {
    const card = data.cards[wordId]
    if (!card) throw new Error(`Card ${wordId} not in deck`)
    if (card.state === 'known') throw new Error(`Card ${wordId} is marked as known and cannot be rated`)

    switch (card.state) {
      case 'learning':
      case 'relearning':
        rateLearningCard(card, rating)
        break
      case 'review':
        rateReviewCard(card, rating)
        break
    }

    card.reps++

    const todayStr = today()
    if (!data.history[todayStr]) {
      data.history[todayStr] = { reviewed: 0, learned: 0 }
    }
    data.history[todayStr].reviewed++

    return card
  })
}

// --- Queue generation ---

export function getCardsForToday(_wordList: Word[]): CardQueue {
  const data = peekData()

  const reviewCards: SrsCard[] = []
  const learningCards: SrsCard[] = []

  for (const id in data.cards) {
    const card = data.cards[id]
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
    total: learningCards.length + reviewCards.length
  }
}

export function getDueCount(wordList: Word[]): DueCount {
  const cards = getCardsForToday(wordList)
  return {
    learning: cards.learning.length,
    review: cards.review.length,
    total: cards.total
  }
}

// --- Statistics ---

export function getStats(totalWords: number): SrsStats {
  const data = peekData()
  const todayStr = today()
  const todayHistory = data.history[todayStr] || { reviewed: 0, learned: 0 }

  let totalLearning = 0
  let totalReview = 0
  let totalMastered = 0
  let totalKnown = 0

  for (const id in data.cards) {
    const card = data.cards[id]
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

  const totalStarted = Object.keys(data.cards).length - totalKnown
  const unseenWords = totalWords - totalStarted - totalKnown

  let streak = 0
  const d = new Date()
  while (true) {
    const dateStr = formatDate(d)
    if (data.history[dateStr] && data.history[dateStr].reviewed > 0) {
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
    deckSize: Object.keys(data.cards).length - totalKnown
  }
}
