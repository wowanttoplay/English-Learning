export interface LevelDef {
  id: string
  name: string
  order: number
  color: string
}

export const LEVELS: Record<string, LevelDef[]> = {
  en: [
    { id: 'A1', name: 'A1', order: 1, color: '#4caf50' },
    { id: 'A2', name: 'A2', order: 2, color: '#8bc34a' },
    { id: 'B1', name: 'B1', order: 3, color: '#2196f3' },
    { id: 'B2', name: 'B2', order: 4, color: '#1565c0' },
    { id: 'C1', name: 'C1', order: 5, color: '#9c27b0' },
    { id: 'C2', name: 'C2', order: 6, color: '#6a1b9a' },
  ],
  ja: [
    { id: 'N5', name: 'N5', order: 1, color: '#4caf50' },
    { id: 'N4', name: 'N4', order: 2, color: '#8bc34a' },
    { id: 'N3', name: 'N3', order: 3, color: '#2196f3' },
    { id: 'N2', name: 'N2', order: 4, color: '#1565c0' },
    { id: 'N1', name: 'N1', order: 5, color: '#9c27b0' },
  ],
}

export function getLevels(lang: string): LevelDef[] {
  return LEVELS[lang] ?? []
}

export function isValidLevel(lang: string, level: string): boolean {
  if (level === 'user') return true
  return getLevels(lang).some(l => l.id === level)
}

export function getLevelDef(lang: string, level: string): LevelDef | undefined {
  return getLevels(lang).find(l => l.id === level)
}
