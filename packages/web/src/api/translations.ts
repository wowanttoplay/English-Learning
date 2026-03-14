import { apiFetch } from './client'

export interface LocaleInfo {
  locale: string
  name: string
}

export async function getAvailableLocales(lang: string): Promise<LocaleInfo[]> {
  return apiFetch<LocaleInfo[]>(`/api/translations/locales?lang=${lang}`)
}
