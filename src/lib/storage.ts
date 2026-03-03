import type { SrsData, DictEntry, AudioSettings } from '@/types'

// --- Storage keys ---

const KEYS = {
  SRS_DATA: 'srs_data',
  DICT_CACHE: 'dict_cache',
  THEME: 'theme',
  SETTINGS_AUDIO: 'settings_audio',
  PASSAGES_READ: 'passages_read',
} as const

// --- Generic helpers ---

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`Failed to save ${key}:`, e)
  }
}

function remove(key: string): void {
  localStorage.removeItem(key)
}

function loadString(key: string): string | null {
  return localStorage.getItem(key)
}

function saveString(key: string, value: string): void {
  localStorage.setItem(key, value)
}

// --- SRS data ---

function loadSrsData(fallback: SrsData): SrsData {
  return loadJson(KEYS.SRS_DATA, fallback)
}

function saveSrsData(data: SrsData): void {
  saveJson(KEYS.SRS_DATA, data)
}

function removeSrsData(): void {
  remove(KEYS.SRS_DATA)
}

// --- Dict cache ---

function loadDictCache(): Record<string, DictEntry> {
  return loadJson(KEYS.DICT_CACHE, {})
}

function saveDictCache(cache: Record<string, DictEntry>): void {
  saveJson(KEYS.DICT_CACHE, cache)
}

function removeDictCache(): void {
  remove(KEYS.DICT_CACHE)
}

// --- Theme ---

function getTheme(): string | null {
  return loadString(KEYS.THEME)
}

function setTheme(value: string): void {
  saveString(KEYS.THEME, value)
}

// --- Audio settings ---

function loadAudioSettings(): AudioSettings {
  return loadJson(KEYS.SETTINGS_AUDIO, { autoPlay: true })
}

function saveAudioSettings(settings: AudioSettings): void {
  saveJson(KEYS.SETTINGS_AUDIO, settings)
}

// --- Passages read ---

function getPassagesRead(): number[] {
  return loadJson(KEYS.PASSAGES_READ, [])
}

function markPassageRead(id: number): void {
  const list = getPassagesRead()
  if (!list.includes(id)) {
    list.push(id)
    saveJson(KEYS.PASSAGES_READ, list)
  }
}

export const Storage = {
  loadSrsData,
  saveSrsData,
  removeSrsData,
  loadDictCache,
  saveDictCache,
  removeDictCache,
  getTheme,
  setTheme,
  loadAudioSettings,
  saveAudioSettings,
  getPassagesRead,
  markPassageRead,
}
