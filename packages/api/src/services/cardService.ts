import type { SrsCard, Rating, SrsStats, SrsHistory, CardQueue } from '@english-learning/shared'
import {
  createNewCard, createKnownCard, rateCard as engineRateCard,
  markKnown as engineMarkKnown, unmarkKnown as engineUnmarkKnown,
  computeStats, buildQueue, today
} from '@english-learning/shared'
import { getCardsByUser, getCardByUserAndWord, upsertCardStatement, insertReviewLogStatement, deleteCard } from '../db/queries/cards'
import { getHistoryByUser, incrementReviewedStatement, incrementLearnedStatement } from '../db/queries/history'

const EASE_MULTIPLIER = 1000
const fromDbEase = (ease: number) => ease / EASE_MULTIPLIER
const toDbEase = (ease: number) => Math.round(ease * EASE_MULTIPLIER)

function cardsFromDb(cards: SrsCard[]): SrsCard[] {
  return cards.map(c => ({ ...c, ease: fromDbEase(c.ease) }))
}

function cardToDb(card: SrsCard): SrsCard {
  return { ...card, ease: toDbEase(card.ease) }
}

export interface CardsWithStats {
  cards: SrsCard[]
  queue: CardQueue
  stats: SrsStats
  history: Record<string, SrsHistory>
}

export async function getAllCardsWithStats(
  db: D1Database, userId: number, totalWords: number
): Promise<CardsWithStats> {
  const [rawCards, history] = await Promise.all([
    getCardsByUser(db, userId),
    getHistoryByUser(db, userId),
  ])
  const cards = cardsFromDb(rawCards)
  const stats = computeStats(cards, totalWords, history)
  const queue = buildQueue(cards)
  return { cards, queue, stats, history }
}

export async function addCard(
  db: D1Database, userId: number, wordId: number
): Promise<SrsCard> {
  const existing = await getCardByUserAndWord(db, userId, wordId)
  if (existing) {
    return { ...existing, ease: fromDbEase(existing.ease) }
  }

  const card = createNewCard(wordId)
  const dbCard = cardToDb(card)
  const dateStr = today()

  await db.batch([
    upsertCardStatement(db, userId, dbCard),
    incrementLearnedStatement(db, userId, dateStr),
  ])

  return card
}

export async function rateCardAction(
  db: D1Database, userId: number, wordId: number, rating: Rating
): Promise<SrsCard> {
  const raw = await getCardByUserAndWord(db, userId, wordId)
  if (!raw) throw new Error('Card not found')

  const card = { ...raw, ease: fromDbEase(raw.ease) }

  if (card.state === 'known') {
    throw new Error('Cannot rate a known card')
  }

  const updated = engineRateCard(card, rating)
  const dbCard = cardToDb(updated)
  const dateStr = today()

  await db.batch([
    upsertCardStatement(db, userId, dbCard),
    insertReviewLogStatement(db, userId, wordId, rating, updated.state, dbCard.ease, dbCard.interval),
    incrementReviewedStatement(db, userId, dateStr),
  ])

  return updated
}

export async function markKnownAction(
  db: D1Database, userId: number, wordId: number, known: boolean
): Promise<{ action: 'marked' | 'unmarked' | 'deleted' }> {
  if (known) {
    const existing = await getCardByUserAndWord(db, userId, wordId)
    if (existing) {
      const card = { ...existing, ease: fromDbEase(existing.ease) }
      const knownCard = engineMarkKnown(card)
      await db.batch([upsertCardStatement(db, userId, cardToDb(knownCard))])
    } else {
      const card = createKnownCard(wordId)
      await db.batch([upsertCardStatement(db, userId, cardToDb(card))])
    }
    return { action: 'marked' }
  } else {
    const existing = await getCardByUserAndWord(db, userId, wordId)
    if (!existing) throw new Error('Card not found')
    const card = { ...existing, ease: fromDbEase(existing.ease) }
    const result = engineUnmarkKnown(card)
    if (result === null) {
      await deleteCard(db, userId, wordId)
      return { action: 'deleted' }
    } else {
      await db.batch([upsertCardStatement(db, userId, cardToDb(result))])
      return { action: 'unmarked' }
    }
  }
}
