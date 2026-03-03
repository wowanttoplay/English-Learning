import type { SrsCard, SrsStats, DueCount, CardQueue, Rating, Word } from '@/types'
import { DEFAULT_EASE, MASTERED_INTERVAL, today, now, isDue, initCard, formatDate, rateLearningCard, rateReviewCard } from './srs-engine'
import { peekData, withData } from './srs-storage'

// --- Rating orchestrator ---

export function rateCard(wordId: number, rating: Rating): SrsCard {
  return withData(data => {
    if (!data.cards[wordId]) {
      data.cards[wordId] = initCard(wordId)
    }

    const card = data.cards[wordId]
    const prevState = card.state

    switch (card.state) {
      case 'new':
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
    if (prevState === 'new') {
      data.history[todayStr].learned++
    }

    return card
  })
}

// --- Queue generation ---

export function getCardsForToday(wordList: Word[]): CardQueue {
  const data = peekData()
  const todayStr = today()

  const learnedToday = (data.history[todayStr] || { learned: 0 }).learned || 0
  const newCardsRemaining = Math.max(0, data.settings.newCardsPerDay - learnedToday)

  const reviewCards: SrsCard[] = []
  const learningCards: SrsCard[] = []

  for (const id in data.cards) {
    const card = data.cards[id]
    if (card.state === 'review' && isDue(card)) {
      reviewCards.push(card)
    } else if ((card.state === 'learning' || card.state === 'relearning') && isDue(card)) {
      learningCards.push(card)
    }
  }

  const newCards: SrsCard[] = []
  if (newCardsRemaining > 0) {
    let count = 0

    // Priority: user-added words from reading
    const userAdded = data.settings.userAddedWords || []
    for (const wordId of userAdded) {
      if (count >= newCardsRemaining) break
      if (data.cards[wordId]) continue
      newCards.push({
        wordId,
        state: 'new',
        ease: DEFAULT_EASE,
        interval: 0,
        due: todayStr,
        dueTimestamp: now(),
        reps: 0,
        lapses: 0,
        step: 0
      })
      count++
    }

    // Fill remaining slots with topic-filtered sequential intro
    const active = data.settings.activeTopics || []
    const filterByTopic = active.length > 0
    const activeSet = filterByTopic ? new Set(active) : null

    for (let i = 0; i < wordList.length && count < newCardsRemaining; i++) {
      const word = wordList[i]
      if (data.cards[word.id]) continue
      if (newCards.some(c => c.wordId === word.id)) continue
      if (filterByTopic) {
        const topics = word.topics || []
        if (!topics.some(t => activeSet!.has(t))) continue
      }
      newCards.push({
        wordId: word.id,
        state: 'new',
        ease: DEFAULT_EASE,
        interval: 0,
        due: todayStr,
        dueTimestamp: now(),
        reps: 0,
        lapses: 0,
        step: 0
      })
      count++
    }
  }

  learningCards.sort((a, b) => a.dueTimestamp - b.dueTimestamp)
  reviewCards.sort((a, b) => (a.due > b.due ? 1 : -1))

  return {
    learning: learningCards,
    review: reviewCards,
    new: newCards,
    total: learningCards.length + reviewCards.length + newCards.length
  }
}

export function getDueCount(wordList: Word[]): DueCount {
  const cards = getCardsForToday(wordList)
  return {
    learning: cards.learning.length,
    review: cards.review.length,
    new: cards.new.length,
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

  for (const id in data.cards) {
    const card = data.cards[id]
    switch (card.state) {
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

  const totalStarted = Object.keys(data.cards).length
  const unseenWords = totalWords - totalStarted

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
    streak,
    newCardsPerDay: data.settings.newCardsPerDay
  }
}
