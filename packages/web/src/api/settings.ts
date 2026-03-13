import { apiFetch } from './client'
import type { UserSettings } from '@/types'

export async function getSettings(): Promise<UserSettings> {
  return apiFetch('/api/settings')
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
