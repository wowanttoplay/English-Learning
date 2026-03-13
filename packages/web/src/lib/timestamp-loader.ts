import type { SentenceTimestamp } from '../types'

const cache = new Map<number, SentenceTimestamp[]>()

function getAudioBase(): string {
  return import.meta.env.VITE_AUDIO_BASE_URL || (import.meta.env.BASE_URL + 'audio')
}

async function loadTimestamps(passageId: number): Promise<SentenceTimestamp[]> {
  if (passageId <= 0) return []

  const cached = cache.get(passageId)
  if (cached) return cached

  const url = `${getAudioBase()}/passages/passage-${passageId}.timestamps.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data: SentenceTimestamp[] = await res.json()
    cache.set(passageId, data)
    return data
  } catch {
    return []
  }
}

function getCached(passageId: number): SentenceTimestamp[] | undefined {
  return cache.get(passageId)
}

function clearCache(): void {
  cache.clear()
}

export const TimestampLoader = { loadTimestamps, getCached, clearCache }
