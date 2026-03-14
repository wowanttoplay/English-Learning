import type { UserSettings } from '@english-learning/shared'

interface SettingsRow {
  user_id: number
  current_language: string
  settings: string
}

const DEFAULT_SETTINGS: UserSettings = {
  currentLanguage: 'en',
  audioAutoPlay: false,
  selectedLocales: [],
}

export async function getSettings(
  db: D1Database, userId: number
): Promise<UserSettings> {
  const row = await db
    .prepare('SELECT * FROM user_settings WHERE user_id = ?')
    .bind(userId)
    .first<SettingsRow>()

  if (!row) return DEFAULT_SETTINGS

  const extra = JSON.parse(row.settings || '{}')
  return {
    currentLanguage: row.current_language,
    audioAutoPlay: extra.audioAutoPlay ?? false,
    selectedLocales: extra.selectedLocales ?? [],
  }
}

export async function saveSettings(
  db: D1Database, userId: number, settings: UserSettings
): Promise<void> {
  const extra = JSON.stringify({
    audioAutoPlay: settings.audioAutoPlay,
    selectedLocales: settings.selectedLocales,
  })
  await db
    .prepare(`INSERT INTO user_settings (user_id, current_language, settings, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT (user_id) DO UPDATE SET
        current_language = excluded.current_language,
        settings = excluded.settings,
        updated_at = excluded.updated_at`)
    .bind(userId, settings.currentLanguage, extra)
    .run()
}
