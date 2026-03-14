import { apiFetch } from './client'
import type { Word } from '@/types'

export async function getUserWords(lang: string): Promise<{ items: Word[] }> {
  return apiFetch(`/api/user-words?lang=${lang}`)
}

export async function createUserWord(data: {
  languageId: string
  word: string
  pos?: string
  phonetic?: string
  translations?: Record<string, string>
  examples?: string[]
  topics?: string[]
}): Promise<Word> {
  return apiFetch('/api/user-words', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
