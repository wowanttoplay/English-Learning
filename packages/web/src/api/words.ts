import { apiFetch } from './client'
import type { Word, PaginatedResponse } from '@/types'

interface GetWordsOpts {
  lang: string
  level?: string
  topic?: string
  page?: number
  pageSize?: number
  locales?: string[]
}

export async function getWords(opts: GetWordsOpts): Promise<PaginatedResponse<Word>> {
  const params = new URLSearchParams({ lang: opts.lang })
  if (opts.level) params.set('level', opts.level)
  if (opts.topic) params.set('topic', opts.topic)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize))
  if (opts.locales?.length) params.set('locales', opts.locales.join(','))
  return apiFetch(`/api/words?${params}`)
}

export async function getWordById(id: number, locales?: string[]): Promise<Word> {
  const params = locales?.length ? `?locales=${locales.join(',')}` : ''
  return apiFetch(`/api/words/${id}${params}`)
}
