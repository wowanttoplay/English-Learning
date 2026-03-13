import type { Language } from '@english-learning/shared'

export async function getAllLanguages(db: D1Database): Promise<Language[]> {
  const { results } = await db.prepare(
    'SELECT id, name, native_name as nativeName FROM languages ORDER BY name'
  ).all<Language>()
  return results ?? []
}
