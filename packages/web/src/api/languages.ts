import { apiFetch } from './client'
import type { Language } from '@/types'

export async function getLanguages(): Promise<{ items: Language[] }> {
  return apiFetch('/api/languages')
}
