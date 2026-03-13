import { apiFetch } from './client'
import type { Passage } from '@/types'

interface GetPassagesOpts {
  lang: string
  level?: string
  topic?: string
  page?: number
  pageSize?: number
}

export async function getPassages(opts: GetPassagesOpts): Promise<{ items: Passage[]; total: number }> {
  const params = new URLSearchParams({ lang: opts.lang })
  if (opts.level) params.set('level', opts.level)
  if (opts.topic) params.set('topic', opts.topic)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize))
  return apiFetch(`/api/passages?${params}`)
}

export async function getPassageById(id: number): Promise<{ passage: Passage; words: import('@/types').Word[] }> {
  return apiFetch(`/api/passages/${id}`)
}

export async function getPassagesRead(): Promise<{ items: number[] }> {
  return apiFetch('/api/user/passages-read')
}

export async function markPassageRead(passageId: number): Promise<void> {
  return apiFetch(`/api/user/passages-read/${passageId}`, { method: 'POST' })
}
