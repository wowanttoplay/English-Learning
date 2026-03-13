import { apiFetch } from './client'
import type { SrsCard, SrsStats, SrsHistory, CardQueue, Rating } from '@/types'

export interface CardsResponse {
  cards: SrsCard[]
  queue: CardQueue
  stats: SrsStats
  history: Record<string, SrsHistory>
}

export async function getCards(lang?: string): Promise<CardsResponse> {
  const params = lang ? `?lang=${lang}` : ''
  return apiFetch(`/api/cards${params}`)
}

export async function addCard(wordId: number): Promise<SrsCard> {
  return apiFetch('/api/cards/add', {
    method: 'POST',
    body: JSON.stringify({ wordId }),
  })
}

export async function rateCard(wordId: number, rating: Rating): Promise<SrsCard> {
  return apiFetch('/api/cards/rate', {
    method: 'POST',
    body: JSON.stringify({ wordId, rating }),
  })
}

export async function markKnown(wordId: number, known: boolean): Promise<{ action: string }> {
  return apiFetch(`/api/cards/${wordId}/known`, {
    method: 'PATCH',
    body: JSON.stringify({ known }),
  })
}
